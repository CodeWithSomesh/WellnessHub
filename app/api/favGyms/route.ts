// app/api/favGyms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connect } from '@/db'
import FavoriteGym from '@/modals/favGyms.modal'

// GET - Fetch user's favourite gyms
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connect()

    const favorites = await FavoriteGym.find({ userId }).sort({ createdAt: -1 })

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error fetching favourite gyms:', error)
    return NextResponse.json({ error: 'Failed to fetch favourite gyms' }, { status: 500 })
  }
}

// POST - Add gym to favourites
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { gym, comment } = body

    if (!gym || !gym.place_id || !gym.name || !gym.formatted_address) {
      return NextResponse.json({ error: 'Incomplete gym data provided' }, { status: 400 })
    }

    await connect()

    const existingFavorite = await FavoriteGym.findOne({
      userId,
      gymId: gym.place_id.toString()
    })

    if (existingFavorite) {
      return NextResponse.json({ error: 'Gym already in favourites' }, { status: 409 })
    }

    const newFavorite = await FavoriteGym.create({
      userId,
      gymId: gym.place_id.toString(),
      gymName: gym.name,
      address: gym.formatted_address,
      phoneNumber: gym.formatted_phone_number || '',
      rating: gym.rating || null,
      photoUrl: gym.photoUrl || '',
      comment: comment || ''
    })

    return NextResponse.json({
      message: 'Gym added to favourites',
      favorite: newFavorite
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding gym to favourites:', error)
    return NextResponse.json({ error: 'Failed to add gym to favourites' }, { status: 500 })
  }
}
