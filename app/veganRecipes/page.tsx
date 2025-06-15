/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Heart, MessageSquare, X, Clock, Users } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

// Define the recipe type
interface Recipe {
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

// Define the favourite recipe type
interface FavoriteRecipe {
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

export default function RecipesPage() {
  //Initialize State 
  const { user, isLoaded } = useUser()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(0)
  const [limit] = useState(12) // Limit to 12 recipes per page

  // Modal states
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [comment, setComment] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingFavorite, setEditingFavorite] = useState<FavoriteRecipe | null>(null)

  // Fetch recipes from the API
  const fetchRecipes = async (offset = 0, categoryFilter = '') => {
    setLoading(true)
    setError(null)
    
    try {
      const options = {
        method: 'GET',
        url: 'https://the-vegan-recipes-db.p.rapidapi.com/',
        headers: {
          'x-rapidapi-key': '0ec4e2095amsh1c726e3df00bfa6p12aac3jsnecd514c6e9e6',
          'x-rapidapi-host': 'the-vegan-recipes-db.p.rapidapi.com'
        }
      }

      console.log('Making API request to:', options.url)
      console.log('With headers:', options.headers)

      const response = await axios.request(options)
      
      // Process the response data - assuming it's an array of recipes
      let recipesData = response.data
      
      // If response.data is not an array, check if it has a recipes property
      if (!Array.isArray(recipesData)) {
        if (recipesData.recipes && Array.isArray(recipesData.recipes)) {
          recipesData = recipesData.recipes
        } else if (recipesData.data && Array.isArray(recipesData.data)) {
          recipesData = recipesData.data
        } else {
          // If we get an object that's not an array, wrap it in an array
          recipesData = [recipesData]
        }
      }

      // Filter by category if specified
      if (categoryFilter && recipesData.length > 0) {
        recipesData = recipesData.filter((recipe: any) => 
          recipe.category?.toLowerCase().includes(categoryFilter.toLowerCase())
        )
      }

      // Apply pagination
      const startIndex = offset
      const endIndex = startIndex + limit
      const paginatedRecipes = recipesData.slice(startIndex, endIndex)

      // Map the data to our Recipe interface
      const mappedRecipes: Recipe[] = paginatedRecipes.map((recipe: any, index: number) => ({
        id: recipe.id || recipe._id || `recipe-${offset + index}`,
        title: recipe.title || recipe.name || recipe.recipeName || 'Unnamed Recipe',
        image: recipe.image || recipe.imageUrl || recipe.photo || '/placeholder-recipe.jpg',
        difficulty: recipe.difficulty || recipe.level || 'Medium',
        portion: recipe.portion || recipe.servings || recipe.serves || '4 servings',
        time: recipe.time || recipe.cookTime || recipe.prepTime || '30 mins',
        description: recipe.description || recipe.summary || '',
        ingredients: recipe.ingredients || [],
        method: recipe.method || recipe.instructions || recipe.directions || [],
        category: recipe.category || recipe.type || 'Main Course'
      }))

      setRecipes(mappedRecipes)
    } catch (err: any) {
      console.error('Error fetching recipes:', err)
      
      if (err.response?.status === 403) {
        setError('API Access Denied (403). Please check your RapidAPI subscription and API key.')
      } else if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please try again later.')
      } else if (err.response?.status === 404) {
        setError('API endpoint not found. Please check the URL.')
      } else {
        setError(`Failed to fetch recipes: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch user's favorite recipes
  const fetchFavorites = async () => {
    if (!user) return
    
    try {
      const response = await axios.get('/api/favRecipes')
      setFavorites(response.data.favorites)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  // Check if recipe is already favorited
  const isFavorited = (recipeId: string) => {
    return favorites.some(fav => fav.recipeId === recipeId)
  }

  // Get favorite data for a recipe
  const getFavoriteData = (recipeId: string) => {
    return favorites.find(fav => fav.recipeId === recipeId)
  }

  // Handle heart click
  const handleHeartClick = (recipe: Recipe) => {
    if (!user) {
      alert('Please sign in to add favorites')
      return
    }

    const favoriteData = getFavoriteData(recipe.id)
    
    if (favoriteData) {
      // Already favorited, open modal to edit comment
      setEditingFavorite(favoriteData)
      setComment(favoriteData.comment)
      setSelectedRecipe(recipe)
      setShowCommentModal(true)
    } else {
      // Not favorited, open modal to add
      setEditingFavorite(null)
      setComment('')
      setSelectedRecipe(recipe)
      setShowCommentModal(true)
    }
  }

  // Add to favorites
  const addToFavorites = async () => {
    if (!selectedRecipe || !user) return
    
    setIsUpdating(true)
    try {
      await axios.post('/api/favRecipes', {
        recipe: selectedRecipe,
        comment
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
      await axios.put(`/api/favRecipes/${editingFavorite._id}`, {
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
      await axios.delete(`/api/favRecipes/${editingFavorite._id}`)
      
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

  // Recipe categories for filtering
  const categories = [
    'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Appetizer',
    'Main Course', 'Side Dish', 'Soup', 'Salad', 'Smoothie', 'Beverage'
  ]

  useEffect(() => {
    fetchRecipes(currentPage * limit, selectedCategory)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit, selectedCategory])

  useEffect(() => {
    if (isLoaded && user) {
      fetchFavorites()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(0) // Reset to first page
  }

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1)
  }

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading vegan recipes...</p>
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
            onClick={() => fetchRecipes(currentPage * limit, selectedCategory)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Vegan Recipes</h1>
          <p className="text-gray-600 text-lg">Discover delicious plant-based recipes for a healthy lifestyle</p>
        </div>

        {/* Filter Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Filter by Category:</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
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
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Recipes Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
  {recipes.map((recipe) => (
    <div key={recipe.id} className="bg-white relative rounded-2xl overflow-hidden border-4 border-black hover:border-green-600 shadow-[6px_6px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#16a34a] hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-300 group">
      {/* Heart Icon with enhanced styling */}
      <button
        onClick={() => handleHeartClick(recipe)}
        className={`absolute top-4 right-4 z-20 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 transform hover:scale-110 ${
          isFavorited(recipe.id)
            ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
            : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500 shadow-md'
        }`}
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
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
      </div>
      
      {/* Content Container */}
      <div className="p-5 bg-gradient-to-br from-green-50 to-white">
        {/* Title */}
        <h3 className="font-bold text-xl text-gray-800 mb-3 line-clamp-2 leading-tight">
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
          <div className="mb-4">
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
                  "{getFavoriteData(recipe.id)?.comment}"
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
          <p>Showing {recipes.length} recipes</p>
          {selectedCategory && (
            <p className="text-sm mt-1">Filtered by: <span className="font-medium">{selectedCategory}</span></p>
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
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <ChevronLeft />
          </button>
          <span className="text-gray-600 font-medium">
            Page {currentPage + 1}
          </span>
          <button
            onClick={handleNextPage}
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
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