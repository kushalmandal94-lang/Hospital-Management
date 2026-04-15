require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const mapFilePath = path.resolve(__dirname, '../../../frontend/public/doctor-photos/doctor-photo-map.json');
const photosDirPath = path.resolve(__dirname, '../../../frontend/public/doctor-photos');

const loadMapFile = () => {
  if (!fs.existsSync(mapFilePath)) {
    throw new Error(`Map file not found at ${mapFilePath}`);
  }

  const data = JSON.parse(fs.readFileSync(mapFilePath, 'utf-8'));
  if (!Array.isArray(data.mappings)) {
    throw new TypeError('Invalid map file: mappings must be an array');
  }

  return data.mappings;
};

const validateMappings = (mappings) => {
  const emailSet = new Set();
  const fileSet = new Set();

  for (const item of mappings) {
    if (!item.email || !item.file) {
      throw new Error('Each mapping must include email and file');
    }

    if (emailSet.has(item.email)) {
      throw new Error(`Duplicate email mapping: ${item.email}`);
    }

    if (fileSet.has(item.file)) {
      throw new Error(`Duplicate file mapping (photo reuse not allowed): ${item.file}`);
    }

    emailSet.add(item.email);
    fileSet.add(item.file);

    const photoPath = path.join(photosDirPath, item.file);
    if (!fs.existsSync(photoPath)) {
      throw new Error(`Photo file not found: ${item.file}`);
    }
  }
};

const applyDoctorPhotos = async () => {
  await connectDB();

  const mappings = loadMapFile();
  validateMappings(mappings);

  let updated = 0;
  let skipped = 0;

  for (const mapping of mappings) {
    const doctorUser = await User.findOne({ email: mapping.email, role: 'doctor' });
    if (!doctorUser) {
      skipped += 1;
      console.warn(`Skipped doctor not found: ${mapping.email}`);
      continue;
    }

    doctorUser.profilePicture = `/doctor-photos/${mapping.file}`;
    await doctorUser.save();
    updated += 1;
  }

  console.log(`Doctor photos applied: updated=${updated}, skipped=${skipped}`);
};

const main = async () => {
  try {
    await applyDoctorPhotos();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to apply doctor photos:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

main();
