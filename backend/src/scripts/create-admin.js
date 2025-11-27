/**
 * Script pour créer un utilisateur administrateur
 * Usage: node src/scripts/create-admin.js [email] [password] [firstName] [lastName]
 * 
 * Exemple:
 *   node src/scripts/create-admin.js admin@mondomaine.com monMotDePasse Admin Cabinet
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User schema
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

const User = mongoose.model('User', userSchema);

// Get arguments
const args = process.argv.slice(2);
const email = args[0] || 'admin@cabinet.com';
const password = args[1] || 'admin123';
const firstName = args[2] || 'Admin';
const lastName = args[3] || 'Cabinet';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://root:password@localhost:27017/cabinetdb?authSource=admin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Create admin user
const createAdmin = async () => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`⚠️  User with email "${email}" already exists!`);
      
      if (existingUser.role === 'ADMIN') {
        console.log('   This user is already an ADMIN.');
      } else {
        console.log(`   Current role: ${existingUser.role}`);
        console.log('   To upgrade to ADMIN, delete the user first or use MongoDB directly.');
      }
      process.exit(1);
    }

    // Create admin user
    const adminUser = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'ADMIN',
      specialization: 'Administration'
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!\n');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│              ADMIN USER CREDENTIALS                     │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│  Email:     ${email.padEnd(43)}│`);
    console.log(`│  Password:  ${password.padEnd(43)}│`);
    console.log(`│  Name:      ${(firstName + ' ' + lastName).padEnd(43)}│`);
    console.log(`│  Role:      ADMIN${' '.repeat(38)}│`);
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

// Main
const main = async () => {
  console.log('\n🚀 Creating Admin User...\n');
  await connectDB();
  await createAdmin();
  process.exit(0);
};

main();
