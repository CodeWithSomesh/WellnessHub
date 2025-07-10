/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'
import { Heart, MessageSquare, X, Clock, Users, RefreshCw } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

// Define the vegan recipe type
interface VeganRecipe {
  id: string
  title: string
  image: string
  difficulty?: string
  portion?: string
  time?: string
  description?: string
  ingredients?: string[]
  method?: string[]
  category?: string
}

// Define the favourite vegan recipe type
interface FavoriteVeganRecipe {
  _id: string
  recipeId: string
  recipeName: string
  difficulty?: string
  portion?: string
  time?: string
  image: string
  description?: string
  ingredients?: string[]
  comment: string
  createdAt: string
  updatedAt: string
}

// API Configuration
const API_CONFIG = {
  baseURL: 'https://the-vegan-recipes-db.p.rapidapi.com/',
  headers: {
    'x-rapidapi-key': '8d084e0333msh09b57610e3f7260p111cccjsn2a0ec9764e85',
    'x-rapidapi-host': 'the-vegan-recipes-db.p.rapidapi.com'
  }
}

// Function to normalize difficulty values from API
const normalizeDifficulty = (difficulty: string): string => {
  const lower = difficulty.toLowerCase()
  if (lower.includes('easy')) return 'Easy'
  if (lower.includes('medium')) return 'Medium'  
  if (lower.includes('challenge')) return 'Challenge'
  return difficulty // return original if no match
}

