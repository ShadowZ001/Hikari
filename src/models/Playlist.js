import mongoose from 'mongoose';

const PlaylistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  tracks: {
    type: [
      {
        title: String,
        uri: String,
        duration: String,
        artist: String,
        thumbnail: String,
        durationMs: Number
      }
    ],
    default: []
  }
}, {
  timestamps: true
});

PlaylistSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('Playlist', PlaylistSchema);
