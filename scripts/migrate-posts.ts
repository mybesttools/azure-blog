import payload from 'payload';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import dotenv from 'dotenv';

dotenv.config();

const postsDir = path.join(process.cwd(), '_posts');

async function migrate() {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'your-secret-key-here',
    local: true,
  });

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
      const existing = await payload.find({
        collection: 'posts',
        where: {
          slug: {
            equals: slug,
          },
        },
      });

      if (existing.docs.length > 0) {
        console.log(`  Post ${slug} already exists, skipping...`);
        continue;
      }

      // Convert markdown content to rich text format for Slate
      const richTextContent = [
        {
          type: 'paragraph',
          children: [
            {
              text: content,
            },
          ],
        },
      ];

      // Create the post
      await payload.create({
        collection: 'posts',
        data: {
          title: data.title,
          excerpt: data.excerpt || '',
          content: richTextContent,
          date: data.date,
          author: {
            name: data.author?.name || 'Unknown',
          },
          slug: slug,
          status: 'published',
        },
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
