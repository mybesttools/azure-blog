import { connectDB } from '../src/lib/mongodb';
import Post from '../src/models/Post';
import Media from '../src/models/Media';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkPosts() {
  await connectDB();

  console.log('Checking posts...\n');
  
  const posts = await Post.find().limit(2);
  
  for (const post of posts) {
    console.log(`Post: ${post.title}`);
    console.log(`  Slug: ${post.slug}`);
    console.log(`  Status: ${post.status}`);
    console.log(`  CoverImage: ${JSON.stringify(post.coverImage)}`);
    console.log(`  Author.picture: ${JSON.stringify(post.author?.picture)}`);
    console.log('');
  }

  console.log('\nChecking media...\n');
  const mediaCount = await Media.countDocuments();
  console.log(`Total media files: ${mediaCount}`);
  
  const mediaFiles = await Media.find().limit(3);
  for (const media of mediaFiles) {
    console.log(`Media: ${media.filename}`);
    console.log(`  URL: ${media.url}`);
    console.log('');
  }

  process.exit(0);
}

checkPosts().catch(console.error);
