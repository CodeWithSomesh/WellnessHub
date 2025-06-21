// app/api/favVeganRecipes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connect } from '@/db'
import FavoriteVeganRecipe from '@/modals/favVeganRecipes.modal'

// POST - Add recipe to favorites
export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/favRecipes - Starting request");
    
    const { userId } = await auth();
    console.log("User ID from auth:", userId);
    
    if (!userId) {
      console.log("No userId found - unauthorized");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body;
    try {
      body = await req.json()
      console.log("Request body:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { recipe, comment } = body

    if (!recipe) {
      console.log("No recipe data provided");
      return NextResponse.json({ error: 'Recipe data is required' }, { status: 400 })
    }

    if (!recipe.id) {
      console.log("No recipe ID provided");
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 })
    }

    console.log("Attempting to connect to database...");
    await connect();
    console.log("Database connected successfully");

    // Check if already favorited
    console.log("Checking for existing favorite...");
    const existingFavorite = await FavoriteVeganRecipe.findOne({
      userId,
      recipeId: recipe.id
    })

    if (existingFavorite) {
      console.log("Recipe already in favorites");
      return NextResponse.json({ error: 'Recipe already in favorites' }, { status: 409 })
    }

    // Create new favorite
    console.log("Creating new favorite...");
    const favoriteData = {
      userId,
      recipeId: recipe.id,
      recipeName: recipe.title || 'Unnamed Recipe',
      difficulty: recipe.difficulty || '',
      portion: recipe.portion || '',
      time: recipe.time || '',
      image: recipe.image || '',
      description: recipe.description || '',
      ingredients: recipe.ingredients || [],
      method: recipe.method || [],
      category: recipe.category || '',
      comment: comment || '',
    };

    console.log("Favorite data to save:", JSON.stringify(favoriteData, null, 2));

    const newFavorite = await FavoriteVeganRecipe.create(favoriteData);
    console.log("New favorite created successfully:", newFavorite._id);

    return NextResponse.json({ 
      message: 'Added to favorites',
      favorite: newFavorite 
    }, { status: 201 })

  } 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    console.error("=== ERROR IN POST /api/favRecipes ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    if (error.code === 11000) {
      console.log("Duplicate key error - recipe already favorited");
      return NextResponse.json({ error: 'Recipe already in favorites' }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to add to favorites',
      details: error.message 
    }, { status: 500 })
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
      
      const favorites = await FavoriteVeganRecipe.find({ userId }).sort({ createdAt: -1 })
      
      return NextResponse.json({ favorites })
    } catch (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }
  }