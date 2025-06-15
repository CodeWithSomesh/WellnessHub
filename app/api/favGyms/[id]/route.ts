// app/api/favGyms/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connect } from '@/db'
import FavoriteGym from '@/modals/favGyms.modal'

// PUT - Update comment on favourite gym
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

    const updatedFavorite = await FavoriteGym.findOneAndUpdate(
      { _id: id, userId }, // Ensure the user owns this favourite
      { 
        comment,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!updatedFavorite) {
      return NextResponse.json({ error: 'Favourite gym not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Gym comment updated',
      favorite: updatedFavorite 
    })
  } catch (error) {
    console.error('Error updating favourite gym:', error)
    return NextResponse.json({ error: 'Failed to update gym comment' }, { status: 500 })
  }
}

// DELETE - Remove gym from favourites
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

    const deletedFavorite = await FavoriteGym.findOneAndDelete({
      _id: id,
      userId
    })

    if (!deletedFavorite) {
      return NextResponse.json({ error: 'Favourite gym not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Gym removed from favourites' })
  } catch (error) {
    console.error('Error removing favourite gym:', error)
    return NextResponse.json({ error: 'Failed to remove gym from favourites' }, { status: 500 })
  }
}
