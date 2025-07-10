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
  // Add this with your other state declarations (around line 75-85)
  const [expandedInstructions, setExpandedInstructions] = useState<Set<number>>(new Set())

  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])
  const [hasMoreData, setHasMoreData] = useState(true)

  // Add this function with your other functions (around line 400-500)
  const toggleInstructions = (recipeId: number) => {
    setExpandedInstructions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId)
      } else {
        newSet.add(recipeId)
      }
      return newSet
    })
  }

  // Modal states
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [comment, setComment] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingFavorite, setEditingFavorite] = useState<FavoriteRecipe | null>(null)

  // // Share states
  // const [showShareModal, setShowShareModal] = useState(false)
  // const [shareRecipe, setShareRecipe] = useState<Recipe | null>(null)
  // const [copySuccess, setCopySuccess] = useState(false)
  
  // Fetch recipes from the API
  const fetchRecipes = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let allFetchedRecipes: Recipe[] = []
      let from = 0
      const fetchSize = 50
      let hasMore = true
      let retryCount = 0
      const maxRetries = 3
      const maxRecipes = 350
      
      while (hasMore && from < maxRecipes) {
        try {
          const params: any = {
            from: from.toString(),
            size: fetchSize.toString()
          }
          // Call filter locally

          const options = {
            method: 'GET',
            url: 'https://tasty.p.rapidapi.com/recipes/list',
            params,
            headers: {
              'x-rapidapi-key': '8b4d17b550msh982a8b24ae8e7dfp1bf909jsn98b864509cd0',
              'x-rapidapi-host': 'tasty.p.rapidapi.com'
            },
            timeout: 15000
          }

          const response = await axios.request(options)
          const newRecipes = response.data.results || []
          
          if (newRecipes.length === 0) {
            hasMore = false
          } else {
            allFetchedRecipes = [...allFetchedRecipes, ...newRecipes]
            from += fetchSize
            retryCount = 0
            
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (batchError: any) {
          console.error(`Error fetching batch from ${from}:`, batchError)
          
          if (batchError.code === 'ECONNABORTED' || batchError.message.includes('timeout')) {
            retryCount++
            if (retryCount < maxRetries) {
              console.log(`Retrying batch ${from}, attempt ${retryCount}`)
              await new Promise(resolve => setTimeout(resolve, 2000 * retryCount))
              continue
            } else {
              console.log(`Max retries reached for batch ${from}, using existing data`)
              hasMore = false
            }
          } else if (batchError.response?.status === 429) {
            console.log('Rate limit hit, waiting 5 seconds...')
            await new Promise(resolve => setTimeout(resolve, 5000))
            continue
          } else {
            throw batchError
          }
        }
      }
      
      setAllRecipes(allFetchedRecipes)
      setHasMoreData(from < maxRecipes)
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

  // Handle share click
  // const handleShareClick = (recipe: Recipe) => {
  //   setShareRecipe(recipe)
  //   setShowShareModal(true)
  //   setCopySuccess(false)
  // }

  // Generate recipe share text
  // const generateShareText = (recipe: Recipe) => {
  //   const mainIngredients = getMainIngredients(recipe)
  //   const time = formatTime(recipe.total_time_minutes || recipe.prep_time_minutes)
    
  //   let shareText = `🍳 Check out this delicious recipe: ${recipe.name}\n\n`
    
  //   if (recipe.description) {
  //     shareText += `${recipe.description}\n\n`
  //   }
    
  //   shareText += `⏱️ Time: ${time}\n`
    
  //   if (recipe.servings) {
  //     shareText += `👥 Serves: ${recipe.servings}\n`
  //   }
    
  //   if (mainIngredients.length > 0) {
  //     shareText += `🥘 Main ingredients: ${mainIngredients.join(', ')}\n`
  //   }
    
  //   shareText += `\n📱 Found on our recipe app!`
    
  //   return shareText
  // }

  // // Copy to clipboard
  // const copyToClipboard = async (text: string) => {
  //   try {
  //     await navigator.clipboard.writeText(text)
  //     setCopySuccess(true)
  //     setTimeout(() => setCopySuccess(false), 2000)
  //   } catch (err) {
  //     console.error('Failed to copy text: ', err)
  //     // Fallback for older browsers
  //     const textArea = document.createElement('textarea')
  //     textArea.value = text
  //     document.body.appendChild(textArea)
  //     textArea.focus()
  //     textArea.select()
  //     try {
  //       document.execCommand('copy')
  //       setCopySuccess(true)
  //       setTimeout(() => setCopySuccess(false), 2000)
  //     } catch (fallbackErr) {
  //       console.error('Fallback copy failed: ', fallbackErr)
  //     }
  //     document.body.removeChild(textArea)
  //   }
  // }

  // // Share via Web Share API (if supported)
  // const shareViaWebAPI = async (recipe: Recipe) => {
  //   if (navigator.share) {
  //     try {
  //       await navigator.share({
  //         title: recipe.name,
  //         text: generateShareText(recipe),
  //         url: window.location.href
  //       })
  //     } catch (err) {
  //       console.error('Error sharing:', err)
  //     }
  //   } else {
  //     // Fallback to copy to clipboard
  //     copyToClipboard(generateShareText(recipe))
  //   }
  // }

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
    if (allRecipes.length === 0) {
      fetchRecipes()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTag])

  useEffect(() => {
    if (isLoaded && user) {
      fetchFavorites()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(0)
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag)
    setCurrentPage(0) // Reset to first page
  }

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1)
    }
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
    const filtered = allRecipes.filter(recipe => {
      const ingredients = getMainIngredients(recipe);
      const matchesSearch = !searchTerm ||
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.total_time_minutes?.toString().includes(searchTerm.toLowerCase()) ||
        recipe.prep_time_minutes?.toString().includes(searchTerm.toLowerCase()) ||
        recipe.tags?.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ingredients?.some(ingredient =>
          ingredient.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesTag = !selectedTag || 
        recipe.tags?.some(tag => tag.name === selectedTag);
      
      return matchesSearch && matchesTag;
    })
    
    return filtered
  }, [allRecipes, searchTerm, selectedTag])

  const paginatedRecipes = useMemo(() => {
    const startIndex = currentPage * size
    const endIndex = startIndex + size
    return filteredRecipes.slice(startIndex, endIndex)
  }, [filteredRecipes, currentPage, size])

  useEffect(() => {
    setTotalPages(Math.ceil(filteredRecipes.length / size));
    setTotalRecipes(filteredRecipes.length);
  }, [filteredRecipes.length, size]);

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
            onClick={() => fetchRecipes()}
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
  
            {/* Filter Toggle */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-amber-400 hover:text-amber-600"
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
                  onClick={() => handleTagChange('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTag === ''
                      ? 'bg-amber-300 text-white'
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
                        ? 'bg-amber-300 text-white'
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

        {/* Recipes Grid - Updated for larger cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {paginatedRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-orange-100 relative rounded-xl overflow-hidden font-bold border-4 border-black hover:border-amber-300 shadow-[6px_6px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#D433FFD54FF8] hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-200">
              
              {/* Heart Icon */}
              <button
                onClick={() => handleHeartClick(recipe)}
                className={`absolute top-4 right-4 z-10 p-3 rounded-full backdrop-blur-sm transition-all shadow-lg ${
                  isFavorited(recipe.id)
                    ? 'bg-red-500 text-white hover:bg-red-600 hover:scale-110'
                    : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500 hover:scale-110'
                }`}
              >
                <Heart 
                  size={24} 
                  className={isFavorited(recipe.id) ? 'fill-current' : ''} 
                />
              </button>
              
              {/* Image Section - Increased height */}
              <div className="relative h-96 w-full">
                {recipe.thumbnail_url ? (
                  <Image
                    src={recipe.thumbnail_url}
                    alt={recipe.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-200 via-orange-300 to-amber-400 flex items-center justify-center">
                    <div className="text-center">
                      <ChefHat size={64} className="text-orange-700 mx-auto mb-2" />
                      <p className="text-orange-800 font-semibold">No Image Available</p>
                    </div>
                  </div>
                )}
                
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Content Section - Expanded */}
              <div className="p-6 border-t-4 border-gray-800">
                {/* Title */}
                <h3 className="font-bold text-xl text-gray-800 mb-4 leading-tight">
                  {recipe.name}
                </h3>
                
                {/* Recipe Stats - Enhanced with better spacing and icons */}
                <div className="flex items-center justify-between bg-white/60 rounded-lg p-3 mb-4 border-2 border-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Clock size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Cook Time</p>
                      <p className="text-sm font-bold text-gray-800">
                        {formatTime(recipe.total_time_minutes || recipe.prep_time_minutes)}
                      </p>
                    </div>
                  </div>
                  
                  {recipe.servings && (
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Users size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Serves</p>
                        <p className="text-sm font-bold text-gray-800">{recipe.servings}</p>
                      </div>
                    </div>
                  )}
                  
                  {recipe.nutrition?.calories && (
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <span className="text-orange-600 font-bold text-sm">🔥</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Calories</p>
                        <p className="text-sm font-bold text-gray-800">{recipe.nutrition.calories}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description - Full display */}
                {recipe.description && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">📝</span>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {recipe.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Ingredients - Enhanced display */}
                {getMainIngredients(recipe).length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">🥘</span>
                      <h4 className="text-sm font-bold text-gray-700">Main Ingredients</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getMainIngredients(recipe).map((ingredient, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-amber-200 text-amber-800 text-sm rounded-full border-2 border-amber-300 font-medium capitalize"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions Preview - Show first few steps */}
                {recipe.instructions && recipe.instructions.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-lg">👨‍🍳</span>
                      <h4 className="text-sm font-bold text-gray-700">Cooking Instructions</h4>
                    </div>
                    <div className="space-y-2">
                      {(expandedInstructions.has(recipe.id) ? recipe.instructions : recipe.instructions.slice(0, 3)).map((instruction, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-white/90 rounded-lg border border-gray-200 hover:bg-white transition-colors">
                          <div className="flex-shrink-0 w-7 h-7 bg-amber-400 text-white text-sm font-bold rounded-full flex items-center justify-center shadow-sm">
                            {index + 1}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {instruction.display_text}
                          </p>
                        </div>
                      ))}
                      {recipe.instructions.length > 3 && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => toggleInstructions(recipe.id)}
                            className="text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-full border-2 border-amber-200 transition-all hover:scale-105"
                          >
                            {expandedInstructions.has(recipe.id) 
                              ? `Show Less Steps` 
                              : `Show ${recipe.instructions.length - 3} More Steps`
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags - Enhanced display with all tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-lg">🏷️</span>
                      <h4 className="text-sm font-bold text-gray-700">Tags</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recipe.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full border-2 border-blue-200 font-medium hover:bg-blue-200 transition-colors cursor-pointer capitalize"
                          onClick={() => handleTagChange(tag.name)}
                        >
                          {tag.name.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nutritional Info - Always show with N/A fallbacks */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">📊</span>
                    <h4 className="text-sm font-bold text-gray-700">Nutrition Info</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-red-50 p-2 rounded-lg border border-red-200 text-center">
                      <p className="text-xs text-red-600 font-medium">Calories</p>
                      <p className="text-sm font-bold text-red-800">
                        {recipe.nutrition?.calories || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg border border-green-200 text-center">
                      <p className="text-xs text-green-600 font-medium">Protein</p>
                      <p className="text-sm font-bold text-green-800">
                        {recipe.nutrition?.protein ? `${recipe.nutrition.protein}g` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-200 text-center">
                      <p className="text-xs text-yellow-600 font-medium">Carbs</p>
                      <p className="text-sm font-bold text-yellow-800">
                        {recipe.nutrition?.carbohydrates ? `${recipe.nutrition.carbohydrates}g` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg border border-purple-200 text-center">
                      <p className="text-xs text-purple-600 font-medium">Fat</p>
                      <p className="text-sm font-bold text-purple-800">
                        {recipe.nutrition?.fat ? `${recipe.nutrition.fat}g` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Show comment if favorited - Enhanced */}
                {isFavorited(recipe.id) && getFavoriteData(recipe.id)?.comment && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <MessageSquare size={16} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-bold text-blue-800 mb-1">Your Personal Note</h5>
                        <p className="text-sm text-blue-700 leading-relaxed">
                          &quot;{getFavoriteData(recipe.id)?.comment}&quot;
                        </p>
                        <p className="text-xs text-blue-500 mt-2 italic">
                          Added on {new Date(getFavoriteData(recipe.id)?.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="mt-6 pt-4 border-t-2 border-gray-200">
                  <button
                    onClick={() => handleHeartClick(recipe)}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all transform hover:scale-105 shadow-lg ${
                      isFavorited(recipe.id)
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                        : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600'
                    }`}
                  >
                    {isFavorited(recipe.id) ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Heart size={18} className="fill-current" />
                        <span>Edit Favorite</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <Heart size={18} />
                        <span>Add to Favorites</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Results Info */}
        <div className="text-center mt-8 mb-4 text-gray-600">
          <p>Showing {Math.min(currentPage * 20 + 1, filteredRecipes.length)} - {Math.min((currentPage + 1) * 20, filteredRecipes.length)} of {filteredRecipes.length} recipes</p>
          {selectedTag && (
            <p className="text-sm mt-1">
              Filtered by: <span className="font-medium capitalize">{selectedTag.replace(/_/g, ' ')}</span>
            </p>
          )}
          {searchTerm && (
            <p className="text-sm mt-1">Search: <span className="font-medium">"{searchTerm}"</span></p>
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
                : 'bg-amber-300 text-white hover:bg-amber-500'
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
                : 'bg-amber-300 text-white hover:bg-amber-500'
            }`}
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
                    className="flex-1 bg-[#3DD1F8] text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="flex-1 bg-amber-300 text-white py-2 px-4 rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
