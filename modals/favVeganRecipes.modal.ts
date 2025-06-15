// modals/favVeganRecipes.modal.ts
import mongoose from 'mongoose'

const FavoriteVeganRecipeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  recipeId: {
    type: String,
    required: true
  },
  recipeName: {
    type: String,
    required: true
  },
  difficuty: {
    type: String,
    default: ''
  },
  portion: {
    type: String,
    default: ''
  },
  time: {
    type: String,
    default: ''
  },
  image: {
    type: Number,
    default: 0
  },
  description: {
    type: Number,
    default: 0
  },
  ingredients: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  instructions: [{
    step: Number,
    text: String
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
  
})

// Compound index to ensure unique recipe per user
FavoriteVeganRecipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true })

const FavoriteRecipe = mongoose.models.FavoriteRecipe || mongoose.model('FavoriteRecipe', FavoriteVeganRecipeSchema)

export default FavoriteRecipe