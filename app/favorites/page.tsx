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

  return <div>Favorites Page - Data Loading Complete</div>
}