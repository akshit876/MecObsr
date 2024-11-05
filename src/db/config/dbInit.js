import User from '../models/User';
import bcrypt from 'bcryptjs';

export async function initializeDB() {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ email: 'super' });

    if (!adminExists) {
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin', 10);

      // Create admin user
      const adminUser = new User({
        name: 'Super Admin',
        email: 'super',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await adminUser.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
} 