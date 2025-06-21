import User from '../models/User.js';

export const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin' });
    
    if (!existingAdmin) {
      // Create admin user
      const adminUser = new User({
        name: 'Administrator',
        email: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully');
      console.log('📧 Email: admin');
      console.log('🔑 Password: admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};