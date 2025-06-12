/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Heart, MessageSquare, X, MapPin, Star, Phone } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

// Define the restaurant type
interface Restaurant {
  id: string
  name: string
  cuisine: string
  address: string
  phone?: string
  rating?: number
  price_level?: number
  photo_url?: string
  website?: string
  description?: string
}

interface FavoriteRestaurant {
  _id: string
  restaurantId: string
  restaurantName: string
  cuisine: string
  address: string
  phone?: string
  rating?: number
  price_level?: number
  photo_url?: string
  comment: string
  createdAt: string
  updatedAt: string
}

export default function RestaurantsPage() {
  // Initialize State 
  const { user, isLoaded } = useUser()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCuisine, setSelectedCuisine] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(0)
  const [limit] = useState(12) // Limit to 12 restaurants per page
  
  // Modal states
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [comment, setComment] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingFavorite, setEditingFavorite] = useState<FavoriteRestaurant | null>(null)

  // Fetch restaurants from your API
  const fetchRestaurants = async (offset = 0, cuisineFilter = '') => {
    setLoading(true)
    setError(null)
    
    try {
      // Your restaurant API call
      const options = {
        method: 'GET',
        url: 'https://exercisedb.p.rapidapi.com/exercises', // Replace with your restaurant API URL
        params: {
          limit: limit.toString(),
          offset: offset.toString()
        },
        headers: {
          'x-rapidapi-key': 'd58f648037mshc9727b6fe21b288p1dbfc3jsnfecc41c1ab53',
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com' // Replace with your restaurant API host
        }
      }

      console.log('Making API request to:', options.url)
      console.log('With headers:', options.headers)
      
      const response = await axios.request(options)
      
      // Transform the API response to match your Restaurant interface
      const transformedData: Restaurant[] = response.data.map((item: any, index: number) => ({
        id: item.id || `restaurant_${offset + index}`,
        name: item.name || `Restaurant ${offset + index}`,
        cuisine: item.cuisine || 'International',
        address: item.address || `${123 + index} Main St, City, State`,
        phone: item.phone || `(555) ${100 + index}-${1000 + index}`,
        rating: item.rating || Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        price_level: item.price_level || Math.floor(Math.random() * 4) + 1,
        photo_url: item.photo_url || item.image,
        description: item.description || 'Great dining experience'
      }))
      
      // Apply cuisine filter if selected
      const filteredData = cuisineFilter 
        ? transformedData.filter(restaurant => 
            restaurant.cuisine.toLowerCase().includes(cuisineFilter.toLowerCase())
          )
        : transformedData
      
      setRestaurants(filteredData)
      
    } catch (err: any) {
      console.error('Error fetching restaurants:', err)
      
      if (err.response?.status === 403) {
        setError('API Access Denied (403). Please check your RapidAPI subscription and API key.')
      } else if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please try again later.')
      } else if (err.response?.status === 404) {
        setError('API endpoint not found. Please check the URL.')
      } else {
        setError(`Failed to fetch restaurants: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch user's favorite restaurants
  const fetchFavorites = async () => {
    if (!user) return
    
    try {
      const response = await axios.get('/api/favRestaurants')
      setFavorites(response.data.favorites)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  // Check if restaurant is already favorited
  const isFavorited = (restaurantId: string) => {
    return favorites.some(fav => fav.restaurantId === restaurantId)
  }

  // Get favorite data for a restaurant
  const getFavoriteData = (restaurantId: string) => {
    return favorites.find(fav => fav.restaurantId === restaurantId)
  }

  // Handle heart click
  const handleHeartClick = (restaurant: Restaurant) => {
    if (!user) {
      alert('Please sign in to add favorites')
      return
    }

    const favoriteData = getFavoriteData(restaurant.id)
    
    if (favoriteData) {
      // Already favorited, open modal to edit comment
      setEditingFavorite(favoriteData)
      setComment(favoriteData.comment)
      setSelectedRestaurant(restaurant)
      setShowCommentModal(true)
    } else {
      // Not favorited, open modal to add
      setEditingFavorite(null)
      setComment('')
      setSelectedRestaurant(restaurant)
      setShowCommentModal(true)
    }
  }

  // Add to favorites
  const addToFavorites = async () => {
    if (!selectedRestaurant || !user) return
    
    setIsUpdating(true)
    try {
      await axios.post('/api/favRestaurants', {
        restaurant: selectedRestaurant,
        comment
      })
      
      // Refresh favorites
      await fetchFavorites()
      setShowCommentModal(false)
      setComment('')
      setSelectedRestaurant(null)
    } catch (error: any) {
      console.error('Error adding to favorites:', error)
      if (error.response?.status === 409) {
        alert('This restaurant is already in your favorites!')
      } else {
        alert('Failed to add to favorites')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  // Update favorite comment
  const updateFavoriteComment = async () => {
    if (!editingFavorite) return
    
    setIsUpdating(true)
    try {
      await axios.put(`/api/favRestaurants/${editingFavorite._id}`, {
        comment
      })
      
      // Refresh favorites
      await fetchFavorites()
      setShowCommentModal(false)
      setComment('')
      setEditingFavorite(null)
    } catch (error) {
      console.error('Error updating comment:', error)
      alert('Failed to update comment')
    } finally {
      setIsUpdating(false)
    }
  }

  // Remove from favorites
  const removeFromFavorites = async () => {
    if (!editingFavorite) return
    
    setIsUpdating(true)
    try {
      await axios.delete(`/api/favRestaurants/${editingFavorite._id}`)
      
      // Refresh favorites
      await fetchFavorites()
      setShowCommentModal(false)
      setComment('')
      setEditingFavorite(null)
    } catch (error) {
      console.error('Error removing from favorites:', error)
      alert('Failed to remove from favorites')
    } finally {
      setIsUpdating(false)
    }
  }

  // Cuisines for filtering
  const cuisines = [
    'Italian', 'Chinese', 'Mexican', 'Japanese', 'Indian', 
    'American', 'Thai', 'French', 'Mediterranean', 'Korean'
  ]

  useEffect(() => {
    fetchRestaurants(currentPage * limit, selectedCuisine)
  }, [currentPage, limit, selectedCuisine])

  useEffect(() => {
    if (isLoaded && user) {
      fetchFavorites()
    }
  }, [isLoaded, user])

  const handleCuisineChange = (cuisine: string) => {
    setSelectedCuisine(cuisine)
    setCurrentPage(0) // Reset to first page
  }

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1)
  }

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  // Render price level
  const renderPriceLevel = (level?: number) => {
    if (!level) return null
    return '$'.repeat(level)
  }

  // Render rating stars
  const renderRating = (rating?: number) => {
    if (!rating) return null
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />)
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} className="fill-yellow-400/50 text-yellow-400" />)
    }
    return (
      <div className="flex items-center space-x-1">
        <div className="flex">{stars}</div>
        <span className="text-sm text-gray-600">({rating})</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchRestaurants(currentPage * limit, selectedCuisine)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Local Restaurants</h1>
          <p className="text-gray-600 text-lg">Discover amazing dining experiences in your area</p>
        </div>

        {/* Filter Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Filter by Cuisine:</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCuisineChange('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCuisine === ''
                  ? 'bg-[#D433F8] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => handleCuisineChange(cuisine)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCuisine === cuisine
                    ? 'bg-[#D433F8] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* Restaurants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-orange-100 relative rounded-lg overflow-hidden font-bold border-4 border-black hover:border-[#D433F8] shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#D433F8] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
              {/* Heart Icon */}
              <button
                onClick={() => handleHeartClick(restaurant)}
                className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all ${
                  isFavorited(restaurant.id)
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                }`}
              >
                <Heart 
                  size={20} 
                  className={isFavorited(restaurant.id) ? 'fill-current' : ''} 
                />
              </button>
              
              <div className="relative h-48 w-full bg-gray-300">
                {restaurant.photo_url ? (
                  <Image
                    src={restaurant.photo_url}
                    alt={restaurant.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <span>No Image</span>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t-2 border-orange-300">
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  {restaurant.name}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><span className="font-medium">Cuisine:</span> {restaurant.cuisine}</p>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} />
                    <span className="text-xs">{restaurant.address}</span>
                  </div>
                  
                  {restaurant.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone size={14} />
                      <span className="text-xs">{restaurant.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    {restaurant.rating && renderRating(restaurant.rating)}
                    {restaurant.price_level && (
                      <span className="text-green-600 font-bold">
                        {renderPriceLevel(restaurant.price_level)}
                      </span>
                    )}
                  </div>
                </div>

                {restaurant.description && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {restaurant.description}
                    </p>
                  </div>
                )}

                {/* Show comment if favorited */}
                {isFavorited(restaurant.id) && getFavoriteData(restaurant.id)?.comment && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg border-2 border-gray-400">
                    <div className="flex items-start space-x-2">
                      <MessageSquare size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 line-clamp-3">
                        {getFavoriteData(restaurant.id)?.comment}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Results Info */}
        <div className="text-center mt-8 mb-4 text-gray-600">
          <p>Showing {restaurants.length} restaurants</p>
          {selectedCuisine && (
            <p className="text-sm mt-1">Filtered by: <span className="font-medium">{selectedCuisine}</span></p>
          )}
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
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            <ChevronRight />
          </button>
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
            
            {selectedRestaurant && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800">{selectedRestaurant.name}</h4>
                <p className="text-sm text-gray-600">{selectedRestaurant.cuisine} • {selectedRestaurant.address}</p>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a personal note (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g., Great for date nights, Try the pasta special, Remember to make reservations..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              {editingFavorite ? (
                <>
                  <button
                    onClick={updateFavoriteComment}
                    disabled={isUpdating}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Updating...' : 'Update Note'}
                  </button>
                  <button
                    onClick={removeFromFavorites}
                    disabled={isUpdating}
                    className="flex-1 bg-[#D433F8] text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Removing...' : 'Remove'}
                  </button>
                </>
              ) : (
                <button
                  onClick={addToFavorites}
                  disabled={isUpdating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
  )
}