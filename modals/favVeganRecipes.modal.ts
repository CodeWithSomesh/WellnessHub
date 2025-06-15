// modals/favRecipes.modal.ts
import mongoose from 'mongoose'

const favoriteRecipeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  recipeId: {
    type: String,
    required: true,
  },
  recipeName: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
  },
  portion: {
    type: String,
  },
  time: {
    type: String,
  },
  image: {
    type: String,
  },
  description: {
    type: String,
  },
  ingredients: [{
    type: String,
  }],
  method: [{
    type: String,
  }],
  category: {
    type: String,
  },
  comment: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
})

// Create compound index to prevent duplicate favorites
favoriteRecipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true })

const FavoriteRecipe = mongoose.models.FavoriteRecipe || mongoose.model('FavoriteRecipe', favoriteRecipeSchema)

export default FavoriteRecipe