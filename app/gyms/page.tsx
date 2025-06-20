'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Heart, MessageSquare, X, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

declare global {
  interface Window {
    google: any;
  }
}

type Gym = {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating: number;
  photos: any[];
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  opening_hours?: {
    weekday_text?: string[];
    periods?: Array<{
      close?: { day: number; time: string };
      open: { day: number; time: string };
    }>;
  };
};

// Define the favourite gym type
interface FavoriteGym {
  _id: string;
  gymId: string;
  gymName: string;
  address: string;
  rating: number;
  photoUrl: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// Malaysian states with All option at the start
const MALAYSIAN_STATES = [
  { value: 'All', label: 'All' },
  { value: 'Johor', label: 'Johor' },
  { value: 'Kedah', label: 'Kedah' },
  { value: 'Kelantan', label: 'Kelantan' },
  { value: 'Kuala Lumpur', label: 'Kuala Lumpur' },
  { value: 'Labuan', label: 'Labuan' },
  { value: 'Melaka', label: 'Melaka' },
  { value: 'Negeri Sembilan', label: 'Negeri Sembilan' },
  { value: 'Pahang', label: 'Pahang' },
  { value: 'Penang', label: 'Penang' },
  { value: 'Perak', label: 'Perak' },
  { value: 'Perlis', label: 'Perlis' },
  { value: 'Putrajaya', label: 'Putrajaya' },
  { value: 'Sabah', label: 'Sabah' },
  { value: 'Sarawak', label: 'Sarawak' },
  { value: 'Selangor', label: 'Selangor' },
  { value: 'Terengganu', label: 'Terengganu' }
];

export default function GymsPage() {
  const { user, isLoaded } = useUser();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [favorites, setFavorites] = useState<FavoriteGym[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('Penang');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [gymsPerPage] = useState(12);

  // Modal states
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [comment, setComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<FavoriteGym | null>(null);

  // Function to check if gym is currently open
  const isGymOpen = (openingHours?: { weekday_text?: string[]; periods?: Array<{ close?: { day: number; time: string }; open: { day: number; time: string }; }> }) => {
    if (!openingHours || !openingHours.periods) return null;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format

    // Find today's periods
    const todayPeriods = openingHours.periods.filter(period => period.open.day === currentDay);
    
    if (todayPeriods.length === 0) {
      // Check if it's a 24/7 place or closed today
      const allDayPeriods = openingHours.periods.filter(period => !period.close);
      if (allDayPeriods.length > 0) return true; // 24/7
      return false; // Closed today
    }

    // Check each period for today
    for (const period of todayPeriods) {
      const openTime = parseInt(period.open.time);
      let closeTime = period.close ? parseInt(period.close.time) : 2359;
      
      // Handle overnight periods (e.g., open until next day)
      if (period.close && period.close.day !== period.open.day) {
        // This period goes to the next day
        if (currentTime >= openTime || currentTime <= closeTime) {
          return true;
        }
      } else {
        // Normal same-day period
        if (closeTime < openTime) {
          // Overnight within same day (rare but possible)
          if (currentTime >= openTime || currentTime <= closeTime) {
            return true;
          }
        } else {
          // Normal period
          if (currentTime >= openTime && currentTime < closeTime) {
            return true;
          }
        }
      }
    }

    return false;
  };

  // Get open status with color and text for opening hours section
  const getOpenStatusForHours = (gym: Gym) => {
    const isOpen = isGymOpen(gym.opening_hours);
    
    if (isOpen === null) {
      return {
        text: 'Hours Unknown',
        textColor: 'text-gray-600',
      };
    }
    
    if (isOpen) {
      return {
        text: 'Open',
        textColor: 'text-green-700',
      };
    }
    
    return {
      text: 'Closed',
      textColor: 'text-red-700',
    };
  };

  // Fetch user's favorite gyms
  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('/api/favGyms');
      setFavorites(response.data.favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  // Check if gym is already favorited
  const isFavorited = (gymId: string) => {
    return favorites.some(fav => fav.gymId === gymId);
  };

  // Get favorite data for a gym
  const getFavoriteData = (gymId: string) => {
    return favorites.find(fav => fav.gymId === gymId);
  };

  // Handle heart click
  const handleHeartClick = (gym: Gym) => {
    if (!user) {
      alert('Please sign in to add favorites');
      return;
    }

    // Check if place_id exists
    if (!gym.place_id) {
      console.error('ERROR: gym.place_id is undefined or null');
      alert('Error: Unable to identify this gym. Please try again.');
      return;
    }

    const favoriteData = getFavoriteData(gym.place_id);
    
    if (favoriteData) {
      // Already favorited, open modal to edit comment
      setEditingFavorite(favoriteData);
      setComment(favoriteData.comment);
      setSelectedGym(gym);
      setShowCommentModal(true);
    } else {
      // Not favorited, open modal to add
      setEditingFavorite(null);
      setComment('');
      setSelectedGym(gym);
      setShowCommentModal(true);
    }
  };

  // Add to favorites
  const addToFavorites = async () => {
    if (!selectedGym || !user) return;

    if (!selectedGym.place_id) {
      alert('Error: Unable to save this gym. Missing place ID.');
      return;
    }
    
    setIsUpdating(true);
    try {
      // Get photo URL
      let photoUrl = '';
      if (selectedGym.photos && selectedGym.photos.length > 0) {
        photoUrl = selectedGym.photos[0].getUrl({ maxWidth: 400 });
      } else if (selectedGym.geometry && selectedGym.geometry.location) {
        const lat = selectedGym.geometry.location.lat();
        const lng = selectedGym.geometry.location.lng();
        photoUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      }

      await axios.post('/api/favGyms', {
        gym: {
          place_id: selectedGym.place_id,
          name: selectedGym.name,
          formatted_address: selectedGym.formatted_address,
          rating: selectedGym.rating,
          photoUrl
        },
        comment
      });
      
      // Refresh favorites
      await fetchFavorites();
      setShowCommentModal(false);
      setComment('');
      setSelectedGym(null);
    } catch (error: any) {
      console.error('Error adding to favorites:', error);
      if (error.response?.status === 409) {
        alert('This gym is already in your favorites!');
      } else {
        alert('Failed to add to favorites');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Update favorite comment
  const updateFavoriteComment = async () => {
    if (!editingFavorite) return;
    
    setIsUpdating(true);
    try {
      await axios.put(`/api/favGyms/${editingFavorite._id}`, {
        comment
      });
      
      // Refresh favorites
      await fetchFavorites();
      setShowCommentModal(false);
      setComment('');
      setEditingFavorite(null);
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment');
    } finally {
      setIsUpdating(false);
    }
  };

  // Remove from favorites
  const removeFromFavorites = async () => {
    if (!editingFavorite) return;
    
    setIsUpdating(true);
    try {
      await axios.delete(`/api/favGyms/${editingFavorite._id}`);
      
      // Refresh favorites
      await fetchFavorites();
      setShowCommentModal(false);
      setComment('');
      setEditingFavorite(null);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      alert('Failed to remove from favorites');
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to check if Street View image URL actually loads
  const validateStreetViewImage = (lat: number, lng: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      const img = new Image();
      
      img.onload = () => {
        // Check if the image has reasonable dimensions (not a tiny error image)
        if (img.naturalWidth > 100 && img.naturalHeight > 100) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      
      img.onerror = () => {
        resolve(false);
      };
      
      // Set a timeout to avoid hanging
      setTimeout(() => {
        resolve(false);
      }, 5000);
      
      img.src = imageUrl;
    });
  };

  // Helper function to check if Street View exists at location
  const checkStreetViewExists = (lat: number, lng: number): Promise<boolean> => {
    return new Promise(async (resolve) => {
      const streetViewService = new window.google.maps.StreetViewService();
      streetViewService.getPanorama(
        { location: { lat, lng }, radius: 100 },
        async (data: any, status: string) => {
          const hasStreetView = status === window.google.maps.StreetViewStatus.OK;
          
          if (hasStreetView) {
            // Double-check by trying to load the actual image
            const imageLoads = await validateStreetViewImage(lat, lng);
            resolve(imageLoads);
          } else {
            resolve(false);
          }
        }
      );
    });
  };

  // Helper function to check if gym has valid imagery (photos OR confirmed street view)
  const hasValidImagery = async (gym: any): Promise<boolean> => {
    // If gym has photos, it's valid
    if (gym.photos && gym.photos.length > 0) {
      return true;
    }
    
    // If gym has coordinates, check if Street View exists
    if (gym.geometry && gym.geometry.location) {
      const lat = gym.geometry.location.lat();
      const lng = gym.geometry.location.lng();
      const hasStreetView = await checkStreetViewExists(lat, lng);
      return hasStreetView;
    }
    
    return false; // No photos and no valid coordinates
  };

  // Search gyms by state
  const searchGyms = (state: string) => {
    setLoading(true);
    setError('');
    setGyms([]);
    setCurrentPage(0); // Reset UI pagination
    
    const allGyms: Gym[] = [];
    const processedPlaceIds = new Set<string>(); // Track processed place_ids to avoid duplicates
    
    const initMapAndSearch = () => {
      const dummyMap = document.createElement('div');
      const map = new window.google.maps.Map(dummyMap);
      const service = new window.google.maps.places.PlacesService(map);
      
      const query = state === 'All' ? 'gym in Malaysia' : `gym in ${state}, Malaysia`;
      const request = {
        query,
        type: 'gym',
      };

      const fetchResults = (results: any[], status: string, pagination?: any) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) {
          const locationText = state === 'All' ? 'Malaysia' : state;
          setError(`Failed to fetch gyms in ${locationText}`);
          setLoading(false);
          return;
        }

        let processed = 0;
        
        results.forEach((gym) => {
          // IMPORTANT: Make sure we have place_id from the initial results
          if (!gym.place_id || processedPlaceIds.has(gym.place_id)) {
            processed++;
            if (processed === results.length) {
              if (pagination && pagination.hasNextPage) {
                setTimeout(() => pagination.nextPage(), 2000);
              } else {
                allGyms.sort((a, b) => 
                  a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
                );
                setGyms(allGyms);
                setLoading(false);
              }
            }
            return;
          }

          // Mark this place_id as being processed
          processedPlaceIds.add(gym.place_id);

          service.getDetails(
            {
              placeId: gym.place_id,
              fields: ['place_id', 'name', 'formatted_address', 'rating', 'photos', 'geometry', 'opening_hours'],
            },
            async (placeDetails: Gym | null, statusDetails: string) => {
              try {
                processed++;
                
                if (
                  statusDetails === window.google.maps.places.PlacesServiceStatus.OK &&
                  placeDetails &&
                  placeDetails.place_id && // Ensure place_id exists
                  placeDetails.opening_hours // Only include if opening hours exist
                ) {
                  // Check if gym has valid imagery (photos or confirmed street view)
                  const hasImagery = await hasValidImagery(placeDetails);
                  
                  if (hasImagery) {
                    // Double-check that place_id is preserved
                    if (!placeDetails.place_id) {
                      placeDetails.place_id = gym.place_id;
                    }
                    
                    allGyms.push(placeDetails);
                  }
                }
              } catch (error) {
                console.error(`Error processing gym ${placeDetails?.name}:`, error);
              }

              if (processed === results.length) {
                if (pagination && pagination.hasNextPage) {
                  setTimeout(() => pagination.nextPage(), 2000);
                } else {
                  allGyms.sort((a, b) => 
                    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
                  );
                  setGyms(allGyms);
                  setLoading(false);
                }
              }
            }
          );
        });
      };

      service.textSearch(request, fetchResults);
    };

    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = initMapAndSearch;
      script.onerror = () => {
        setError('Failed to load Google Maps script');
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initMapAndSearch();
    }
  };

  // Handle state change
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setCurrentPage(0); // Reset to first page when changing state
    searchGyms(state);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pagination calculations
  const indexOfLastGym = (currentPage + 1) * gymsPerPage;
  const indexOfFirstGym = currentPage * gymsPerPage;
  const currentGyms = gyms.slice(indexOfFirstGym, indexOfLastGym);
  const totalPages = Math.ceil(gyms.length / gymsPerPage);

  // Handle pagination
  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1)
  }

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  // Format opening hours for display
  const formatOpeningHours = (openingHours?: { weekday_text?: string[] }) => {
    if (!openingHours) return null;
    
    const today = new Date().getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[today];
    
    if (openingHours.weekday_text && openingHours.weekday_text.length > 0) {
      const todayHours = openingHours.weekday_text.find(day => 
        day.toLowerCase().includes(todayName.toLowerCase())
      );
      
      return {
        todayHours: todayHours || openingHours.weekday_text[0],
        allHours: openingHours.weekday_text
      };
    }
    
    return null;
  };

  useEffect(() => {
    searchGyms(selectedState);
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      fetchFavorites();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    // Reset to first page when gyms change
    setCurrentPage(0);
  }, [gyms]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading gyms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => searchGyms(selectedState)}
            className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Gyms in Malaysia</h1>
          <p className="text-gray-600 text-lg">Find the perfect gym for your fitness journey</p>
        </div>

        {/* State Filter Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Filter by State:</h3>
          <div className="flex flex-wrap gap-2">
            {MALAYSIAN_STATES.map((state) => (
              <button
                key={state.value}
                onClick={() => handleStateChange(state.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedState === state.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {state.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gyms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {currentGyms.map((gym, idx) => {
            let photoUrl = '';

            if (gym.photos && gym.photos.length > 0) {
              photoUrl = gym.photos[0].getUrl({ maxWidth: 400 });
            } else if (gym.geometry && gym.geometry.location) {
              const lat = gym.geometry.location.lat();
              const lng = gym.geometry.location.lng();
              photoUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
            }

            const hoursInfo = formatOpeningHours(gym.opening_hours);
            const openStatus = getOpenStatusForHours(gym);

            return (
              <div key={`${gym.place_id}-${idx}`} className="bg-cyan-50 relative rounded-lg overflow-hidden font-bold border-4 border-black hover:border-cyan-500 shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#10b981] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 flex flex-col">
                {/* Heart Icon */}
                <button
                  onClick={() => handleHeartClick(gym)}
                  className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all ${
                    gym.place_id && isFavorited(gym.place_id)
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                  }`}
                >
                  <Heart 
                    size={20} 
                    className={gym.place_id && isFavorited(gym.place_id) ? 'fill-current' : ''} 
                  />
                </button>

                <div className="relative h-72 w-full">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={gym.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      No photo available
                    </div>
                  )}
                </div>

                <div className="p-4 border-t-2 border-cyan-300 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg lg:text-xl text-gray-800 mb-2">
                    {gym.name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p><span className="font-medium">Address:</span> {gym.formatted_address || 'Address not available'}</p>
                    <p className="text-yellow-600 font-medium">
                      {gym.rating ? `⭐ ${gym.rating.toFixed(1)}` : 'No reviews'}
                    </p>
                    {/* Opening Hours with integrated Open/Closed status */}
                    <div>
                      {hoursInfo ? (
                        <div className="flex items-center justify-between">
                          {/* Clock and Hours */}
                          <div className="flex items-center space-x-2">
                            <Clock size={16} className={`${openStatus.textColor}`} />
                            <span className={`text-sm font-medium ${openStatus.textColor}`}>Today:</span>
                            <span className={`text-xs ${openStatus.textColor}`}>
                              {hoursInfo.todayHours.replace(/^[A-Za-z]+:\s*/, '')}
                            </span>
                          </div>

                          {/* Open/Closed */}
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${openStatus.textColor}`}>
                            {openStatus.text}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-500">Hours not available</span>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${openStatus.textColor}`}>
                            {openStatus.text}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Show comment if favorited */}
                  {gym.place_id && isFavorited(gym.place_id) && getFavoriteData(gym.place_id)?.comment && (
                    <div className="p-2 bg-blue-50 rounded-lg border-2 border-gray-400 flex items-start">
                      <MessageSquare size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm text-blue-800 line-clamp-3">
                        {getFavoriteData(gym.place_id)?.comment}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <ChevronLeft />
          </button>
          <span className="text-gray-600 font-medium">
            Page {currentPage + 1}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage >= totalPages - 1
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <ChevronRight />
          </button>
        </div>

        {/* Results Info */}
        <div className="text-center mt-8 mb-4 text-gray-600">
          <p>
            Showing {indexOfFirstGym + 1}-{Math.min(indexOfLastGym, gyms.length)} of {gyms.length} gyms in {selectedState === 'All' ? 'Malaysia' : selectedState}
          </p>
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingFavorite ? 'Edit Note' : 'Add to Favorites'}
              </h3>
              <button 
                onClick={() => setShowCommentModal(false)}
                className="text-gray-500 hover:text-white hover:bg-red-500 rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            {selectedGym && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800">{selectedGym.name}</h4>
                <p className="text-sm text-gray-600">{selectedGym.formatted_address}</p>
                {selectedGym.rating && (
                  <p className="text-sm text-yellow-600">⭐ {selectedGym.rating.toFixed(1)}</p>
                )}
                {/* Show opening hours in modal */}
                {formatOpeningHours(selectedGym.opening_hours) && (
                  <div className="mt-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{formatOpeningHours(selectedGym.opening_hours)?.todayHours.replace(/^[A-Za-z]+:\s*/, '')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a personal note (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g., Great equipment, close to home, try the spinning class..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              {editingFavorite ? (
                <>
                  <button
                    onClick={updateFavoriteComment}
                    disabled={isUpdating}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Updating...' : 'Update Note'}
                  </button>
                  <button
                    onClick={removeFromFavorites}
                    disabled={isUpdating}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Removing...' : 'Remove'}
                  </button>
                </>
              ) : (
                <button
                  onClick={addToFavorites}
                  disabled={isUpdating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Adding...' : 'Add to Favorites'}
                </button>
              )}
              <button
                onClick={() => setShowCommentModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-red-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}