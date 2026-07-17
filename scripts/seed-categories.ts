import { connectDB } from '../src/lib/mongodb';
import Category from '../src/models/Category';

async function seedCategories() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if categories already exist
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      console.log(`Categories already exist (${existingCount} found). Skipping seed.`);
      process.exit(0);
    }

    // Create initial categories
    const categories = [
      {
        name: 'About Azure, Intune, AI',
        slug: 'about-azure-intune-ai',
        description: 'Articles and insights about Microsoft Azure, Intune, and AI technologies',
        order: 1,
        isDefault: true,
      },
      {
        name: 'My Hobby Projects',
        slug: 'my-hobby-projects',
        description: 'Personal projects and experiments',
        order: 2,
        isDefault: false,
      },
    ];

    const created = await Category.insertMany(categories);
    console.log(`✅ Successfully created ${created.length} categories:`);
    created.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug})${cat.isDefault ? ' [DEFAULT]' : ''}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
