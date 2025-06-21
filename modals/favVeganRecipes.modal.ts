// modals/favVeganRecipes.modal.ts
import mongoose from 'mongoose'

const FavoriteVeganRecipeSchema = new mongoose.Schema({
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

FavoriteVeganRecipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true })

const FavoriteVeganRecipe = mongoose.models.FavoriteVeganRecipe || mongoose.model('FavoriteVeganRecipe', FavoriteVeganRecipeSchema)

export default FavoriteVeganRecipe