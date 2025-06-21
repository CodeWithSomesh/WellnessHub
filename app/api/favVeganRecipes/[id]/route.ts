// app/api/favVeganRecipes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connect } from '@/db'
import FavoriteVeganRecipe from '@/modals/favVeganRecipes.modal'

// PUT - Update comment on favorite vegan recipe
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("PUT /api/favVeganRecipes/[id] - Starting request");
    
    const { userId } = await auth()
    console.log("User ID from auth:", userId);
    
    if (!userId) {
      console.log("No userId found - unauthorized");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { comment } = await req.json()
    const { id } = await params
    console.log("Updating favorite with ID:", id, "Comment:", comment);

    console.log("Attempting to connect to database...");
    await connect()
    console.log("Database connected successfully");

    const updatedFavorite = await FavoriteVeganRecipe.findOneAndUpdate(
      { _id: id, userId }, // Make sure user owns this favorite
      { 
        comment,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!updatedFavorite) {
      console.log("Favorite vegan recipe not found");
      return NextResponse.json({ error: 'Favorite vegan recipe not found' }, { status: 404 })
    }

    console.log("Vegan recipe comment updated successfully");
    return NextResponse.json({ 
      message: 'Vegan recipe comment updated',
      favorite: updatedFavorite 
    })
  } 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    console.error("=== ERROR IN PUT /api/favVeganRecipes/[id] ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to update vegan recipe comment',
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE - Remove vegan recipe from favorites
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("DELETE /api/favVeganRecipes/[id] - Starting request");
    
    const { userId } = await auth()
    console.log("User ID from auth:", userId);
    
    if (!userId) {
      console.log("No userId found - unauthorized");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log("Attempting to connect to database...");
    await connect()
    console.log("Database connected successfully");

    const { id } = await params
    console.log("Deleting favorite with ID:", id);

    const deletedFavorite = await FavoriteVeganRecipe.findOneAndDelete({
      _id: id,
      userId
    })

    if (!deletedFavorite) {
      console.log("Favorite vegan recipe not found");
      return NextResponse.json({ error: 'Favorite vegan recipe not found' }, { status: 404 })
    }

    console.log("Vegan recipe removed from favorites successfully");
    return NextResponse.json({ message: 'Vegan recipe removed from favorites' })
  } 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    console.error("=== ERROR IN DELETE /api/favVeganRecipes/[id] ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to remove vegan recipe from favorites',
      details: error.message 
    }, { status: 500 })
  }
}