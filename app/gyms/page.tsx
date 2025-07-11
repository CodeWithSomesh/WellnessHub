/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Heart, MessageSquare, X, Clock, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
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
  formatted_phone_number?: string;
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
  phoneNumber: string;
  rating: number;
  photoUrl: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// Malaysian states with All option at the start
const malaysian_states = [
  'All',
  'Johor',
  'Kedah',
  'Kelantan',
  'Kuala Lumpur',
  'Labuan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Putrajaya',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu'
];

export default function GymsPage() {
  const { user, isLoaded } = useUser();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [favorites, setFavorites] = useState<FavoriteGym[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedState, setSelectedState] = useState('Penang');
  const [showFilters, setShowFilters] = useState(false)
  const [gymsByState, setGymsByState] = useState<{ [key: string]: Gym[] }>({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalGyms, setTotalGyms] = useState(0);
  const [gymsPerPage] = useState(12);

  // Modal states
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [comment, setComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<FavoriteGym | null>(null);

  const isGymOpen = (openingHours?: {
    weekday_text?: string[];
    periods?: Array<{
      close?: { day: number; time: string };
      open: { day: number; time: string };
    }>;
  }) => {
    if (!openingHours) return null;

    // If any line says "Open 24 hours", consider gym always open
    if (
      openingHours.weekday_text &&
      openingHours.weekday_text.some(text =>
        text.toLowerCase().includes("open 24 hours")
      )
    ) {
      return true;
    }

    if (!openingHours.periods) return null;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format

    // Today's periods
    const todayPeriods = openingHours.periods.filter(
      period => period.open.day === currentDay
    );

    if (todayPeriods.length === 0) {
      // Check for periods without close time (could be 24-hour marker)
      const allDayPeriods = openingHours.periods.filter(period => !period.close);
      if (allDayPeriods.length > 0) return true;
      return false;
    }

    for (const period of todayPeriods) {
      const openTime = parseInt(period.open.time);
      const closeTime = period.close ? parseInt(period.close.time) : 2359;

      if (period.close && period.close.day !== period.open.day) {
        // Overnight span
        if (currentTime >= openTime || currentTime <= closeTime) return true;
      } else {
        if (closeTime < openTime) {
          if (currentTime >= openTime || currentTime <= closeTime) return true;
        } else {
          if (currentTime >= openTime && currentTime < closeTime) return true;
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
          formatted_phone_number: selectedGym.formatted_phone_number,
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
    setCurrentPage(0); // Reset UI pagination

    // If "All" is selected, combine all previously fetched state data
    if (state === 'All') {
      const allGyms: Gym[] = [];
      const seenPlaceIds = new Set<string>();
      
      // Combine gyms from all states
      Object.values(gymsByState).forEach(stateGyms => {
        stateGyms.forEach(gym => {
          if (gym.place_id && !seenPlaceIds.has(gym.place_id)) {
            seenPlaceIds.add(gym.place_id);
            allGyms.push(gym);
          }
        });
      });
      
      // Sort alphabetically
      allGyms.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      
      setGyms(allGyms);
      setLoading(false);
      return;
    }

    // If we already have data for this state, use it
    if (gymsByState[state]) {
      setGyms(gymsByState[state]);
      setLoading(false);
      return;
    }

    // Otherwise, fetch new data for this state
    const allGyms: Gym[] = [];
    const seenPlaceIds = new Set<string>();

    const initMapAndSearch = () => {
      const dummyMap = document.createElement('div');
      const map = new window.google.maps.Map(dummyMap);
      const service = new window.google.maps.places.PlacesService(map);

      const query = `gym in ${state}, Malaysia`;
      const request = {
        query,
        type: 'gym',
      };

      const fetchResults = (results: any[], status: string, pagination?: any) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) {
          setError(`Failed to fetch gyms in ${state}`);
          setLoading(false);
          return;
        }

        let processed = 0;

        results.forEach((gym) => {
          if (!gym.place_id) {
            console.warn('Gym missing place_id in initial results:', gym);
            processed++;
            if (processed === results.length) {
              if (pagination && pagination.hasNextPage) {
                setTimeout(() => pagination.nextPage(), 2000);
              } else {
                allGyms.sort((a, b) =>
                  a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
                );
                
                // Store the results for this state
                setGymsByState(prev => ({
                  ...prev,
                  [state]: allGyms
                }));
                
                setGyms(allGyms);
                setLoading(false);
              }
            }
            return;
          }

          try {
            service.getDetails(
              {
                placeId: gym.place_id,
                fields: [
                  'place_id',
                  'name',
                  'formatted_address',
                  'formatted_phone_number',
                  'rating',
                  'photos',
                  'geometry',
                  'opening_hours',
                ],
              },
              async (placeDetails: Gym | null, statusDetails: string) => {
                processed++;

                if (
                  statusDetails === window.google.maps.places.PlacesServiceStatus.OK &&
                  placeDetails &&
                  placeDetails.place_id &&
                  placeDetails.opening_hours
                ) {
                  if (!placeDetails.place_id) {
                    placeDetails.place_id = gym.place_id;
                  }

                  const isUnique = !seenPlaceIds.has(placeDetails.place_id);
                  const validImagery = await hasValidImagery(placeDetails);

                  if (isUnique && validImagery) {
                    seenPlaceIds.add(placeDetails.place_id);
                    allGyms.push(placeDetails);
                  }
                } else {
                  console.warn('Gym details missing or invalid:', {
                    statusDetails,
                    placeDetails: placeDetails
                      ? {
                          name: placeDetails.name,
                          place_id: placeDetails.place_id,
                          hasOpeningHours: !!placeDetails.opening_hours,
                        }
                      : null,
                  });
                }

                if (processed === results.length) {
                  if (pagination && pagination.hasNextPage) {
                    setTimeout(() => pagination.nextPage(), 2000);
                  } else {
                    allGyms.sort((a, b) =>
                      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
                    );
                    
                    // Store the results for this state
                    setGymsByState(prev => ({
                      ...prev,
                      [state]: allGyms
                    }));
                    
                    setGyms(allGyms);
                    setLoading(false);
                  }
                }
              }
            );
          } catch (error: any) {
            console.error('Error fetching gym details:', error);

            if (error.response?.status === 429) {
              setError('Too many requests. Please try again in a moment.');
            } else if (error.response?.status >= 500) {
              setError('Server error. Please try again later.');
            } else if (error.code === 'NETWORK_ERROR') {
              setError('Network error. Please check your connection.');
            } else {
              setError(`Failed to fetch gyms in ${state}. Please try again.`);
            }

            setLoading(false);
          }
        });
      };

      service.textSearch(request, fetchResults);
    };

    try {
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
    } catch (error: any) {
      console.error('Error initializing Google Maps:', error);

      if (error.response?.status === 429) {
        setError('Too many requests. Please try again in a moment.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection.');
      } else {
        setError(`Failed to search gyms in ${state}.`);
      }

      setLoading(false);
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

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(0)
  };

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

  useEffect(() => {
    if (searchTerm.trim()) {
      setTotalPages(Math.ceil(filteredGyms.filtered.length / gymsPerPage));
      setTotalGyms(filteredGyms.filtered.length);
    }
    else {
      setTotalPages(Math.ceil(gyms.length / gymsPerPage));
      setTotalGyms(gyms.length);
    }
  });

  const filteredGyms = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    
    const filtered = gyms.filter(gym => {
      const hoursInfo = formatOpeningHours(gym.opening_hours);

      const matchesSearch =
        !searchTerm ||
        gym.name.toLowerCase().includes(lowerSearch) ||
        gym.formatted_address?.toLowerCase().includes(lowerSearch) ||
        gym.formatted_phone_number?.toLowerCase().includes(lowerSearch) ||
        gym.rating?.toString().includes(lowerSearch) ||
        hoursInfo?.todayHours.toString().includes(lowerSearch)

      const matchesState = !selectedState || malaysian_states?.includes(selectedState);

      return matchesSearch && matchesState;
    });

    const startIndex = currentPage * gymsPerPage;
    const endIndex = startIndex + gymsPerPage;
    const pageFiltered = filtered.slice(startIndex, endIndex);

    return { filtered, pageFiltered };
  }, [gyms, searchTerm, selectedState, currentPage, gymsPerPage]);

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

        {/* Search and Filter Section */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6 pb-1">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search gyms..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-cyan-600 hover:text-cyan-700"
            >
              <Filter size={18} />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
          </div>

          {/* State Filter Section */}
          {showFilters && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-2">
                {malaysian_states.map((state) => (
                  <button
                    key={state}
                    onClick={() => handleStateChange(state)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedState === state
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
          
        {/* Error or No Results */}
        {totalPages === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No gyms found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setSelectedState('All');
                setSearchTerm('');
                searchGyms('All');
              }}
              className="text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Gyms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
          {filteredGyms.pageFiltered.map((gym, idx) => {
            let photoUrl = '';

            if (gym.photos && gym.photos.length > 0) {
              photoUrl = gym.photos[0].getUrl({ maxWidth: 500 });
            } else if (gym.geometry && gym.geometry.location) {
              const lat = gym.geometry.location.lat();
              const lng = gym.geometry.location.lng();
              photoUrl = `https://maps.googleapis.com/maps/api/streetview?size=500x400&location=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
            }

            const hoursInfo = formatOpeningHours(gym.opening_hours);
            const openStatus = getOpenStatusForHours(gym);

            return (
              <div key={`${gym.place_id}-${idx}`} className="bg-gradient-to-br from-cyan-50 to-blue-50 relative rounded-xl overflow-hidden border-4 border-black hover:border-cyan-500 shadow-[6px_6px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#00BCD4] hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-200 flex flex-col group">
                
                {/* Heart Icon - Enhanced */}
                <button
                  onClick={() => handleHeartClick(gym)}
                  className={`absolute top-4 right-4 z-10 p-3 rounded-full backdrop-blur-md transition-all duration-200 shadow-lg ${
                    gym.place_id && isFavorited(gym.place_id)
                      ? 'bg-red-500 text-white hover:bg-red-600 scale-110'
                      : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500 hover:scale-110'
                  }`}
                >
                  <Heart 
                    size={22} 
                    className={`${gym.place_id && isFavorited(gym.place_id) ? 'fill-current' : ''} transition-transform duration-200`} 
                  />
                </button>

                {/* Image Section - Enhanced */}
                <div className="relative h-64 md:h-72 w-full overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={gym.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🏋️‍♂️</div>
                        <span className="text-sm font-medium">No photo available</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge Overlay */}
                  <div className="absolute top-3 left-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border-2 ${
                      openStatus.text === 'Open' 
                        ? 'bg-green-500/90 text-white border-green-300' 
                        : openStatus.text === 'Closed'
                        ? 'bg-red-500/90 text-white border-red-300'
                        : 'bg-gray-500/90 text-white border-gray-300'
                    }`}>
                      {openStatus.text}
                    </div>
                  </div>
                </div>

                {/* Content Section - Enhanced */}
                <div className="p-6 border-t-4 border-cyan-400 flex-1 flex flex-col bg-white/80 backdrop-blur-sm">
                  
                  {/* Gym Name */}
                  <h3 className="font-bold text-xl text-gray-800 mb-4 line-clamp-2 group-hover:text-cyan-700 transition-colors duration-200">
                    {gym.name}
                  </h3>
                  
                  {/* Address - Full width */}
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-cyan-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-cyan-600 text-sm">📍</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed flex-1">
                      {gym.formatted_address || 'Address not available'}
                    </p>
                  </div>

                  {/* Info Grid - Responsive Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    
                    {/* Phone */}
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm">📞</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium truncate">
                        {gym.formatted_phone_number || 'No phone number'}
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-sm">⭐</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {gym.rating ? (
                          <>
                            <span className="text-lg font-bold text-yellow-600">
                              {gym.rating.toFixed(1)}
                            </span>
                            <div className="flex space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <span 
                                  key={i} 
                                  className={`text-sm ${
                                    i < Math.floor(gym.rating) 
                                      ? 'text-yellow-500' 
                                      : i < gym.rating 
                                      ? 'text-yellow-300' 
                                      : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500 italic">No reviews yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Opening Hours - Full width */}
                  <div className="flex items-start space-x-3 mb-6">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <Clock size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      {hoursInfo ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Today:</span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              openStatus.text === 'Open' 
                                ? 'bg-green-100 text-green-700' 
                                : openStatus.text === 'Closed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {openStatus.text}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {hoursInfo.todayHours.replace(/^[A-Za-z]+:\s*/, '')}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Hours not available</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            openStatus.text === 'Open' 
                              ? 'bg-green-100 text-green-700' 
                              : openStatus.text === 'Closed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {openStatus.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment Section - Enhanced */}
                  {gym.place_id && isFavorited(gym.place_id) && getFavoriteData(gym.place_id)?.comment && (
                    <div className="mt-auto">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                            <MessageSquare size={14} className="text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-blue-800 mb-1">Your Note:</p>
                            <p className="text-sm text-blue-700 line-clamp-3 leading-relaxed">
                              {getFavoriteData(gym.place_id)?.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hover Effect Indicator */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
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
            Showing {indexOfFirstGym + 1}-{Math.min(indexOfLastGym, totalGyms)} of {totalGyms} gyms in {selectedState === 'All' ? 'Malaysia' : selectedState}
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