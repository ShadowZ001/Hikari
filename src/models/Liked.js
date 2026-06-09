import mongoose from 'mongoose';

const LikedSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  songs: [
    {
      title: { type: String, required: true },
      uri: { type: String, required: true },
      duration: { type: String },
      thumbnail: { type: String },
      artist: { type: String },
      durationMs: { type: Number },
      addedAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

export default mongoose.model('Liked', LikedSchema);
