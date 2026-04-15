const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

const formatDateTime = (appointmentDate, startTime) => {
  const dateText = new Date(appointmentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `${dateText} at ${startTime}`;
};

const toAppointmentDateTime = (appointment) => {
  const date = new Date(appointment.appointmentDate || appointment.date);
  const [hours, minutes] = String(appointment.startTime || '00:00').split(':').map(Number);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
};

const getEmailTransporter = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS)) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 465,
      secure: Number(process.env.EMAIL_PORT || 465) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
      },
    });
  }

  if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return null;
};

const sendEmailReminder = async (email, subject, text) => {
  if (!email) return false;

  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log(`[Reminder][EMAIL skipped] Missing email configuration for ${email}`);
    return false;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text,
  });

  return true;
};

const sendSmsReminder = async (phone, message) => {
  if (!phone) return false;

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    // Keep a functional fallback when SMS provider is not configured.
    console.log(`[Reminder][SMS simulated] ${phone}: ${message}`);
    return false;
  }

  console.log(`[Reminder][SMS provider configured] ${phone}: ${message}`);
  return true;
};

const buildReminderMessage = (appointment, doctorName) => {
  return `Reminder: your appointment with Dr. ${doctorName} is scheduled for ${formatDateTime(
    appointment.appointmentDate || appointment.date,
    appointment.startTime
  )}.`;
};

const getReminderChannels = (appointment) => ({
  email: appointment.reminderChannels?.email !== false,
  sms: appointment.reminderChannels?.sms !== false,
  inApp: appointment.reminderChannels?.inApp !== false,
});

const sendChannelReminders = async (channels, patientUser, doctorUser, reminderTitle, reminderMessage) => {
  if (channels.email) {
    await Promise.all([
      sendEmailReminder(patientUser?.email, reminderTitle, reminderMessage),
      sendEmailReminder(doctorUser?.email, reminderTitle, reminderMessage),
    ]);
  }

  if (channels.sms) {
    await Promise.all([
      sendSmsReminder(patientUser?.phone, reminderMessage),
      sendSmsReminder(doctorUser?.phone, reminderMessage),
    ]);
  }
};

const buildInAppNotifications = (appointment, channels, reminderTitle, reminderMessage, patientUser, doctorUser) => {
  if (!channels.inApp) return [];

  const docs = [];

  if (patientUser?._id) {
    docs.push({
      userId: patientUser._id,
      appointmentId: appointment._id,
      type: 'appointment-reminder',
      title: reminderTitle,
      message: reminderMessage,
      channels,
      metadata: {
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        doctorId: appointment.doctorId?._id,
      },
    });
  }

  if (doctorUser?._id) {
    docs.push({
      userId: doctorUser._id,
      appointmentId: appointment._id,
      type: 'appointment-reminder',
      title: reminderTitle,
      message: reminderMessage,
      channels,
      metadata: {
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        patientId: appointment.patientId,
      },
    });
  }

  return docs;
};

const isReminderDue = (appointment, now) => {
  const reminderLeadMinutes = appointment.reminderLeadMinutes || 60;
  const appointmentDateTime = toAppointmentDateTime(appointment);
  const reminderAt = new Date(appointmentDateTime.getTime() - reminderLeadMinutes * 60000);

  return now >= reminderAt && now <= appointmentDateTime;
};

const processAppointmentReminder = async (appointment) => {
  const patientUser = appointment.userId;
  const doctorUser = appointment.doctorId?.userId;
  const doctorName = doctorUser?.name || `${doctorUser?.firstName || ''} ${doctorUser?.lastName || ''}`.trim() || 'Doctor';
  const reminderMessage = buildReminderMessage(appointment, doctorName);
  const reminderTitle = 'Upcoming Appointment Reminder';
  const channels = getReminderChannels(appointment);

  await sendChannelReminders(channels, patientUser, doctorUser, reminderTitle, reminderMessage);

  const inAppDocs = buildInAppNotifications(appointment, channels, reminderTitle, reminderMessage, patientUser, doctorUser);
  if (inAppDocs.length > 0) {
    await Notification.insertMany(inAppDocs);
  }

  appointment.reminderSent = true;
  appointment.reminderSentAt = new Date();
  await appointment.save();
};

const processUpcomingReminders = async () => {
  const now = new Date();

  const appointments = await Appointment.find({
    status: { $in: ['pending', 'confirmed', 'scheduled'] },
    reminderSent: false,
  })
    .populate('userId', 'email phone firstName lastName name')
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'email phone firstName lastName name' },
    })
    .limit(200);

  for (const appointment of appointments) {
    if (!isReminderDue(appointment, now)) continue;
    await processAppointmentReminder(appointment);
  }
};

exports.startAppointmentReminderScheduler = () => {
  cron.schedule('* * * * *', async () => {
    try {
      await processUpcomingReminders();
    } catch (error) {
      console.error('Appointment reminder scheduler error:', error.message);
    }
  });

  console.log('✓ Appointment reminder scheduler started (runs every minute)');
};
