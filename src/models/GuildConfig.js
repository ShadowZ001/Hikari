import mongoose from 'mongoose';

const GuildConfigSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  ignoredChannels: {
    type: [String],
    default: []
  },
  prefix: {
    type: String,
    default: null
  }
});

export default mongoose.model('GuildConfig', GuildConfigSchema);
