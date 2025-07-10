// app/api/favWorkouts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connect } from '@/db'
import FavoriteWorkout from '@/modals/favWorkouts.modal'


// POST - Add workout to favorites
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const session = await auth();
    console.log("Session Info:", session); // Should have userId

    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { exercise, comment } = body

    if (!exercise || !exercise.id) {
      return NextResponse.json({ error: 'Exercise data is required' }, { status: 400 })
    }

    await connect();

    // Check if already favorited
    const existingFavorite = await FavoriteWorkout.findOne({
      userId,
      exerciseId: exercise.id
    })

    if (existingFavorite) {
      return NextResponse.json({ error: 'Exercise already in favorites' }, { status: 409 })
    }

    // Create new favorite
    const newFavorite = await FavoriteWorkout.create({
      userId,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      target: exercise.target,
      bodyPart: exercise.bodyPart,
      equipment: exercise.equipment,
      gifUrl: exercise.gifUrl,
      imageUrl: exercise.imageUrl,
      instructions: exercise.instructions || [],
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

// GET - Fetch user's favorite workouts
export async function GET() {
    try {
      const { userId } = await auth()
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      await connect()
      
      const favorites = await FavoriteWorkout.find({ userId }).sort({ createdAt: -1 })
      
      return NextResponse.json({ favorites })
    } catch (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }
  }