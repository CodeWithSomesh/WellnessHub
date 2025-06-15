import { Schema, model, models } from "mongoose";

const FavoriteWorkoutSchema = new Schema({
  // User who favorited this workout
  userId: {
    type: String, 
    required: true,
  },
  // Exercise details from the API (we store them so we don't lose data if API changes)
  exerciseId: {
    type: String,
    required: true,
  },
  exerciseName: {
    type: String,
    required: true,
  },
  target: {
    type: String,
    required: true,
  },
  bodyPart: {
    type: String,
    required: true,
  },
  equipment: {
    type: String,
    required: true,
  },
  gifUrl: {
    type: String,
    required: true,
  },
  instructions: [{
    type: String,
  }],
  
  // User's personal note/comment
  comment: {
    type: String,
    default: "",
  },
  
  // When they favorited it
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  // When comment was last updated
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to prevent duplicate favorites
FavoriteWorkoutSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });

const FavoriteWorkout = models?.FavoriteWorkout || model("FavoriteWorkout", FavoriteWorkoutSchema);

export default FavoriteWorkout;