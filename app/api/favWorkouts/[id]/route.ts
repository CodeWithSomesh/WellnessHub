// app/api/favWorkouts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connect } from '@/db'
import FavoriteWorkout from '@/modals/favWorkouts.modal'

// PUT - Update comment on favorite workout
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { comment } = await req.json()
    const { id } = params

    await connect()

    const updatedFavorite = await FavoriteWorkout.findOneAndUpdate(
      { _id: id, userId }, // Make sure user owns this favorite
      { 
        comment,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!updatedFavorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Comment updated',
      favorite: updatedFavorite 
    })

  } catch (error) {
    console.error('Error updating favorite:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

// DELETE - Remove from favorites
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connect()

    const { id } = params

    const deletedFavorite = await FavoriteWorkout.findOneAndDelete({
      _id: id,
      userId
    })

    if (!deletedFavorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Removed from favorites' })

  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json({ error: 'Failed to remove from favorites' }, { status: 500 })
  }
}