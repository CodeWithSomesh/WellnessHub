'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Define the exercise type
interface Exercise {
  id: string
  name: string
  target: string
  bodyPart: string
  equipment: string
  gifUrl: string
  instructions: string[]
  secondaryMuscles: string[]
}

export default function WorkoutsPage() {
  //Initialize State 
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(0)
  const [limit] = useState(12) // Limit to 12 Exercises per page

  // Fetch exercises from the API
  const fetchExercises = async (offset = 0, bodyPartFilter = '') => {
    setLoading(true)
    setError(null)
    
    try {
      let url = 'https://exercisedb.p.rapidapi.com/exercises'
      
      // If bodyPart filter is selected, use the bodyPart endpoint
      if (bodyPartFilter) {
        url = `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${bodyPartFilter}`
      }

      const options = {
        method: 'GET',
        url,
        params: bodyPartFilter ? { limit: limit.toString() } : {
          limit: limit.toString(),
          offset: offset.toString()
        },
        headers: {
          'x-rapidapi-key': '0ec4e2095amsh1c726e3df00bfa6p12aac3jsnecd514c6e9e6',
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com'
        }
      }

      const response = await axios.request(options)
      setExercises(response.data)
    } catch (err) {
      console.error('Error fetching exercises:', err)
      setError('Failed to fetch exercises. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Body parts for filtering
  const bodyParts = [
    'back', 'cardio', 'chest', 'lower arms', 'lower legs',
    'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'
  ]

  useEffect(() => {
    fetchExercises(currentPage * limit, selectedBodyPart)
  }, [currentPage, limit, selectedBodyPart])

  const handleBodyPartChange = (bodyPart: string) => {
    setSelectedBodyPart(bodyPart)
    setCurrentPage(0) // Reset to first page
  }

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1)
  }

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading exercises...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchExercises(currentPage * limit, selectedBodyPart)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Workout Exercises</h1>
          <p className="text-gray-600 text-lg">Discover and learn new exercises for your fitness journey</p>
        </div>

        {/* Filter Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Filter by Body Part:</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBodyPartChange('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedBodyPart === ''
                  ? 'bg-[#D433F8] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            {bodyParts.map((bodyPart) => (
              <button
                key={bodyPart}
                onClick={() => handleBodyPartChange(bodyPart)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  selectedBodyPart === bodyPart
                    ? 'bg-[#D433F8] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {bodyPart}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {exercises.map((exercise) => (
            <div key={exercise.id} className="bg-yellow-100 rounded-lg overflow-hidden font-bold border-4 border-black hover:border-[#D433F8] shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#D433F8] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
              <div className="relative h-72 w-full">
                <Image
                  src={exercise.gifUrl}
                  alt={exercise.name}
                  fill
                  className="object-cover"
                  unoptimized // Since these are GIFs from external API
                />
              </div>
              <div className="p-4 border-t-2 border-amber-300">
                <h3 className="font-bold text-lg lg:text-xl text-gray-800 capitalize mb-4">
                  {exercise.name}
                </h3>
                <div className="space-y-1 text-sm text-gray-600 mb-5">
                  <p className='capitalize'><span className="font-medium">Target:</span> {exercise.target}</p>
                  <p className='capitalize'><span className="font-medium">Body Part:</span> {exercise.bodyPart}</p>
                  <p className='capitalize'><span className="font-medium">Equipment:</span> {exercise.equipment}</p>
                </div>
                {exercise.instructions && exercise.instructions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-bold underline text-gray-700 mb-1">Instructions:</p>
                    <p className="text-xs text-gray-600 line-clamp-3 text-justify">
                      {exercise.instructions[0]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Results Info */}
        <div className="text-center mt-8 mb-4 text-gray-600">
          <p>Showing {exercises.length} exercises</p>
          {selectedBodyPart && (
            <p className="text-sm mt-1">Filtered by: <span className="font-medium capitalize">{selectedBodyPart}</span></p>
          )}
        </div>

        {/* Pagination */}
        {!selectedBodyPart && (
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ChevronLeft />
            </button>
            <span className="text-gray-600 font-medium">
              Page {currentPage + 1}
            </span>
            <button
              onClick={handleNextPage}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <ChevronRight />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}