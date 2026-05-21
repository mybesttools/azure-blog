import mongoose from 'mongoose';

(async () => {
  await mongoose.connect('mongodb://localhost:27017/azure-blog');
  
  const posts = await mongoose.connection.db.collection('posts')
    .find({}, {projection: {title: 1, coverImage: 1}}).toArray();
  
  console.log('\nPosts coverImages:');
  posts.forEach(p => {
    console.log('Title:', p.title);
    console.log('  coverImage:', p.coverImage);
    if (typeof p.coverImage === 'string') {
      const hex = Buffer.from(p.coverImage).toString('hex').substring(0, 40);
      console.log('  Hex:', hex);
    }
  });
  
  const media = await mongoose.connection.db.collection('media')
    .find({}, {projection: {filename: 1, url: 1}}).toArray();
  
  console.log('\nMedia URLs:');
  media.forEach(m => {
    console.log('Filename:', m.filename);
    console.log('  URL:', JSON.stringify(m.url));
    const hex = Buffer.from(m.url).toString('hex');
    console.log('  Hex:', hex);
  });
  
  process.exit(0);
})();
