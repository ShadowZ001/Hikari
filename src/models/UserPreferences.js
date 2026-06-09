import mongoose from 'mongoose';

const UserPreferencesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  musicSource: {
    type: String,
    enum: ['ytsearch', 'ytmsearch', 'spsearch', 'scsearch', 'dzsearch', 'jssearch'],
    default: 'ytmsearch'
  }
}, {
  timestamps: true
});

export default mongoose.model('UserPreferences', UserPreferencesSchema);
