import mongoose from 'mongoose';

export async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri === 'your_mongodb_uri_here') {
    console.warn('[Hikari] Database Warning: MONGO_URI is missing or not configured in .env. Skipping connection.');
    return;
  }

  try {

    mongoose.set('strictQuery', true);

    console.log('\x1b[36mℹ [Database] Connecting to MongoDB Database...\x1b[0m');
    await mongoose.connect(mongoUri);
    console.log('\x1b[32m✔ [Database] Connection established successfully.\x1b[0m');
  } catch (error) {
    console.error('\x1b[31m✖ [Database] Connection failed:\x1b[0m', error.message);
  }
}
