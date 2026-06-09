import mongoose from 'mongoose';

const BlacklistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: String,
    required: true
  }
});

export default mongoose.model('Blacklist', BlacklistSchema);
