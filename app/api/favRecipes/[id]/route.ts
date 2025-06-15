// app/api/favRecipes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connect } from '@/db'
import FavoriteRecipe from '@/modals/favRecipes.modal'

// PUT - Update comment on favorite recipe
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { comment } = await req.json()
    const { id } = await params

    await connect()

    const updatedFavorite = await FavoriteRecipe.findOneAndUpdate(
      { _id: id, userId }, // Make sure user owns this favorite
      { 
        comment,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!updatedFavorite) {
      return NextResponse.json({ error: 'Favorite recipe not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Recipe comment updated',
      favorite: updatedFavorite 
    })
  } catch (error) {
    console.error('Error updating favorite recipe:', error)
    return NextResponse.json({ error: 'Failed to update recipe comment' }, { status: 500 })
  }
}

// DELETE - Remove recipe from favorites
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connect()

    const { id } = await params

    const deletedFavorite = await FavoriteRecipe.findOneAndDelete({
      _id: id,
      userId
    })

    if (!deletedFavorite) {
      return NextResponse.json({ error: 'Favorite recipe not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Recipe removed from favorites' })
  } catch (error) {
    console.error('Error removing favorite recipe:', error)
    return NextResponse.json({ error: 'Failed to remove recipe from favorites' }, { status: 500 })
  }
}