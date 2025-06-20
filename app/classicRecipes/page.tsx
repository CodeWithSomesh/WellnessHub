/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Heart, MessageSquare, X, Clock, Users, ChefHat, Search, Filter } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

// Define the recipe type based on Tasty API response
interface Recipe {
  id: number
  name: string
  description?: string
  thumbnail_url?: string
  video_url?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  total_time_minutes?: number
  servings?: number
  tags?: Array<{
    id: number
    name: string
    type: string
  }>
  sections?: Array<{
    components: Array<{
      ingredient: {
        name: string
      }
      measurements: Array<{
        quantity: string
        unit: {
          name: string
        }
      }>
    }>
  }>
  instructions?: Array<{
    display_text: string
    position: number
  }>
  nutrition?: {
    calories?: number
    protein?: number
    fat?: number
    carbohydrates?: number
  }
}

interface FavoriteRecipe {
  _id: string
  recipeId: string
  recipeName: string
  description: string
  thumbnailUrl: string
  prepTime: number
  cookTime: number
  totalTime: number
  servings: number
  tags: string[]
  comment: string
  createdAt: string
  updatedAt: string
}

export default function RecipesPage() {
  // Initialize State 
  const { user, isLoaded } = useUser()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [size] = useState(20) // Limit to 20 recipes per page
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Modal states
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [comment, setComment] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingFavorite, setEditingFavorite] = useState<FavoriteRecipe | null>(null)

  // Fetch recipes from the API
  const fetchRecipes = async (from = 0, tagFilter = '') => {
    setLoading(true)
    setError(null)
    
    try {
      const params: any = {
        from: from.toString(),
        size: size.toString()
      }

      // Add tag filter if selected
      if (tagFilter) {
        params.tags = tagFilter
      }

      const options = {
        method: 'GET',
        url: 'https://tasty.p.rapidapi.com/recipes/list',
        params,
        headers: {
          'x-rapidapi-key': '0ec4e2095amsh1c726e3df00bfa6p12aac3jsnecd514c6e9e6',
          'x-rapidapi-host': 'tasty.p.rapidapi.com'
        }
      }

      console.log('Making API request to:', options.url)
      console.log('With params:', params)

      const response = await axios.request(options)
      setRecipes(response.data.results || [])
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
  const isFavorited = (recipeId: number) => {
    return favorites.some(fav => fav.recipeId === recipeId.toString())
  }

  // Get favorite data for a recipe
  const getFavoriteData = (recipeId: number) => {
    return favorites.find(fav => fav.recipeId === recipeId.toString())
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

  // Popular recipe tags for filtering
  const recipeTags = [
    'under_30_minutes',
    'under_45_minutes', 
    'under_1_hour',
    'vegetarian',
    'vegan',
    'gluten_free',
    'dairy_free',
    'healthy',
    'comfort_food',
    'easy',
    'one_pot_or_pan',
    'meal_prep',
    'dinner',
    'breakfast',
    'lunch',
    'desserts',
    'appetizers'
  ]

  useEffect(() => {
    fetchRecipes(currentPage * size, selectedTag)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, size, selectedTag])

  useEffect(() => {
    if (isLoaded && user) {
      fetchFavorites()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user])

  useEffect(() => {
    if (searchTerm.trim()) {
      setTotalPages(Math.ceil(filteredRecipes.length / size));
      setTotalRecipes(filteredRecipes.length);
    }
    else {
      setTotalPages(Math.ceil(recipes.length / size));
      setTotalRecipes(recipes.length);
    }
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(0)
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag)
    setCurrentPage(0) // Reset to first page
  }

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1)
  }

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  // Format time display
  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Get main ingredients (first 3)
  const getMainIngredients = (recipe: Recipe) => {
    if (!recipe.sections || recipe.sections.length === 0) return []
    const firstSection = recipe.sections[0]
    return firstSection.components?.slice(0, 3).map(comp => comp.ingredient.name) || []
  }

  const filteredRecipes = useMemo(() => {
    const filtered = recipes.filter(recipe => {
      const ingredients = getMainIngredients(recipe);
      const matchesSearch = !searchTerm ||
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.total_time_minutes?.toString().includes(searchTerm.toLowerCase()) ||
      recipe.prep_time_minutes?.toString().includes(searchTerm.toLowerCase()) ||
      recipe.tags?.toString().includes(searchTerm.toLowerCase()) ||
      ingredients?.some(ingredient =>
        ingredient.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesTag = !selectedTag || recipeTags?.includes(selectedTag)
      
      return matchesSearch && matchesTag
    })
    
    return filtered
  }, [recipes, searchTerm, selectedTag, currentPage, size])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading delicious recipes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🍳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchRecipes(currentPage * size, selectedTag)}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Delicious Recipes</h1>
          <p className="text-gray-600 text-lg">Discover amazing recipes for every occasion</p>
        </div>

        {/* Search and Filter Section */}
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search recipes, ingredients, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
  
            {/* Filter Toggle */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-orange-600 hover:text-orange-700"
              >
                <Filter size={18} />
                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              </button>
            </div>

          {/* Filter Section */}
          {showFilters && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTagChange('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTag === ''
                      ? 'bg-[#D433F8] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All Recipes
                </button>
                {recipeTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagChange(tag)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                      selectedTag === tag
                        ? 'bg-[#D433F8] text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {tag.replace(/_/g, ' ')}
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
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No recipes found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedTag('')
              }}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-orange-100 relative rounded-lg overflow-hidden font-bold border-4 border-black hover:border-[#D433F8] shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#D433F8] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
              {/* Heart Icon */}
              <button
                onClick={() => handleHeartClick(recipe)}
                className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all ${
                  isFavorited(recipe.id)
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                }`}
              >
                <Heart 
                  size={20} 
                  className={isFavorited(recipe.id) ? 'fill-current' : ''} 
                />
              </button>
              
              <div className="relative h-48 w-full">
                {recipe.thumbnail_url ? (
                  <Image
                    src={recipe.thumbnail_url}
                    alt={recipe.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                    <ChefHat size={48} className="text-orange-600" />
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t-2 border-orange-300">
                <h3 className="font-bold text-lg text-gray-800 mb-3 line-clamp-2">
                  {recipe.name}
                </h3>
                
                {/* Recipe Stats */}
                <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{formatTime(recipe.total_time_minutes || recipe.prep_time_minutes)}</span>
                  </div>
                  {recipe.servings && (
                    <div className="flex items-center space-x-1">
                      <Users size={14} />
                      <span>{recipe.servings} servings</span>
                    </div>
                  )}
                </div>

                {/* Main Ingredients */}
                {getMainIngredients(recipe).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-gray-700 mb-1">Main Ingredients:</p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {getMainIngredients(recipe).join(', ')}
                    </p>
                  </div>
                )}

                {/* Description */}
                {recipe.description && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {recipe.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {recipe.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full"
                        >
                          {tag.name.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {recipe.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                          +{recipe.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Show comment if favorited */}
                {isFavorited(recipe.id) && getFavoriteData(recipe.id)?.comment && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg border-2 border-gray-400">
                    <div className="flex items-start space-x-2">
                      <MessageSquare size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 line-clamp-3">
                        {getFavoriteData(recipe.id)?.comment}
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
          <p>Showing {Math.min(((currentPage + 1) * size), totalRecipes)} recipes</p>
          {selectedTag && (
            <p className="text-sm mt-1">Filtered by: <span className="font-medium capitalize">{selectedTag.replace(/_/g, ' ')}</span></p>
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
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            <ChevronLeft />
          </button>
          <span className="text-gray-600 font-medium">
            Page {currentPage + 1}
          </span>
          <button
            onClick={handleNextPage}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors"
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
                <h4 className="font-medium text-gray-800">{selectedRecipe.name}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  {selectedRecipe.total_time_minutes && (
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{formatTime(selectedRecipe.total_time_minutes)}</span>
                    </div>
                  )}
                  {selectedRecipe.servings && (
                    <div className="flex items-center space-x-1">
                      <Users size={14} />
                      <span>{selectedRecipe.servings} servings</span>
                    </div>
                  )}
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
                placeholder="e.g., Made this last week and loved it! Need to try with less salt next time..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              {editingFavorite ? (
                <>
                  <button
                    onClick={updateFavoriteComment}
                    disabled={isUpdating}
                    className="flex-1 bg-[#D433F8] text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Updating...' : 'Update Note'}
                  </button>
                  <button
                    onClick={removeFromFavorites}
                    disabled={isUpdating}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Removing...' : 'Remove'}
                  </button>
                </>
              ) : (
                <button
                  onClick={addToFavorites}
                  disabled={isUpdating}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
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