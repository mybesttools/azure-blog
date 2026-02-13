import { connectDB } from '../src/lib/mongodb';
import Post from '../src/models/Post';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import dotenv from 'dotenv';

dotenv.config();

const postsDir = path.join(process.cwd(), '_posts');

async function migrate() {
  // Connect to MongoDB
  await connectDB();

  console.log('Starting migration...');

  // Get all markdown files
  const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(postsDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    const slug = file.replace(/\.md$/, '');

    console.log(`Migrating: ${slug}`);

    try {
      // Check if post already exists
      const existing = await Post.findOne({ slug });

      if (existing) {
        console.log(`  Post ${slug} already exists, skipping...`);
        continue;
      }

      // Convert markdown content to rich text format for Lexical
      const richTextContent = {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: content,
                },
              ],
            },
          ],
        },
      };

      // Create the post
      await Post.create({
        title: data.title,
        excerpt: data.excerpt || '',
        content: richTextContent,
        date: data.date,
        author: {
          name: data.author?.name || 'Unknown',
          picture: data.author?.picture || '',
        },
        slug: slug,
        status: 'published',
        coverImage: data.coverImage || '',
      });

      console.log(`  ✓ Migrated ${slug}`);
    } catch (error) {
      console.error(`  ✗ Error migrating ${slug}:`, error);
    }
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(console.error);
