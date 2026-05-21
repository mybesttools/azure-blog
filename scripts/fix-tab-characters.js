import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/azure-blog';

(async () => {
  console.log('Connecting to:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  
  const db = mongoose.connection.db;
  
  // Fix posts collection - coverImage field
  const posts = await db.collection('posts').find({}).toArray();
  let fixedPosts = 0;
  
  for (const post of posts) {
    let needsUpdate = false;
    const updates = {};
    
    // Check coverImage field
    if (typeof post.coverImage === 'string' && post.coverImage.includes('\t')) {
      updates.coverImage = post.coverImage.replace(/\t/g, '');
      needsUpdate = true;
    }
    
    // Check if coverImage is an ObjectId reference that we need to populate
    // (no tab chars in ObjectIds, so skip)
    
    if (needsUpdate) {
      await db.collection('posts').updateOne(
        { _id: post._id },
        { $set: updates }
      );
      fixedPosts++;
      console.log(`Fixed post: ${post.title || post.slug}`);
      console.log(`  Old coverImage: ${JSON.stringify(post.coverImage)}`);
      console.log(`  New coverImage: ${JSON.stringify(updates.coverImage)}`);
    }
  }
  
  // Fix media collection - url field
  const media = await db.collection('media').find({}).toArray();
  let fixedMedia = 0;
  
  for (const m of media) {
    if (m.url && m.url.includes('\t')) {
      const cleanUrl = m.url.replace(/\t/g, '');
      await db.collection('media').updateOne(
        { _id: m._id },
        { $set: { url: cleanUrl } }
      );
      fixedMedia++;
      console.log(`Fixed media: ${m.filename}`);
      console.log(`  Old URL: ${JSON.stringify(m.url)}`);
      console.log(`  New URL: ${JSON.stringify(cleanUrl)}`);
    }
  }
  
  console.log(`\n✓ Fixed ${fixedPosts} posts and ${fixedMedia} media items`);
  process.exit(0);
})();
