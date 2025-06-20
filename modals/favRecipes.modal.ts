import mongoose from 'mongoose'

const FavoriteRecipeSchema = new mongoose.Schema({
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
  description: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  videoUrl: {
    type: String,
    default: ''
  },
  prepTime: {
    type: Number,
    default: 0
  },
  cookTime: {
    type: Number,
    default: 0
  },
  totalTime: {
    type: Number,
    default: 0
  },
  servings: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  ingredients: [{
    name: String,
    quantity: String,
    unit: String
  }],
  instructions: [{
    step: Number,
    text: String
  }],
  nutrition: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    carbohydrates: { type: Number, default: 0 }
  },
  comment: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

// Compound index to ensure unique recipe per user
FavoriteRecipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true })

const FavoriteRecipe = mongoose.models.FavoriteRecipe || mongoose.model('FavoriteRecipe', FavoriteRecipeSchema)

export default FavoriteRecipe