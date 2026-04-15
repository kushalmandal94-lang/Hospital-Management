const mongoose = require('mongoose');
require('dotenv').config();

const uri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/kushal_hospitals';

console.log('Testing MongoDB connection...');
console.log('Attempting to connect...');

const run = async () => {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    console.log('✓ MongoDB connected successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.log('✗ Connection Error:', err.message);
    if (err.message.includes('authentication failed')) {
      console.log('\nTroubleshooting:');
      console.log('1. Check MongoDB Atlas Network Access (whitelist your IP)');
      console.log('2. Verify DB user exists in Database Access');
      console.log('3. Ensure MONGO_URI/MONGODB_URI has correct credentials');
      console.log('4. Check if database kushal_hospitals exists');
    }
    process.exit(1);
  }
};

run();
