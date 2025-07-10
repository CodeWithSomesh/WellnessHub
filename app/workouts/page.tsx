/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useUser } from '@clerk/nextjs'
import { Target, Dumbbell, User, ScrollText, MessageSquare, Heart, ChevronLeft, ChevronRight, Search, Filter, X } from 'lucide-react'

// Define the exercise type
interface Exercise {
  id: string
  name: string
  target: string
  bodyPart: string
  equipment: string
  gifUrl: string
  instructions: string[]
  secondaryMuscles: string[]
}

// Define the favourite exercise type
interface FavoriteWorkout {
  _id: string
  exerciseId: string
  exerciseName: string
  target: string
  bodyPart: string
  equipment: string
  gifUrl: string
  instructions: string[]
  comment: string
  createdAt: string
  updatedAt: string
}

export default function WorkoutsPage() {
  //Initialize State 
  const { user, isLoaded } = useUser()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [favorites, setFavorites] = useState<FavoriteWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const [limit] = useState(12) // Limit to 12 Exercises per page
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Modal states
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [comment, setComment] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingFavorite, setEditingFavorite] = useState<FavoriteWorkout | null>(null)

  // Fetch exercises from the API
  const fetchExercises = async (offset = 0, bodyPartFilter = '') => {
    setLoading(true)
    setError(null)
    
    try {
      let url = 'https://exercisedb.p.rapidapi.com/exercises'
      
      // If bodyPart filter is selected, use the bodyPart endpoint
      if (bodyPartFilter) {
        url = `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${bodyPartFilter}`
      }

      const options = {
        method: 'GET',
        url,
        params: bodyPartFilter ? { limit: limit.toString() } : {
          limit: limit.toString(),
          offset: offset.toString()
        },
        headers: {
          'x-rapidapi-key': '8d084e0333msh09b57610e3f7260p111cccjsn2a0ec9764e85',
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com'
        }
      }

      console.log('Making API request to:', url)
      console.log('With headers:', options.headers)

      const response = await axios.request(options)
      setExercises(response.data)
    } catch (err:any) {
      console.error('Error fetching exercises:', err)
      
      if (err.response?.status === 403) {
        setError('API Access Denied (403). Please check your RapidAPI subscription and API key.')
      } else if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please try again later.')
      } else if (err.response?.status === 404) {
        setError('API endpoint not found. Please check the URL.')
      } else {
        setError(`Failed to fetch exercises: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch user's favorite workouts
  const fetchFavorites = async () => {
    if (!user) return
    
    try {
      const response = await axios.get('/api/favWorkouts')
      setFavorites(response.data.favorites)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  // Check if exercise is already favorited
  const isFavorited = (exerciseId: string) => {
    return favorites.some(fav => fav.exerciseId === exerciseId)
  }

  // Get favorite data for an exercise
  const getFavoriteData = (exerciseId: string) => {
    return favorites.find(fav => fav.exerciseId === exerciseId)
  }

  // Handle heart click
  const handleHeartClick = (exercise: Exercise) => {
    if (!user) {
      alert('Please sign in to add favorites')
      return
    }

    const favoriteData = getFavoriteData(exercise.id)
    
    if (favoriteData) {
      // Already favorited, open modal to edit comment
      setEditingFavorite(favoriteData)
      setComment(favoriteData.comment)
      setSelectedExercise(exercise)
      setShowCommentModal(true)
    } else {
      // Not favorited, open modal to add
      setEditingFavorite(null)
      setComment('')
      setSelectedExercise(exercise)
      setShowCommentModal(true)
    }
  }

  // Add to favorites
  const addToFavorites = async () => {
    if (!selectedExercise || !user) return
    
    setIsUpdating(true)
    try {
      await axios.post('/api/favWorkouts', {
        exercise: selectedExercise,
        comment
      })
      
      // Refresh favorites
      await fetchFavorites()
      setShowCommentModal(false)
      setComment('')
      setSelectedExercise(null)
    } catch (error: any) {
      console.error('Error adding to favorites:', error)
      if (error.response?.status === 409) {
        alert('This exercise is already in your favorites!')
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
      await axios.put(`/api/favWorkouts/${editingFavorite._id}`, {
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
      await axios.delete(`/api/favWorkouts/${editingFavorite._id}`)
      
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

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(0)
  };

  // Body parts for filtering
  const bodyParts = [
    'back', 'cardio', 'chest', 'lower arms', 'lower legs',
    'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'
  ]

  useEffect(() => {
    fetchExercises(currentPage * limit, selectedBodyPart)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit, selectedBodyPart])

  useEffect(() => {
    if (isLoaded && user) {
      fetchFavorites()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user])

  useEffect(() => {
    if (searchTerm.trim()) {
      setTotalPages(Math.ceil(filteredExercises.length / limit));
      setTotalExercises(filteredExercises.length);
    }
    else {
      setTotalPages(Math.ceil(exercises.length / limit));
      setTotalExercises(exercises.length);
    }
  });

  const handleBodyPartChange = (bodyPart: string) => {
    setSelectedBodyPart(bodyPart)
    setCurrentPage(0) // Reset to first page
  }

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1)
  }

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const filteredExercises = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    const filtered = exercises.filter(exercise => {
      const matchesSearch = !searchTerm ||
        exercise.name?.toLowerCase().includes(lowerSearch) ||
        exercise.target?.toLowerCase().includes(lowerSearch) ||
        exercise.bodyPart?.toLowerCase().includes(lowerSearch) ||
        exercise.equipment?.toString().toLowerCase().includes(lowerSearch) ||
        exercise.instructions?.some(instr =>
          instr.toLowerCase().includes(lowerSearch)
        );

      const matchesBodyPart = !selectedBodyPart || exercise.bodyPart === selectedBodyPart;

      return matchesSearch && matchesBodyPart;
    });

    return filtered;
  }, [exercises, searchTerm, selectedBodyPart, currentPage, limit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading exercises...</p>
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
            onClick={() => fetchExercises(currentPage * limit, selectedBodyPart)}
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Workout Exercises</h1>
          <p className="text-gray-600 text-lg">Discover and learn new exercises for your fitness journey</p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6 pb-1">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search exercises, equipment, or instructions..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D433F8] focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-[#D433F8] hover:text-[#D433F8]"
            >
              <Filter size={18} />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
          </div>

          {/* Filter Section */}
          {showFilters && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBodyPartChange('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedBodyPart === ''
                      ? 'bg-[#D433F8] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                {bodyParts.map((bodyPart) => (
                  <button
                    key={bodyPart}
                    onClick={() => handleBodyPartChange(bodyPart)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                      selectedBodyPart === bodyPart
                        ? 'bg-[#D433F8] text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {bodyPart}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* No Results Message */}
        {totalPages === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No exercises found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedBodyPart('')
              }}
              className="text-[#D433F8] hover:text-[#D433F8] font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Exercises Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="bg-gradient-to-br from-yellow-50 to-yellow-100 relative rounded-xl overflow-hidden border-4 border-black hover:border-[#D433F8] shadow-[6px_6px_0px_0px_#000] hover:shadow-[6px_6x_0px_0px_#D433F8] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200">
              {/* Heart Icon with enhanced styling */}
              <button
                onClick={() => handleHeartClick(exercise)}
                className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md border-2 transition-all duration-200 ${
                  isFavorited(exercise.id)
                    ? 'bg-red-500 border-red-600 text-white hover:bg-red-600 shadow-lg'
                    : 'bg-white/90 border-3 border-purple-400  text-gray-600 hover:bg-white hover:text-red-500 hover:border-red-200 shadow-md'
                }`}
              >
                <Heart 
                  size={20} 
                  className={`${isFavorited(exercise.id) ? 'fill-current' : ''} transition-transform hover:scale-110`} 
                />
              </button>
              
              {/* Image section */}
              <div className="relative h-96 w-full overflow-hidden">
                <img
                  src={exercise.gifUrl}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content section with enhanced layout */}
              <div className="p-4 border-t-4 border-amber-300 space-y-3">
                {/* Exercise name */}
                <h3 className="font-bold text-lg text-gray-800 capitalize leading-tight mb-3">
                  {exercise.name}
                </h3>
                {/* Tags section with icons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="flex items-center space-x-1 bg-white/80 px-2 py-1 rounded-full border border-gray-300 shadow-sm">
                    <Target size={14} className="text-red-500" />
                    <span className="text-sm font-medium text-gray-700 capitalize">{exercise.target}</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white/80 px-2 py-1 rounded-full border border-gray-300 shadow-sm">
                    <User size={14} className="text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 capitalize">{exercise.bodyPart}</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white/80 px-2 py-1 rounded-full border border-gray-300 shadow-sm">
                    <Dumbbell size={14} className="text-green-500" />
                    <span className="text-sm font-medium text-gray-700 capitalize">{exercise.equipment}</span>
                  </div>
                </div>

                {/* Secondary muscles if available */}
                {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200 mb-3">
                    <h4 className="text-sm font-bold text-purple-700 mb-2 flex items-center">
                      <Target size={12} className="mr-1" />
                      Secondary Muscles:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {exercise.secondaryMuscles.map((muscle, index) => (
                        <span key={index} className="text-sm bg-white text-purple-800 px-2 py-0.5 rounded-full border border-purple-200 capitalize">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full instructions section */}
                {exercise.instructions && exercise.instructions.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200 mb-3">
                    <div className="flex items-center mb-2">
                      <ScrollText size={16} className="text-blue-600 mr-2" />
                      <h4 className="text-sm font-bold text-blue-700">Instructions:</h4>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {exercise.instructions.map((instruction, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white text-sm font-bold rounded-full flex items-center justify-center mt-0.5">
                            {index + 1}
                          </span>
                          <p className="text-sm text-blue-800 leading-relaxed font-medium">
                            {instruction}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced comment section */}
                {isFavorited(exercise.id) && getFavoriteData(exercise.id)?.comment && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200 shadow-inner">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 p-1.5 bg-green-500 text-white rounded-full">
                        <MessageSquare size={14} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-green-700 mb-1">Your Note:</h4>
                        <p className="text-sm text-green-800 leading-relaxed font-medium">
                          {getFavoriteData(exercise.id)?.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Results Info */}
        <div className="text-center mt-8 mb-4 text-gray-600">
          <p>Showing {Math.min(((currentPage + 1) * limit), totalExercises)} exercises</p>
          {selectedBodyPart && (
            <p className="text-sm mt-1">Filtered by: <span className="font-medium capitalize">{selectedBodyPart}</span></p>
          )}
        </div>

        {/* Pagination */}
        {!selectedBodyPart && (
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#D433F8] text-white cursor-pointer'
              }`}
            >
              <ChevronLeft />
            </button>
            <span className="text-gray-600 font-medium">
              Page {currentPage + 1}
            </span>
            <button
              onClick={handleNextPage}
              className="px-4 py-2 rounded-lg bg-[#D433F8] text-white font-medium cursor-pointer transition-colors"
            >
              <ChevronRight />
            </button>
          </div>
        )}
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
            
            {selectedExercise && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 capitalize">{selectedExercise.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{selectedExercise.target} • {selectedExercise.bodyPart}</p>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a personal note (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g., Try this workout next Wednesday, Remember to use lighter weights..."
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
