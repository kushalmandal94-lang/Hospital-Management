require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

const reviewTemplates = [
  'Excellent consultation and clear explanation of treatment.',
  'Very professional and patient-friendly doctor.',
  'Helpful advice and smooth appointment experience.',
  'Great diagnosis and attentive care throughout.',
  'Highly recommended for quality care and communication.',
];

const ratingsForTarget = (targetRating) => (targetRating === 5 ? [5, 5] : [5, 4]);

const toDateInPast = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  date.setHours(10, 0, 0, 0);
  return date;
};

const applyRatingsForDoctor = async (doctor, patients, index) => {
  const targetRating = index % 2 === 0 ? 5 : 4.5;
  const desiredRatings = ratingsForTarget(targetRating);

  let completed = await Appointment.find({ doctorId: doctor._id, status: 'completed' })
    .sort('-appointmentDate');

  for (let i = completed.length; i < desiredRatings.length; i += 1) {
    const patient = patients[(index + i) % patients.length];
    const appointmentDate = toDateInPast(15 + index + i);

    await Appointment.create({
      patientId: patient._id,
      userId: patient.userId,
      doctorId: doctor._id,
      appointmentDate,
      date: appointmentDate,
      startTime: '10:00',
      endTime: '10:30',
      consultationType: 'in-person',
      status: 'completed',
      priority: 'routine',
      reason: 'Routine follow-up',
      rating: desiredRatings[i],
      review: reviewTemplates[(index + i) % reviewTemplates.length],
      reviewSubmittedAt: new Date(),
    });
  }

  completed = await Appointment.find({ doctorId: doctor._id, status: 'completed' })
    .sort('-appointmentDate')
    .limit(desiredRatings.length);

  for (let i = 0; i < completed.length && i < desiredRatings.length; i += 1) {
    completed[i].rating = desiredRatings[i];
    completed[i].review = reviewTemplates[(index + i) % reviewTemplates.length];
    completed[i].reviewSubmittedAt = new Date();
    await completed[i].save();
  }

  const [aggregate] = await Appointment.aggregate([
    {
      $match: {
        doctorId: doctor._id,
        rating: { $ne: null },
      },
    },
    {
      $group: {
        _id: '$doctorId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const avgRating = aggregate ? Math.round(aggregate.avgRating * 10) / 10 : targetRating;
  const totalReviews = aggregate ? aggregate.totalReviews : desiredRatings.length;

  doctor.rating = avgRating;
  doctor.totalReviews = totalReviews;
  await doctor.save();
};

const seedDoctorRatings = async () => {
  await connectDB();

  const doctors = await Doctor.find({ isActive: true }).sort('createdAt');
  const patients = await Patient.find({}).select('_id userId').limit(200);

  if (doctors.length === 0) {
    throw new Error('No doctors found');
  }

  if (patients.length === 0) {
    throw new Error('No patients found. Create at least one patient before seeding doctor reviews.');
  }

  for (let i = 0; i < doctors.length; i += 1) {
    await applyRatingsForDoctor(doctors[i], patients, i);
  }

  console.log(`Doctor rating seed complete: updated=${doctors.length}`);
};

const main = async () => {
  try {
    await seedDoctorRatings();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Doctor rating seed failed:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

main();
