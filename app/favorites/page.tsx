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
            <div className="flex border-2 border-gray-600 rounded-md">
              <button
                onClick={saveComment}
                className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
              <button
                onClick={cancelEditing}
                className="flex items-center gap-1 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
              >
                <X className="w-3 h-3" />
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

  return <div>Favorites Page - CommentSection Component Added</div>
}