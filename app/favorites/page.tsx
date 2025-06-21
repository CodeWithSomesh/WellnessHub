'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Heart, Clock, Users, MapPin, Utensils, Dumbbell, Star, Trash2, MessageCircle, Edit3, Save, X, Leaf } from 'lucide-react'
import Image from 'next/image'

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

interface FavoriteGym {
  _id: string
  gymId: string
  gymName: string
  address: string
  phoneNumber: string
  rating: number
  photoUrl: string
  comment: string
  createdAt: string
}

export default function FavoritesPage() {
  const { userId } = useAuth()
  const [workouts, setWorkouts] = useState<FavoriteWorkout[]>([])
  const [recipes, setRecipes] = useState<FavoriteRecipe[]>([])
  const [veganRecipes, setVeganRecipes] = useState<FavoriteVeganRecipe[]>([])
  const [gyms, setGyms] = useState<FavoriteGym[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'workouts' | 'recipes' | 'veganRecipes' | 'gyms'>('all')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [editingComment, setEditingComment] = useState<{ type: string, id: string } | null>(null)
  const [editComment, setEditComment] = useState('')

  useEffect(() => {
    if (userId) {
      fetchAllFavorites()
    }
  }, [userId])

  const fetchAllFavorites = async () => {
    try {
      setLoading(true)
      const [workoutsRes, recipesRes, veganRecipesRes, gymsRes] = await Promise.all([
        fetch('/api/favWorkouts'),
        fetch('/api/favRecipes'),
        fetch('/api/favVeganRecipes'),
        fetch('/api/favGyms')
      ])

      const [workoutsData, recipesData, veganRecipesData, gymsData] = await Promise.all([
        workoutsRes.json(),
        recipesRes.json(),
        veganRecipesRes.json(),
        gymsRes.json()
      ])

      setWorkouts(workoutsData.favorites || [])
      setRecipes(recipesData.favorites || [])
      setVeganRecipes(veganRecipesData.favorites || [])
      setGyms(gymsData.favorites || [])
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (type: 'workout' | 'recipe' | 'veganRecipe' | 'gym', id: string) => {
    try {
      const endpoint = type === 'workout' ? `/api/favWorkouts/${id}` : 
                     type === 'recipe' ? `/api/favRecipes/${id}` : 
                     type === 'veganRecipe' ? `/api/favVeganRecipes/${id}` : `/api/favGyms/${id}`
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        if (type === 'workout') {
          setWorkouts(prev => prev.filter(item => item._id !== id))
        } else if (type === 'recipe') {
          setRecipes(prev => prev.filter(item => item._id !== id))
        } else if (type === 'veganRecipe') {
          setVeganRecipes(prev => prev.filter(item => item._id !== id))
        } else {
          setGyms(prev => prev.filter(item => item._id !== id))
        }
      } else {
        console.error('Failed to remove favorite')
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  const updateComment = async (type: 'workout' | 'recipe' | 'veganRecipe' | 'gym', id: string, comment: string) => {
    try {
      const endpoint = type === 'workout' ? `/api/favWorkouts/${id}` : 
                     type === 'recipe' ? `/api/favRecipes/${id}` : 
                     type === 'veganRecipe' ? `/api/favVeganRecipes/${id}` : `/api/favGyms/${id}`
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment })
      })

      if (response.ok) {
        // Update the local state
        if (type === 'workout') {
          setWorkouts(prev => prev.map(item => 
            item._id === id ? { ...item, comment } : item
          ))
        } else if (type === 'recipe') {
          setRecipes(prev => prev.map(item => 
            item._id === id ? { ...item, comment } : item
          ))
        } else if (type === 'veganRecipe') {
          setVeganRecipes(prev => prev.map(item => 
            item._id === id ? { ...item, comment } : item
          ))
        } else {
          setGyms(prev => prev.map(item => 
            item._id === id ? { ...item, comment } : item
          ))
        }
        setEditingComment(null)
        setEditComment('')
      } else {
        console.error('Failed to update comment')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const startEditing = (type: string, id: string, currentComment: string) => {
    setEditingComment({ type, id })
    setEditComment(currentComment || '')
  }

  const cancelEditing = () => {
    setEditingComment(null)
    setEditComment('')
  }

  const saveComment = () => {
    if (editingComment) {
      updateComment(editingComment.type as 'workout' | 'recipe' | 'veganRecipe' | 'gym', editingComment.id, editComment)
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCards(newExpanded)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const CommentSection = ({ 
    comment, 
    type, 
    id, 
    colorScheme 
  }: { 
    comment: string, 
    type: string, 
    id: string, 
    colorScheme: { bg: string, border: string, text: string, icon: string } 
  }) => {
    const isEditing = editingComment?.type === type && editingComment?.id === id

    return (
      <div className={`${colorScheme.bg} ${colorScheme.border} rounded-lg p-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageCircle className={`w-4 h-4 ${colorScheme.icon}`} />
            <span className={`text-sm font-medium ${colorScheme.text}`}>Your Note</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => startEditing(type, id, comment)}
              className={`${colorScheme.icon} hover:opacity-70 p-1`}
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
              rows={3}
              placeholder="Add your note..."
            />
            <div className="flex justify-end gap-2 rounded-md">
              <button
                onClick={saveComment}
                className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={cancelEditing}
                className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-700"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className={`text-sm ${colorScheme.text}`}>
            {comment || 'No note added yet. Click the edit icon to add one!'}
          </p>
        )}
      </div>
    )
  }

  const WorkoutCard = ({ workout }: { workout: FavoriteWorkout }) => (
    <div className="bg-white border-4 border-black rounded-lg p-6 shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500 border-2 border-black rounded-lg p-3">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div className='mr-4'>
            <h3 className="text-xl font-bold text-gray-800 capitalize">{workout.exerciseName}</h3>
            <p className="text-gray-600 capitalize">{workout.target} • {workout.bodyPart}</p>
          </div>
        </div>
        <div className="flex border-2 border-gray-600 rounded-md">
          <button
            onClick={() => startEditing('workout', workout._id, workout.comment)}
            className="text-white bg-blue-500 p-2 border-r-2 border-gray-600  cursor-pointer hover:bg-blue-800 hover:text-white transition-all duration-200 rounded-l-sm"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => removeFavorite('workout', workout._id)}
            className="text-white bg-red-500 p-2 cursor-pointer hover:bg-red-800 hover:text-white transition-all duration-200 rounded-r-sm"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {workout.gifUrl && (
        <div className="mb-4 border-2 border-black rounded-lg overflow-hidden relative h-[480px] w-full">
          <Image 
            unoptimized
            fill
            src={workout.gifUrl} 
            alt={workout.exerciseName}
            className="object-cover"
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="bg-yellow-200 border border-black px-3 py-1 rounded-full font-medium">
            {workout.equipment}
          </span>
        </div>

        {workout.instructions.length > 0 && (
          <div>
            <button
              onClick={() => toggleExpanded(workout._id)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-2"
            >
              {expandedCards.has(workout._id) ? 'Hide Instructions' : 'Show Instructions'}
            </button>
            {expandedCards.has(workout._id) && (
              <ul className="text-sm text-gray-700 space-y-1 bg-gray-50 border border-gray-200 rounded p-3">
                {workout.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-purple-600 font-medium">{index + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <CommentSection
          comment={workout.comment}
          type="workout"
          id={workout._id}
          colorScheme={{
            bg: 'bg-blue-50',
            border: 'border-2 border-blue-200',
            text: 'text-blue-700',
            icon: 'text-blue-600'
          }}
        />

        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          Added on {formatDate(workout.createdAt)}
        </div>
      </div>
    </div>
  )

  const RecipeCard = ({ recipe }: { recipe: FavoriteRecipe }) => (
    <div className="bg-white border-4 border-black rounded-lg p-6 shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-400 border-2 border-black rounded-lg p-3">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div className='mr-4'>
            <h3 className="text-xl font-bold text-gray-800 capitalize">{recipe.recipeName}</h3>
            <p className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <strong>Total Prep Time:</strong> 
              {recipe.totalTime} min
            </p>
            
          </div>
        </div>
        <div className="flex border-2 border-gray-600 rounded-md">
          <button
            onClick={() => startEditing('recipe', recipe._id, recipe.comment)}
            className="text-white bg-blue-500 p-2 border-r-2 border-gray-600  cursor-pointer hover:bg-blue-800 hover:text-white transition-all duration-200 rounded-l-sm"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => removeFavorite('recipe', recipe._id)}
            className="text-white bg-red-500 p-2 cursor-pointer hover:bg-red-800 hover:text-white transition-all duration-200 rounded-r-sm"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {recipe.thumbnailUrl && (
        <div className="mb-4 border-2 border-black rounded-lg overflow-hidden relative h-96 w-full">
          <Image
            fill
            src={recipe.thumbnailUrl} 
            alt={recipe.recipeName}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex gap-2 text-sm">
          {/* {recipe.prepTime > 0 && (
            <span className="bg-yellow-200 border border-black px-3 py-1 rounded-full font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {recipe.prepTime}min prep
            </span>
          )} */}
          {recipe.servings > 0 && (
            <span className="bg-blue-200 border border-black px-3 py-1 rounded-full font-medium flex items-center gap-1">
              <Users className="w-3 h-3" />
              {recipe.servings} servings
            </span>
          )}
        </div>

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.map((tag, index) => (
              <span key={index} className="bg-pink-200 border capitalize border-black px-2 py-1 rounded text-xs font-medium">
                {tag.replace(/_/g, ' ')}
              </span>
            ))}
            {/* {recipe.tags.length > 3 && (
              <span className="text-xs text-gray-500 flex items-center">+{recipe.tags.length - 3} more</span>
            )} */}
          </div>
        )}

        <div>
          <button
            onClick={() => toggleExpanded(recipe._id)}
            className="text-sm font-medium text-green-600 hover:text-green-800 mb-2"
          >
            {expandedCards.has(recipe._id) ? 'Hide Description' : 'Show Description'}
          </button>
          {expandedCards.has(recipe._id) && (
            <div className="space-y-3 bg-gray-50 border border-gray-200 rounded p-3">
              <div className="text-sm text-gray-700">
                {recipe.description && (
                  <p className="text-gray-600 text-sm">{recipe.description}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <CommentSection
          comment={recipe.comment}
          type="recipe"
          id={recipe._id}
          colorScheme={{
            bg: 'bg-green-50',
            border: 'border-2 border-green-200',
            text: 'text-green-700',
            icon: 'text-green-600'
          }}
        />

        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          Added on {formatDate(recipe.createdAt)}
        </div>
      </div>
    </div>
  )

  const VeganRecipeCard = ({ recipe }: { recipe: FavoriteVeganRecipe }) => (
    <div className="bg-white border-4 border-black rounded-lg p-6 shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 border-2 border-black rounded-lg p-3">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div className='mr-4'>
            <h3 className="text-xl font-bold text-gray-800 capitalize">{recipe.recipeName}</h3>
            {recipe.description && (
              <p className="text-gray-600 text-sm">{recipe.description.slice(0, 100)}...</p>
            )}
          </div>
        </div>
        <div className="flex border-2 border-gray-600 rounded-md">
          <button
            onClick={() => startEditing('veganRecipe', recipe._id, recipe.comment)}
            className="text-white bg-blue-500 p-2 border-r-2 border-gray-600  cursor-pointer hover:bg-blue-800 hover:text-white transition-all duration-200 rounded-l-sm"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => removeFavorite('veganRecipe', recipe._id)}
            className="text-white bg-red-500 p-2 cursor-pointer hover:bg-red-800 hover:text-white transition-all duration-200 rounded-r-sm"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {recipe.image && (
        <div className="mb-4 border-2 border-black rounded-lg overflow-hidden relative h-96 w-full">
          <Image 
            unoptimized
            fill
            src={recipe.image} 
            alt={recipe.recipeName}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex gap-2 text-sm">
          {recipe.time && (
            <span className="bg-yellow-200 border border-black px-3 py-1 rounded-full font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {recipe.time}
            </span>
          )}
          {recipe.portion && (
            <span className="bg-blue-200 border border-black px-3 py-1 rounded-full font-medium flex items-center gap-1">
              <Users className="w-3 h-3" />
              {recipe.portion}
            </span>
          )}
          {recipe.difficulty && (
            <span className="bg-orange-200 border border-black px-3 py-1 rounded-full font-medium">
              {recipe.difficulty}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="bg-emerald-200 border border-black px-3 py-1 rounded-full font-medium flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              Vegan
            </span>
          </div>
        </div>

        

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div>
            <button
              onClick={() => toggleExpanded(recipe._id)}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-800 mb-2"
            >
              {expandedCards.has(recipe._id) ? 'Hide Ingredients' : 'Show Ingredients'}
            </button>
            {expandedCards.has(recipe._id) && (
              <div className="space-y-3 bg-gray-50 border border-gray-200 rounded p-3">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Ingredients:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {recipe.ingredients.slice(0, 5).map((ingredient, index) => (
                      <li key={index}>• {ingredient}</li>
                    ))}
                    {recipe.ingredients.length > 5 && (
                      <li className="text-gray-500">+{recipe.ingredients.length - 5} more ingredients</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <CommentSection
          comment={recipe.comment}
          type="veganRecipe"
          id={recipe._id}
          colorScheme={{
            bg: 'bg-emerald-50',
            border: 'border-2 border-emerald-200',
            text: 'text-emerald-700',
            icon: 'text-emerald-600'
          }}
        />

        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          Added on {formatDate(recipe.createdAt)}
        </div>
      </div>
    </div>
  )

  const GymCard = ({ gym }: { gym: FavoriteGym }) => (
    <div className="bg-white border-4 border-black rounded-lg p-6 shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 border-2 border-black rounded-lg p-3">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div className='mr-4'>
            <h3 className="text-xl font-bold text-gray-800 capitalize">{gym.gymName}</h3>
            <p className="text-gray-600 text-sm">{gym.address}</p>
          </div>
        </div>
        <div className="flex border-2 border-gray-600 rounded-md">
          <button
            onClick={() => startEditing('gym', gym._id, gym.comment)}
            className="text-white bg-blue-500 p-2 border-r-2 border-gray-600  cursor-pointer hover:bg-blue-800 hover:text-white transition-all duration-200 rounded-l-sm"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => removeFavorite('gym', gym._id)}
            className="text-white bg-red-500 p-2 cursor-pointer hover:bg-red-800 hover:text-white transition-all duration-200 rounded-r-sm"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {gym.photoUrl && (
        <div className="mb-4 border-2 border-black rounded-lg overflow-hidden">
          <Image width={400} height={200}
            src={gym.photoUrl} 
            alt={gym.gymName}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex gap-2 text-sm">
          {gym.rating && (
            <span className="bg-yellow-200 border border-black px-3 py-1 rounded-full font-medium flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              {gym.rating}/5
            </span>
          )}
          {gym.phoneNumber && (
            <span className="bg-blue-200 border border-black px-3 py-1 rounded-full font-medium text-xs flex items-center">
              {gym.phoneNumber}
            </span>
          )}
        </div>

        <CommentSection
          comment={gym.comment}
          type="gym"
          id={gym._id}
          colorScheme={{
            bg: 'bg-red-50',
            border: 'border-2 border-red-200',
            text: 'text-red-700',
            icon: 'text-red-600'
          }}
        />

        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          Added on {formatDate(gym.createdAt)}
        </div>
      </div>
    </div>
  )

  const allFavorites = [
    ...workouts.map(w => ({ ...w, type: 'workout' as const })),
    ...recipes.map(r => ({ ...r, type: 'recipe' as const })),
    ...veganRecipes.map(vr => ({ ...vr, type: 'veganRecipe' as const })),
    ...gyms.map(g => ({ ...g, type: 'gym' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  
  //***************** Remove the getFilteredFavorites function and currentFavorites variable entirely ***********************
  //*********************** The filtering logic will be handled directly in the render section ***********************
  // // Get filtered favorites based on active tab
  // const getFilteredFavorites = () => {
  //   switch (activeTab) {
  //     case 'workouts':
  //       return workouts
  //     case 'recipes':
  //       return recipes
  //     case 'veganRecipes':
  //       return veganRecipes
  //     case 'gyms':
  //       return gyms
  //     default:
  //       return allFavorites
  //   }
  // }

  // const currentFavorites = getFilteredFavorites()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your favorites...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-pink-500 border-4 border-black rounded-full p-4">
              <Heart className="w-8 h-8 text-white fill-current" />
            </div>
            <h1 className="text-5xl font-black text-gray-800">My Favorites</h1>
            <div className="bg-pink-500 border-4 border-black rounded-full p-4">
              <Heart className="w-8 h-8 text-white fill-current" />
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            All your saved workouts, recipes, and gyms in one place
          </p>
        </div>
  
        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { key: 'all', label: `All (${allFavorites.length})`, color: 'bg-gray-500' },
            { key: 'workouts', label: `Workouts (${workouts.length})`, color: 'bg-purple-500' },
            { key: 'recipes', label: `Classic Recipes (${recipes.length})`, color: 'bg-amber-400' },
            { key: 'veganRecipes', label: `Vegan Recipes (${veganRecipes.length})`, color: 'bg-emerald-500' },
            { key: 'gyms', label: `Gyms (${gyms.length})`, color: 'bg-red-500' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'all' | 'workouts' | 'recipes' | 'veganRecipes' | 'gyms')}
              className={`px-6 py-3 border-3 border-black rounded-lg font-bold text-white transition-all duration-200 hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 ${
                activeTab === tab.key ? `${tab.color} shadow-[4px_4px_0px_0px_#000] -translate-x-1 -translate-y-1` : `${tab.color} opacity-70`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
  
        {/* Content */}
        {allFavorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white border-4 border-black rounded-lg p-12 max-w-md mx-auto shadow-[8px_8px_0px_0px_#000]">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">No favorites yet!</h3>
              <p className="text-gray-600 mb-6">
                Start exploring workouts, recipes, and gyms to build your collection of favorites.
              </p>
              <div className="space-y-2">
                <a href="/workouts" className="block bg-purple-500 border-3 border-black rounded-lg px-6 py-3 text-white font-bold hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200">
                  Browse Workouts
                </a>
                <a href="/classic-recipes" className="block bg-green-500 border-3 border-black rounded-lg px-6 py-3 text-white font-bold hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200">
                  Explore Classic Recipes
                </a>
                <a href="/vegan-recipes" className="block bg-emerald-500 border-3 border-black rounded-lg px-6 py-3 text-white font-bold hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200">
                  Discover Vegan Recipes
                </a>
                <a href="/gyms" className="block bg-red-500 border-3 border-black rounded-lg px-6 py-3 text-white font-bold hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200">
                  Find Gyms
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeTab === 'all' && allFavorites.map((item) => (
              <div key={`${item.type}-${item._id}`}>
                {item.type === 'workout' && <WorkoutCard workout={item as FavoriteWorkout} />}
                {item.type === 'recipe' && <RecipeCard recipe={item as FavoriteRecipe} />}
                {item.type === 'veganRecipe' && <VeganRecipeCard recipe={item as FavoriteVeganRecipe} />}
                {item.type === 'gym' && <GymCard gym={item as FavoriteGym} />}
              </div>
            ))}
            {activeTab === 'workouts' && workouts.map((workout) => (
              <WorkoutCard key={workout._id} workout={workout} />
            ))}
            {activeTab === 'recipes' && recipes.map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} />
            ))}
            {activeTab === 'veganRecipes' && veganRecipes.map((recipe) => (
              <VeganRecipeCard key={recipe._id} recipe={recipe} />
            ))}
            {activeTab === 'gyms' && gyms.map((gym) => (
              <GymCard key={gym._id} gym={gym} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 