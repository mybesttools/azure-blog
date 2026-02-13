import { connectDB } from '../src/lib/mongodb';
import Post from '../src/models/Post';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function clearPosts() {
  await connectDB();
  
  console.log('Deleting all posts...');
  const result = await Post.deleteMany({});
  console.log(`Deleted ${result.deletedCount} posts`);
  
  process.exit(0);
}

clearPosts().catch(console.error);
