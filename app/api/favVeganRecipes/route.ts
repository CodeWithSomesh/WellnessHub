// app/api/favRecipes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connect } from '@/db'
import FavoriteRecipe from '@/modals/favRecipes.modal'

// POST - Add recipe to favorites
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const session = await auth();
    console.log("Session Info:", session); // Should have userId

    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { recipe, comment } = body

    if (!recipe || !recipe.id) {
      return NextResponse.json({ error: 'Recipe data is required' }, { status: 400 })
    }

    await connect();

    // Check if already favorited
    const existingFavorite = await FavoriteRecipe.findOne({
      userId,
      recipeId: recipe.id
    })

    if (existingFavorite) {
      return NextResponse.json({ error: 'Recipe already in favorites' }, { status: 409 })
    }

    // Create new favorite
    const newFavorite = await FavoriteRecipe.create({
      userId,
      recipeId: recipe.id,
      recipeName: recipe.title,
      difficulty: recipe.difficulty,
      portion: recipe.portion,
      time: recipe.time,
      image: recipe.image,
      description: recipe.description,
      ingredients: recipe.ingredients || [],
      method: recipe.method || [],
      category: recipe.category,
      comment: comment || '',
    })

    return NextResponse.json({ 
      message: 'Added to favorites',
      favorite: newFavorite 
    }, { status: 201 })

  } catch (error) {
    console.log("Its entering the catch part")
    console.error('Error adding to favorites:', error)
    return NextResponse.json({ error: 'Failed to add to favorites' }, { status: 500 })
  }
}

// GET - Fetch user's favorite recipes
export async function GET() {
    try {
      const { userId } = await auth()
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      await connect()
      
      const favorites = await FavoriteRecipe.find({ userId }).sort({ createdAt: -1 })
      
      return NextResponse.json({ favorites })
    } catch (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }
  }