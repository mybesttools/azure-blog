import { connectDB } from './src/lib/mongodb.ts';
import Media from './src/models/Media.ts';

await connectDB();
const media = await Media.find({}, 'url filename').lean();
console.log('\nMedia in database:');
media.forEach(m => {
  const urlBytes = Buffer.from(m.url);
  console.log('URL:', JSON.stringify(m.url), '| Filename:', m.filename);
  console.log('  Hex:', urlBytes.toString('hex').substring(0, 60));
});
process.exit(0);
