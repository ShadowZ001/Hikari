import mongoose from 'mongoose';

const noprefixSchema = new mongoose.Schema({
  noprefix: {
    type: Boolean,
    default: true
  },
  userId: {
    type: String,
    required: true,
    unique: true
  },
  guildId: {
    type: String,
    default: 'GLOBAL'
  },
  expiresAt: {
    type: Date,
    default: null
  }
});

export default mongoose.model('Noprefix', noprefixSchema);
