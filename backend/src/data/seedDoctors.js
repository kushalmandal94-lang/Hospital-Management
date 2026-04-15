require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const seedPassword = process.env.SEED_DOCTOR_PASSWORD || `Doctor@${new Date().getFullYear()}`;

const SPECIALIZATIONS = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Dermatology',
  'ENT',
  'General Surgery',
  'Pediatrics',
  'Gynecology',
  'Psychiatry',
  'Oncology',
  'Radiology',
  'Pathology',
  'General Physician',
];

const departmentsBySpecialization = {
  Cardiology: 'Cardiology',
  Neurology: 'Neurology',
  Orthopedics: 'Orthopedics',
  Dermatology: 'Dermatology',
  ENT: 'Otolaryngology',
  'General Surgery': 'Surgery',
  Pediatrics: 'Pediatrics',
  Gynecology: 'Obstetrics and Gynecology',
  Psychiatry: 'Mental Health',
  Oncology: 'Oncology',
  Radiology: 'Radiology',
  Pathology: 'Pathology',
  'General Physician': 'General Medicine',
};

const maleFirstNames = [
  'Aarav', 'Vihaan', 'Ishaan', 'Kabir', 'Reyansh', 'Arjun', 'Rohan', 'Varun', 'Dev', 'Nikhil',
  'Aditya', 'Kunal', 'Rahul', 'Amit', 'Neel', 'Yash', 'Manav', 'Parth', 'Sahil', 'Om',
];

const femaleFirstNames = [
  'Aanya', 'Diya', 'Anika', 'Myra', 'Sara', 'Kiara', 'Nisha', 'Meera', 'Pooja', 'Riya',
  'Sneha', 'Priya', 'Simran', 'Shreya', 'Tanvi', 'Ira', 'Kriti', 'Jiya', 'Radhika', 'Aditi',
];

const lastNames = [
  'Sharma', 'Patel', 'Singh', 'Gupta', 'Khan', 'Joshi', 'Mehta', 'Iyer', 'Nair', 'Reddy',
  'Verma', 'Malhotra', 'Bose', 'Kapoor', 'Mishra', 'Chopra', 'Saxena', 'Tiwari', 'Bhat', 'Chawla',
];

const getUniqueDoctorPhoto = (index) => {
  // This provider supports many unique portrait IDs, so no doctor photo repeats.
  const imageId = (index % 70) + 1;
  return `https://i.pravatar.cc/600?img=${imageId}`;
};

const buildDoctorRecord = (index) => {
  const gender = index % 2 === 0 ? 'female' : 'male';
  const firstName = gender === 'female'
    ? femaleFirstNames[index % femaleFirstNames.length]
    : maleFirstNames[index % maleFirstNames.length];
  const profilePicture = getUniqueDoctorPhoto(index);

  const lastName = lastNames[index % lastNames.length];
  const specialization = SPECIALIZATIONS[index % SPECIALIZATIONS.length];
  const email = `doctor${String(index + 1).padStart(2, '0')}@kushalhospitals.com`;

  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    email,
    phone: `90000${String(1000 + index)}`,
    password: seedPassword,
    role: 'doctor',
    profilePicture,
    licenseNumber: `KH-DOC-${String(1001 + index)}`,
    specialization,
    experience: 4 + (index % 16),
    qualification: ['MBBS', 'MD'],
    bio: `${firstName} ${lastName} is a ${specialization} specialist at Kushal Hospitals.`,
    consultationFee: 500 + (index % 10) * 100,
    department: departmentsBySpecialization[specialization],
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    availableSlots: {
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
    },
  };
};

const seedDoctors = async () => {
  await connectDB();

  const totalDoctors = 35;
  let createdUsers = 0;
  let createdDoctors = 0;
  let updatedDoctors = 0;

  for (let i = 0; i < totalDoctors; i += 1) {
    const record = buildDoctorRecord(i);

    let user = await User.findOne({ email: record.email });
    if (user) {
      user.firstName = record.firstName;
      user.lastName = record.lastName;
      user.name = record.name;
      user.profilePicture = record.profilePicture;
      user.role = 'doctor';
      await user.save();
    } else {
      user = await User.create({
        firstName: record.firstName,
        lastName: record.lastName,
        name: record.name,
        email: record.email,
        phone: record.phone,
        password: record.password,
        role: record.role,
        profilePicture: record.profilePicture,
      });
      createdUsers += 1;
    }

    const existingDoctor = await Doctor.findOne({ userId: user._id });
    if (existingDoctor) {
      existingDoctor.licenseNumber = record.licenseNumber;
      existingDoctor.specialization = record.specialization;
      existingDoctor.experience = record.experience;
      existingDoctor.qualification = record.qualification;
      existingDoctor.bio = record.bio;
      existingDoctor.consultationFee = record.consultationFee;
      existingDoctor.department = record.department;
      existingDoctor.availableDays = record.availableDays;
      existingDoctor.availableSlots = record.availableSlots;
      existingDoctor.isActive = true;
      await existingDoctor.save();
      updatedDoctors += 1;
    } else {
      await Doctor.create({
        userId: user._id,
        licenseNumber: record.licenseNumber,
        specialization: record.specialization,
        experience: record.experience,
        qualification: record.qualification,
        bio: record.bio,
        consultationFee: record.consultationFee,
        department: record.department,
        availableDays: record.availableDays,
        availableSlots: record.availableSlots,
        isActive: true,
      });
      createdDoctors += 1;
    }
  }

  console.log(`Seed complete: users created=${createdUsers}, doctors created=${createdDoctors}, doctors updated=${updatedDoctors}`);
};

const main = async () => {
  try {
    await seedDoctors();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Doctor seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

main();
