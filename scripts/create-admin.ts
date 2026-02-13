import { connectDB } from '../src/lib/mongodb';
import User from '../src/models/User';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createAdmin() {
  const email = process.argv[2] || 'admin@example.com';
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || 'Admin User';

  console.log('Creating first admin user...\n');
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}\n`);

  console.log('Connecting to MongoDB...');
  
  await connectDB();

  console.log('Creating user...');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.create({
      email,
      password: hashedPassword,
      name,
    });

    console.log(`\n✓ Admin user created successfully!`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`\nYou can now log in at http://localhost:3000/admin/login`);
  } catch (error: any) {
    if (error.message?.includes('duplicate key') || error.code === 11000) {
      console.log('\n✓ Admin user already exists!');
      console.log(`  Email: ${email}`);
    } else {
      console.error('\n✗ Error creating user:', error.message || error);
    }
  }

  process.exit(0);
}

createAdmin().catch(console.error);
