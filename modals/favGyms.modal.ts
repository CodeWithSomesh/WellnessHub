// modals/favGyms.modal.ts
import mongoose from 'mongoose'

const FavoriteGymSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  gymId: {
    type: String,
    required: true
  },
  gymName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: null
  },
  photoUrl: {
    type: String,
    default: ''
  },
  comment: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

// Ensure a gym is only favourited once per user
FavoriteGymSchema.index({ userId: 1, gymId: 1 }, { unique: true })

const FavoriteGym = mongoose.models.FavoriteGym || mongoose.model('FavoriteGym', FavoriteGymSchema)

export default FavoriteGym
