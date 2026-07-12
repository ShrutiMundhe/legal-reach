import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.js';
import bcryptjs from 'bcryptjs';

dotenv.config();

const seedLawyers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing lawyers (optional - comment out to keep existing data)
    // await User.deleteMany({ role: 'lawyer' });

    const testLawyers = [
      {
        name: 'John Smith',
        email: 'john@lawyer.com',
        password: await bcryptjs.hash('password123', 10),
        role: 'lawyer',
        specialization: 'Criminal Law',
        isVerified: true,
        city: 'New York',
        experience: '10 years',
        bio: 'Experienced criminal defense attorney'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@lawyer.com',
        password: await bcryptjs.hash('password123', 10),
        role: 'lawyer',
        specialization: 'Family Law',
        isVerified: true,
        city: 'Los Angeles',
        experience: '8 years',
        bio: 'Specializing in family disputes and divorce cases'
      },
      {
        name: 'Mike Davis',
        email: 'mike@lawyer.com',
        password: await bcryptjs.hash('password123', 10),
        role: 'lawyer',
        specialization: 'Corporate Law',
        isVerified: true,
        city: 'Chicago',
        experience: '12 years',
        bio: 'Corporate and business law expert'
      },
      {
        name: 'Emily Brown',
        email: 'emily@lawyer.com',
        password: await bcryptjs.hash('password123', 10),
        role: 'lawyer',
        specialization: 'Tax Law',
        isVerified: true,
        city: 'Houston',
        experience: '15 years',
        bio: 'Tax law and financial planning specialist'
      }
    ];

    const result = await User.insertMany(testLawyers);
    console.log(`✅ Seeded ${result.length} test lawyers successfully!`);
    console.log('\nTest Lawyer Credentials:');
    testLawyers.forEach(lawyer => {
      console.log(`- Email: ${lawyer.email} | Password: password123 | Specialization: ${lawyer.specialization}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedLawyers();
