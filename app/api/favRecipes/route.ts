// app/api/favRecipes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connect } from '@/db'
import FavoriteClassicRecipe from '@/modals/favRecipes.modal'

// GET - Fetch user's favorite recipes
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connect()
    
    const favorites = await FavoriteClassicRecipe.find({ userId }).sort({ createdAt: -1 })
    
    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error fetching favorite recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch favorite recipes' }, { status: 500 })
  }
}

// POST - Add recipe to favorites
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
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
    const existingFavorite = await FavoriteClassicRecipe.findOne({
      userId,
      recipeId: recipe.id.toString()
    })

    if (existingFavorite) {
      return NextResponse.json({ error: 'Recipe already in favorites' }, { status: 409 })
    }

    // Extract ingredients from recipe sections
    const ingredients = []
    if (recipe.sections && recipe.sections.length > 0) {
      for (const section of recipe.sections) {
        if (section.components) {
          for (const component of section.components) {
            const ingredient = {
              name: component.ingredient.name,
              quantity: component.measurements && component.measurements[0] ? component.measurements[0].quantity : '',
              unit: component.measurements && component.measurements[0] && component.measurements[0].unit ? component.measurements[0].unit.name : ''
            }
            ingredients.push(ingredient)
          }
        }
      }
    }

    // Extract instructions
    const instructions = []
    if (recipe.instructions && recipe.instructions.length > 0) {
      for (const instruction of recipe.instructions) {
        instructions.push({
          step: instruction.position,
          text: instruction.display_text
        })
      }
    }

    // Extract tags
    const tags = []
    if (recipe.tags && recipe.tags.length > 0) {
      for (const tag of recipe.tags) {
        tags.push(tag.name)
      }
    }

    // Create new favorite
    const newFavorite = await FavoriteClassicRecipe.create({
      userId,
      recipeId: recipe.id.toString(),
      recipeName: recipe.name,
      description: recipe.description || '',
      thumbnailUrl: recipe.thumbnail_url || '',
      videoUrl: recipe.video_url || '',
      prepTime: recipe.prep_time_minutes || 0,
      cookTime: recipe.cook_time_minutes || 0,
      totalTime: recipe.total_time_minutes || 0,
      servings: recipe.servings || 0,
      tags,
      ingredients,
      instructions,
      nutrition: {
        calories: recipe.nutrition?.calories || 0,
        protein: recipe.nutrition?.protein || 0,
        fat: recipe.nutrition?.fat || 0,
        carbohydrates: recipe.nutrition?.carbohydrates || 0
      },
      comment: comment || '',
    })

    return NextResponse.json({ 
      message: 'Recipe added to favorites',
      favorite: newFavorite 
    }, { status: 201 })

  } catch (error) {
    console.log("Error adding recipe to favorites:", error)
    console.error('Error adding recipe to favorites:', error)
    return NextResponse.json({ error: 'Failed to add recipe to favorites' }, { status: 500 })
  }
}