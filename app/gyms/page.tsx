'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

type Gym = {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  photos?: any[];
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
};

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initMapAndSearch = () => {
      const dummyMap = document.createElement('div');
      const map = new window.google.maps.Map(dummyMap);

      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        query: 'gym in Penang',
        type: 'gym',
      };

      service.textSearch(request, (results: any[], status: string) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          const detailedGyms: Gym[] = [];
          let processed = 0;

          results.forEach((gym) => {
            service.getDetails(
              {
                placeId: gym.place_id,
                fields: ['name', 'formatted_address', 'rating', 'photos', 'geometry'],
              },
              (placeDetails: Gym | null, statusDetails: string) => {
                processed++;
                if (
                  statusDetails === window.google.maps.places.PlacesServiceStatus.OK &&
                  placeDetails
                ) {
                  detailedGyms.push(placeDetails);
                } else {
                  console.warn('Failed to get details for gym:', gym.name, statusDetails);
                  detailedGyms.push(gym);
                }

                if (processed === results.length) {
                  // Sort gyms alphabetically by name
                  detailedGyms.sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
                  );
                  setGyms(detailedGyms);
                  setLoading(false);
                }
              }
            );
          });
        } else {
          setError('Failed to fetch gyms using text search');
          setLoading(false);
        }
      });
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
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-8">Gyms in Penang</h1>
      {loading && <p className="text-lg">Loading gyms...</p>}
      {error && <p className="text-red-600 font-semibold">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {gyms.map((gym, idx) => {
          let photoUrl = '';

          if (gym.photos && gym.photos.length > 0) {
            photoUrl = gym.photos[0].getUrl({ maxWidth: 400 });
          } else if (gym.geometry && gym.geometry.location) {
            const lat = gym.geometry.location.lat();
            const lng = gym.geometry.location.lng();
            photoUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
          }

          return (
            <article
              key={idx}
              className="border rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={gym.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  No photo available
                </div>
              )}

              <div className="p-4">
                <h2 className="text-xl font-semibold mb-1">{gym.name}</h2>
                <p className="text-gray-700 mb-2">
                  {gym.formatted_address || 'Address not available'}
                </p>
                <p className="text-yellow-600 font-medium">
                  {gym.rating ? `⭐ ${gym.rating.toFixed(1)}` : 'No reviews'}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
