// app/api/favRecipes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connect } from '@/db'
import FavoriteRecipe from '@/modals/favRecipes.modal'

// PUT - Update favorite recipe comment
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { comment } = body

    await connect()

    const favorite = await FavoriteRecipe.findOneAndUpdate(
      { _id: params.id, userId }, // Ensure user owns this favorite
      { comment },
      { new: true }
    )

    if (!favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Comment updated successfully',
      favorite 
    })

  } catch (error) {
    console.error('Error updating favorite:', error)
    return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 })
  }
}

// DELETE - Remove recipe from favorites
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connect()

    const favorite = await FavoriteRecipe.findOneAndDelete({
      _id: params.id,
      userId // Ensure user owns this favorite
    })

    if (!favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Removed from favorites successfully' 
    })

  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
  }
}