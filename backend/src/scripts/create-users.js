const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User schema directly in the script
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['ADMIN', 'DOCTOR', 'SECRETARY'],
    required: true
  },
  phoneNumber: { type: String },
  specialization: { type: String },
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use the same connection string as the application
    await mongoose.connect('mongodb://root:password@localhost:27017/cabinetdb?authSource=admin');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Create test users
const createUsers = async () => {
  try {
    // Clear existing users (optional)
    await User.deleteMany({});
    console.log('🗑️ Cleared existing users');

    // Test users data (passwords will be hashed by the pre-save middleware)
    const users = [
      {
        firstName: 'Admin',
        lastName: 'Cabinet',
        email: 'admin@cabinet.com',
        password: 'admin123',
        role: 'ADMIN',
        phoneNumber: '+33123456789',
        specialization: 'Administration'
      },
      {
        firstName: 'Dr. Marie',
        lastName: 'Dubois',
        email: 'marie.dubois@cabinet.com',
        password: 'doctor123',
        role: 'DOCTOR',
        phoneNumber: '+33123456788',
        specialization: 'Médecine générale'
      },
      {
        firstName: 'Sophie',
        lastName: 'Martin',
        email: 'sophie.martin@cabinet.com',
        password: 'secretary123',
        role: 'SECRETARY',
        phoneNumber: '+33123456787'
      }
    ];

    // Create users one by one to ensure password hashing
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
    }
    
    console.log(`✅ Created ${createdUsers.length} test users:`);
    
    createdUsers.forEach(user => {
      console.log(`   📧 ${user.email} (${user.role}) - Password: ${getOriginalPassword(user.email)}`);
    });

  } catch (error) {
    console.error('❌ Error creating users:', error);
  }
};

// Helper function to show original passwords
const getOriginalPassword = (email) => {
  const passwords = {
    'admin@cabinet.com': 'admin123',
    'marie.dubois@cabinet.com': 'doctor123',
    'sophie.martin@cabinet.com': 'secretary123'
  };
  return passwords[email] || 'unknown';
};

// Main function
const main = async () => {
  console.log('🚀 Starting user creation script...');
  await connectDB();
  await createUsers();
  
  console.log('\n📋 Test Users Summary:');
  console.log('┌─────────────────────────────────────┬──────────────┬──────────────┐');
  console.log('│ Email                               │ Role         │ Password     │');
  console.log('├─────────────────────────────────────┼──────────────┼──────────────┤');
  console.log('│ admin@cabinet.com                   │ ADMIN        │ admin123     │');
  console.log('│ marie.dubois@cabinet.com            │ DOCTOR       │ doctor123    │');
  console.log('│ sophie.martin@cabinet.com           │ SECRETARY    │ secretary123 │');
  console.log('└─────────────────────────────────────┴──────────────┴──────────────┘');
  
  console.log('\n✅ User creation completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the script
main();