export default function RecipesPage() {
  // Initialize State 
  const { user, isLoaded } = useUser()
  const [recipes, setRecipes] = useState<VeganRecipe[]>([])
  const [favorites, setFavorites] = useState<FavoriteVeganRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [limit] = useState(12) // Limit to 12 recipes per page

  // Modal states
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<VeganRecipe | null>(null)
  const [comment, setComment] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingFavorite, setEditingFavorite] = useState<FavoriteVeganRecipe | null>(null)

  // UI State
  const [showFilters, setShowFilters] = useState(false)

  // Recipe categories for filtering - Updated to focus on difficulties
  const categories = useMemo(() => [
    'Easy',
    'Medium', 
    'Challenge'
  ], [])

  // Memoized filtered recipes with pagination
  const filteredRecipes = useMemo(() => {
    const filtered = recipes.filter(recipe => {
      const matchesSearch = !searchTerm || 
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients?.some(ingredient => 
          ingredient.toLowerCase().includes(searchTerm.toLowerCase())
        )
      
      // Enhanced difficulty matching
      const matchesCategory = !selectedCategory || 
        recipe.difficulty?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        recipe.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      
      return matchesSearch && matchesCategory
    })
    
    // Update pagination info based on filtered results
    const calculatedTotalPages = Math.ceil(filtered.length / limit)
    setTotalPages(calculatedTotalPages)
    setHasMore((currentPage + 1) * limit < filtered.length)
    
    // Apply pagination to filtered results
    const startIndex = currentPage * limit
    const endIndex = startIndex + limit
    return filtered.slice(startIndex, endIndex)
  }, [recipes, searchTerm, selectedCategory, currentPage, limit])

  // Get total filtered count for display
  const totalFilteredCount = useMemo(() => {
    return recipes.filter(recipe => {
      const matchesSearch = !searchTerm || 
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients?.some(ingredient => 
          ingredient.toLowerCase().includes(searchTerm.toLowerCase())
        )
      
      // Enhanced difficulty matching
      const matchesCategory = !selectedCategory || 
        recipe.difficulty?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        recipe.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      
      return matchesSearch && matchesCategory
    }).length
  }, [recipes, searchTerm, selectedCategory])

  // Fetch recipes from the API with error handling
  const fetchRecipes = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const options = {
        method: 'GET',
        url: API_CONFIG.baseURL,
        headers: API_CONFIG.headers,
        timeout: 10000 // 10 second timeout
      }

      console.log('Making API request to:', options.url)

      const response = await axios.request(options)
      
      // Process the array of recipes data 
      let recipesData = response.data
      
      // If recipes data is not an array, check for recipes property
      if (!Array.isArray(recipesData)) {
        if (recipesData.recipes && Array.isArray(recipesData.recipes)) {
          recipesData = recipesData.recipes
        } else if (recipesData.data && Array.isArray(recipesData.data)) {
          recipesData = recipesData.data
        } else {
          recipesData = [recipesData]
        }
      }

      // Map the data to vegan recipe interface with normalized difficulty
      const mappedRecipes: VeganRecipe[] = recipesData.map((recipe: any, index: number) => ({
        id: recipe.id || recipe._id || `recipe-${Date.now()}-${index}`,
        title: recipe.title || recipe.name || recipe.recipeName || 'Unnamed Recipe',
        image: recipe.image || recipe.imageUrl || recipe.photo || '/api/placeholder/400/300',
        difficulty: normalizeDifficulty(recipe.difficulty || recipe.level || 'Medium'),
        portion: recipe.portion || recipe.servings || recipe.serves || '4 servings',
        time: recipe.time || recipe.cookTime || recipe.prepTime || '30 mins',
        description: recipe.description || recipe.summary || 'Delicious vegan recipe',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        method: Array.isArray(recipe.method) || Array.isArray(recipe.instructions) || Array.isArray(recipe.directions) 
          ? (recipe.method || recipe.instructions || recipe.directions) : [],
        category: recipe.category || recipe.type || 'Main Course'
      }))

      setRecipes(mappedRecipes)
    } catch (err: any) {
      console.error('Error fetching recipes:', err)
      
      // Error handling with specific messages
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your internet connection and try again.')
      } else if (err.response?.status === 403) {
        setError('API Access Denied. Please check your RapidAPI subscription and API key.')
      } else if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please try again in a few minutes.')
      } else if (err.response?.status === 404) {
        setError('API endpoint not found. Please check the URL.')
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.')
      } else {
        setError(`Failed to fetch recipes: ${err.message || 'Unknown error occurred'}`)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch user's favorite vegan recipes with error handling
  const fetchFavorites = useCallback(async () => {
    if (!user) return
    
    try {
      const response = await axios.get('/api/favVeganRecipes', {
        timeout: 5000
      })
      setFavorites(response.data.favorites || [])
    } catch (error) {
      // Display logs for user favorites error for debuging      
      console.error('Error fetching favorites:', error)
    }
  }, [user])

  // Check if recipe is already set to favorited
  const isFavorited = useCallback((recipeId: string) => {
    return favorites.some(fav => fav.recipeId === recipeId)
  }, [favorites])

  // Get user favorite vegan recipies
  const getFavoriteData = useCallback((recipeId: string) => {
    return favorites.find(fav => fav.recipeId === recipeId)
  }, [favorites])

  // User faviourte icon
  const handleHeartClick = useCallback((recipe: VeganRecipe) => {
    if (!user) {
      alert('Please sign in to add favorites')
      return
    }

    const favoriteData = getFavoriteData(recipe.id)
    
    if (favoriteData) {
      setEditingFavorite(favoriteData)
      setComment(favoriteData.comment)
      setSelectedRecipe(recipe)
      setShowCommentModal(true)
    } else {
      setEditingFavorite(null)
      setComment('')
      setSelectedRecipe(recipe)
      setShowCommentModal(true)
    }
  }, [user, getFavoriteData])

  // Add to favorites with better error handling
  const addToFavorites = useCallback(async () => {
    if (!selectedRecipe || !user) return
    
    setIsUpdating(true)
    try {
      const recipeData = {
        ...selectedRecipe,
        recipeName: selectedRecipe.title, 
        name: selectedRecipe.title,
      }
      
      await axios.post('/api/favVeganRecipes', {
        recipe: recipeData,
        comment
      }, {
        timeout: 5000
      })
      
      // Refresh favorites
      await fetchFavorites()
      setShowCommentModal(false)
      setComment('')
      setSelectedRecipe(null)
    } catch (error: any) {
      console.error('Error adding to favorites:', error)
      if (error.response?.status === 409) {
        alert('This recipe is already in your favorites!')
      } else if (error.code === 'ECONNABORTED') {
        alert('Request timeout. Please try again.')
      } else if (error.response?.data?.message) {
        // Show specific error message from backend
        alert(`Failed to add to favorites: ${error.response.data.message}`)
      } else {
        alert('Failed to add to favorites. Please try again.')
      }
    } finally {
      setIsUpdating(false)
    }
  }, [selectedRecipe, user, comment, fetchFavorites])

  // Update favorite comment
  const updateFavoriteComment = useCallback(async () => {
    if (!editingFavorite) return
    
    setIsUpdating(true)
    try {
      await axios.put(`/api/favVeganRecipes/${editingFavorite._id}`, {
        comment
      }, {
        timeout: 5000
      })
      
      // Refresh favorites
      await fetchFavorites()
      setShowCommentModal(false)
      setComment('')
      setEditingFavorite(null)
    } catch (error: any) {
      console.error('Error updating comment:', error)
      if (error.code === 'ECONNABORTED') {
        alert('Request timeout. Please try again.')
      } else {
        alert('Failed to update comment. Please try again.')
      }
    } finally {
      setIsUpdating(false)
    }
  }, [editingFavorite, comment, fetchFavorites])

  // Remove from favorites
  const removeFromFavorites = useCallback(async () => {
    if (!editingFavorite) return
    
    setIsUpdating(true)
    try {
      await axios.delete(`/api/favVeganRecipes/${editingFavorite._id}`, {
        timeout: 5000
      })
      
      // Refresh favorites
      await fetchFavorites()
      setShowCommentModal(false)
      setComment('')
      setEditingFavorite(null)
    } catch (error: any) {
      console.error('Error removing from favorites:', error)
      if (error.code === 'ECONNABORTED') {
        alert('Request timeout. Please try again.')
      } else {
        alert('Failed to remove from favorites. Please try again.')
      }
    } finally {
      setIsUpdating(false)
    }
  }, [editingFavorite, fetchFavorites])

  // Handle category change
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    setCurrentPage(0) // Reset to first page
  }, [])

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    setCurrentPage(0)
  }, [])

  // Pagination handlers
  const handleNextPage = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasMore])

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }, [])

  // Retry function
  const handleRetry = useCallback(() => {
    fetchRecipes()
  }, [fetchRecipes])

  // Effects
  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  useEffect(() => {
    if (isLoaded && user) {
      fetchFavorites()
    }
  }, [isLoaded, user, fetchFavorites])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCommentModal) {
        setShowCommentModal(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showCommentModal])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading delicious vegan recipes...</p>
          <p className="mt-2 text-sm text-gray-500">This may take a few moments</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center space-x-2"
          >
            <RefreshCw size={18} />
            <span>Try Again</span>
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Vegan Recipes</h1>
          <p className="text-gray-600 text-lg">Discover delicious plant-based recipes for a healthy lifestyle</p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6 pb-1">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search recipes, ingredients, or descriptions..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-green-600 hover:text-green-700"
            >
              <Filter size={18} />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
          </div>

          {/* Difficulty Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={() => handleCategoryChange('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === ''
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Levels
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category} Level
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="text-center mb-6 text-gray-600">
          <p>
            Showing {filteredRecipes.length} of {totalFilteredCount} recipes
            {/* Removing "" to solve Vercel deployment issue */}
            {searchTerm && <span>matching &quot;{searchTerm}&quot;</span>} 
            {selectedCategory && <span> in {selectedCategory}</span>}
          </p>
        </div>

        {/* No Results Message */}
        {totalFilteredCount === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No recipes found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('')
              }}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-white relative rounded-2xl overflow-hidden border-4 border-black hover:border-[#33f875] shadow-[6px_6px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#33f875] hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-300 group">
              {/* Heart Icon with enhanced styling */}
              <button
                onClick={() => handleHeartClick(recipe)}
                className={`absolute top-4 right-4 z-20 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 transform hover:scale-110 ${
                  isFavorited(recipe.id)
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                    : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500 shadow-md'
                }`}
                aria-label={isFavorited(recipe.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart 
                  size={18} 
                  className={`${isFavorited(recipe.id) ? 'fill-current' : ''} transition-all duration-200`} 
                />
              </button>
              
              {/* Category Badge */}
              {recipe.category && (
                <div className="absolute top-4 left-4 z-20 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                  {recipe.category}
                </div>
              )}
              
              {/* Image Container with Overlay */}
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={recipe.image}
                  alt={recipe.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                  loading="lazy"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>
              
              {/* Content Container */}
              <div className="p-5 bg-gradient-to-br from-green-50 to-white">
                {/* Title */}
                <h3 className="font-bold text-xl text-gray-800 mb-3 line-clamp- leading-tight">
                  {recipe.title}
                </h3>
                
                {/* Quick Stats Row */}
                <div className="flex items-center justify-between mb-4 text-sm">
                  {recipe.time && (
                    <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-full border-2 border-gray-200 shadow-sm">
                      <Clock size={14} className="text-green-600" />
                      <span className="font-medium text-gray-700">{recipe.time}</span>
                    </div>
                  )}
                  {recipe.portion && (
                    <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-full border-2 border-gray-200 shadow-sm">
                      <Users size={14} className="text-green-600" />
                      <span className="font-medium text-gray-700">{recipe.portion}</span>
                    </div>
                  )}
                </div>

                {/* Difficulty Badge */}
                {recipe.difficulty && (
                  <div className="mb-4">
                    <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border-2 ${
                      recipe.difficulty.toLowerCase() === 'easy' 
                        ? 'bg-green-100 text-green-800 border-green-300' 
                        : recipe.difficulty.toLowerCase() === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}>
                      {recipe.difficulty} Level
                    </span>
                  </div>
                )}

                {/* Description */}
                {recipe.description && (
                  <div className="mb-">
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {recipe.description}
                    </p>
                  </div>
                )}

                {/* Ingredients Preview */}
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <div className="mb-4 p-3 bg-white rounded-xl border-2 border-green-100 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <p className="text-sm font-bold text-gray-700">Key Ingredients</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
                        <span 
                          key={index}
                          className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200 font-medium"
                        >
                          {ingredient.length > 15 ? ingredient.substring(0, 15) + '...' : ingredient}
                        </span>
                      ))}
                      {recipe.ingredients.length > 4 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200 font-medium">
                          +{recipe.ingredients.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Method Preview */}
                {recipe.method && recipe.method.length > 0 && (
                  <div className="mb-4 p-3 bg-white rounded-xl border-2 border-blue-100 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <p className="text-sm font-bold text-gray-700">Quick Steps</p>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {recipe.method[0]}
                      {recipe.method.length > 1 && ` (+${recipe.method.length - 1} more steps)`}
                    </p>
                  </div>
                )}

                {/* Personal Note for Favorited Items */}
                {isFavorited(recipe.id) && getFavoriteData(recipe.id)?.comment && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-sm">
                    <div className="flex items-start space-x-2">
                      <MessageSquare size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-blue-800 mb-1">Your Note:</p>
                        <p className="text-sm text-blue-700 line-clamp-3 leading-relaxed italic">
                          <span>&quot;{getFavoriteData(recipe.id)?.comment}&quot;</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalFilteredCount > 0 && (
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2 ${
                currentPage === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 font-medium">
                Page {currentPage + 1}
              </span>
              {totalPages > 0 && (
                <span className="text-gray-500">of {totalPages}</span>
              )}
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={!hasMore}
              className={`px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2 ${
                !hasMore
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingFavorite ? 'Edit Note' : 'Add to Favorites'}
              </h3>
              <button 
                onClick={() => setShowCommentModal(false)}
                className="text-gray-500 hover:text-white hover:bg-red-500 rounded-full p-1 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            
            {selectedRecipe && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800">{selectedRecipe.title}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  {selectedRecipe.time && <span>{selectedRecipe.time}</span>}
                  {selectedRecipe.difficulty && <span>{selectedRecipe.difficulty}</span>}
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a personal note (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g., Great for Sunday brunch, Need to double the spice, Try with almond milk..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              {editingFavorite ? (
                <>
                  <button
                    onClick={updateFavoriteComment}
                    disabled={isUpdating}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
