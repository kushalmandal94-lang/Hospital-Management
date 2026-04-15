import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BellRing, CalendarDays, Clock3, Mail, MessageSquare, ShieldCheck, Star, Stethoscope, Video } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { appointmentAPI, doctorAPI, notificationAPI, patientAPI, type Doctor, type NotificationItem } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Slot {
  startTime: string;
  endTime: string;
}

interface Appointment {
  _id: string;
  appointmentDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  status: string;
  consultationType?: 'in-person' | 'telemedicine';
  rating?: number | null;
  review?: string;
  videoSession?: {
    joinUrl?: string;
    provider?: string;
  };
  doctorId?: {
    _id?: string;
    specialization?: string;
    userId?: {
      name?: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

interface ReviewDraft {
  rating: number;
  review: string;
}

type PaymentMethodOption = 'Online Payment' | 'Cash on Visit' | '';

interface PaymentAssistantState {
  patientName: string;
  doctorName: string;
  dateTime: string;
  selectedOption: PaymentMethodOption;
  paymentStatus: 'Pending' | 'Completed';
  finalMessage: string;
}

interface PaymentAssistantPanelProps {
  paymentAssistant: PaymentAssistantState;
  paymentQrData: string;
  onSelectMethod: (method: Exclude<PaymentMethodOption, ''>) => void;
  onCompleteOnlinePayment: () => void;
}

const FALLBACK_SLOTS: Slot[] = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
  { startTime: '13:00', endTime: '14:00' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:00', endTime: '16:00' },
  { startTime: '16:00', endTime: '17:00' },
  { startTime: '17:00', endTime: '18:00' },
  { startTime: '18:00', endTime: '19:00' },
  { startTime: '19:00', endTime: '20:00' },
  { startTime: '20:00', endTime: '21:00' },
];

const getStatusBadgeClass = (status?: string) => {
  if (!status) return 'bg-slate-100 text-slate-700';
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'cancelled') return 'bg-rose-100 text-rose-700';
  if (status === 'confirmed' || status === 'scheduled') return 'bg-sky-100 text-sky-700';
  return 'bg-amber-100 text-amber-700';
};

function PaymentAssistantPanel({
  paymentAssistant,
  paymentQrData,
  onSelectMethod,
  onCompleteOnlinePayment,
}: Readonly<PaymentAssistantPanelProps>) {
  return (
    <section className="relative z-10 mb-6 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-800">Payment Assistant</h2>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-800">Appointment Details:</p>
        <p className="mt-2">- Name: {paymentAssistant.patientName}</p>
        <p>- Doctor: {paymentAssistant.doctorName}</p>
        <p>- Date &amp; Time: {paymentAssistant.dateTime}</p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-800">Payment Method:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectMethod('Online Payment')}
            className={`rounded-lg px-3 py-2 font-medium transition ${paymentAssistant.selectedOption === 'Online Payment' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'}`}
          >
            Online Payment
          </button>
          <button
            type="button"
            onClick={() => onSelectMethod('Cash on Visit')}
            className={`rounded-lg px-3 py-2 font-medium transition ${paymentAssistant.selectedOption === 'Cash on Visit' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'}`}
          >
            Cash on Visit
          </button>
        </div>
        <p className="mt-3">- Selected Option: {paymentAssistant.selectedOption || 'Not selected yet'}</p>
      </div>

      {paymentAssistant.selectedOption === 'Online Payment' ? (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
          <p>Please scan the QR code to complete your payment.</p>
          <div className="mt-3 inline-flex rounded-lg border border-indigo-200 bg-white p-3">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(paymentQrData)}`}
              alt="Online payment QR code"
              className="h-44 w-44"
            />
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={onCompleteOnlinePayment}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              I have completed payment
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-800">Payment Status:</p>
        <p className="mt-2">- {paymentAssistant.paymentStatus}</p>
      </div>

      <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
        <p className="font-semibold">Final Message:</p>
        <p className="mt-2">{paymentAssistant.finalMessage}</p>
      </div>
    </section>
  );
}

export default function AppointmentsPage() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const todayDate = new Date().toISOString().slice(0, 10);

  const [patientId, setPatientId] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotLoadFailed, setSlotLoadFailed] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [paymentAssistant, setPaymentAssistant] = useState<PaymentAssistantState | null>(null);

  const [form, setForm] = useState({
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    reason: '',
    consultationType: 'in-person' as 'in-person' | 'telemedicine',
    reminderLeadMinutes: 60,
    reminderChannels: {
      email: true,
      sms: true,
      inApp: true,
    },
  });

  useEffect(() => {
    const queryDoctorId = new URLSearchParams(location.search).get('doctorId') || '';
    if (queryDoctorId) {
      setForm((prev) => ({ ...prev, doctorId: queryDoctorId }));
    }
  }, [location.search]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const res = await notificationAPI.getAll(10);
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {
      // Non-blocking: appointments page should still work if notifications fail.
    }
  }, [user]);

  const fetchAppointments = useCallback(async (roleData?: { patientId?: string; doctorId?: string }) => {
    if (!user) return;

    if (user.role === 'patient' && roleData?.patientId) {
      const res = await appointmentAPI.getAll({ patientId: roleData.patientId });
      setAppointments(res.data?.appointments || []);
      return;
    }

    if (user.role === 'doctor' && roleData?.doctorId) {
      const res = await appointmentAPI.getAll({ doctorId: roleData.doctorId });
      setAppointments(res.data?.appointments || []);
      return;
    }

    const res = await appointmentAPI.getAll();
    setAppointments(res.data?.appointments || []);
  }, [user]);

  useEffect(() => {
    const loadPage = async () => {
      if (!user) return;

      try {
        const doctorsRes = await doctorAPI.getAll(1, '', 40);
        setDoctors(doctorsRes.data?.doctors || []);

        if (user.role === 'patient') {
          const patientRes = await patientAPI.getByUserId(user.id);
          const currentPatientId = patientRes.data?.patient?._id || '';
          setPatientId(currentPatientId);
          await fetchAppointments({ patientId: currentPatientId });
        } else if (user.role === 'doctor') {
          const doctorRes = await doctorAPI.getByUserId(user.id);
          const currentDoctorId = doctorRes.data?.doctor?._id || '';
          await fetchAppointments({ doctorId: currentDoctorId });
        } else {
          await fetchAppointments();
        }

        await fetchNotifications();
      } catch {
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [fetchAppointments, fetchNotifications, user]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, startTime: '', endTime: '' }));

    const loadSlots = async () => {
      if (!form.doctorId || !form.appointmentDate) {
        setSlots([]);
        setSlotLoadFailed(false);
        return;
      }

      try {
        const res = await appointmentAPI.getDoctorAvailability(form.doctorId, form.appointmentDate);
        setSlots(res.data?.availableSlots || []);
        setSlotLoadFailed(false);
      } catch {
        setSlots([]);
        setSlotLoadFailed(true);
      }
    };

    loadSlots();
  }, [form.doctorId, form.appointmentDate]);

  const selectedDoctorName = useMemo(() => {
    const selected = doctors.find((d) => d._id === form.doctorId);
    return selected?.userId?.name || `${selected?.userId?.firstName || ''} ${selected?.userId?.lastName || ''}`.trim();
  }, [doctors, form.doctorId]);

  const isDoctorAvailableOnSelectedDate = useMemo(() => {
    if (!form.doctorId || !form.appointmentDate) return true;

    const selectedDoctor = doctors.find((d) => d._id === form.doctorId);
    const availableDays = selectedDoctor?.availableDays || [];
    if (availableDays.length === 0) return true;

    const selectedDay = new Date(form.appointmentDate).toLocaleDateString('en-US', { weekday: 'long' });
    return availableDays.includes(selectedDay);
  }, [doctors, form.appointmentDate, form.doctorId]);

  const visibleSlots = useMemo(() => {
    if (slots.length > 0) {
      return slots;
    }

    return FALLBACK_SLOTS;
  }, [slots]);

  const initializeReviewDraft = (appointmentId: string, existingRating?: number | null, existingReview?: string) => {
    setReviewDrafts((prev) => {
      if (prev[appointmentId]) return prev;

      return {
        ...prev,
        [appointmentId]: {
          rating: existingRating && existingRating > 0 ? existingRating : 5,
          review: existingReview || '',
        },
      };
    });
  };

  const updateReviewDraft = (appointmentId: string, patch: Partial<ReviewDraft>) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [appointmentId]: {
        rating: prev[appointmentId]?.rating || 5,
        review: prev[appointmentId]?.review || '',
        ...patch,
      },
    }));
  };

  const handleSubmitReview = async (appointmentId: string) => {
    const draft = reviewDrafts[appointmentId];
    if (!draft) {
      toast.error('Please select a rating');
      return;
    }

    try {
      await appointmentAPI.submitReview(appointmentId, {
        rating: draft.rating,
        review: draft.review,
      });

      toast.success('Review submitted successfully');

      if (user?.role === 'patient' && patientId) {
        await fetchAppointments({ patientId });
      } else {
        await fetchAppointments();
      }
    } catch {
      toast.error('Failed to submit review');
    }
  };

  const handleJoinVideo = async (appointment: Appointment) => {
    try {
      const res = await appointmentAPI.createVideoSession(appointment._id, { provider: 'webrtc' });
      const joinUrl = res.data?.session?.joinUrl;

      if (!joinUrl) {
        toast.error('Video link unavailable');
        return;
      }

      globalThis.open(joinUrl, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Failed to create video session');
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markRead(notificationId);
      setNotifications((prev) => prev.map((item) => (item._id === notificationId ? { ...item, isRead: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      toast.error('Patient profile not found');
      return;
    }

    try {
      const doctorNameForBooking = selectedDoctorName || 'Doctor';
      const patientNameForBooking = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Patient';
      const dateTimeForBooking = `${form.appointmentDate} ${form.startTime} - ${form.endTime}`;

      await appointmentAPI.book({
        patientId,
        doctorId: form.doctorId,
        appointmentDate: form.appointmentDate,
        startTime: form.startTime,
        endTime: form.endTime,
        reason: form.reason,
        consultationType: form.consultationType,
        reminderLeadMinutes: form.reminderLeadMinutes,
        reminderChannels: form.reminderChannels,
        status: 'pending',
      });

      toast.success('Appointment booked');
      setPaymentAssistant({
        patientName: patientNameForBooking,
        doctorName: doctorNameForBooking,
        dateTime: dateTimeForBooking,
        selectedOption: '',
        paymentStatus: 'Pending',
        finalMessage: 'Please choose a payment method to confirm your appointment.',
      });
      setForm({
        doctorId: form.doctorId,
        appointmentDate: '',
        startTime: '',
        endTime: '',
        reason: '',
        consultationType: form.consultationType,
        reminderLeadMinutes: form.reminderLeadMinutes,
        reminderChannels: form.reminderChannels,
      });
      setSlots([]);
      await fetchAppointments({ patientId });
    } catch {
      toast.error('Booking failed');
    }
  };

  const handleSelectPaymentMethod = (method: Exclude<PaymentMethodOption, ''>) => {
    setPaymentAssistant((current) => {
      if (!current) return current;

      if (method === 'Cash on Visit') {
        return {
          ...current,
          selectedOption: method,
          paymentStatus: 'Pending',
          finalMessage: 'Your appointment is confirmed. Please pay at the hospital during your visit.',
        };
      }

      return {
        ...current,
        selectedOption: method,
        paymentStatus: 'Pending',
        finalMessage: 'Please scan the QR code to complete your payment.',
      };
    });
  };

  const handleCompleteOnlinePayment = () => {
    setPaymentAssistant((current) => {
      if (!current) return current;

      return {
        ...current,
        paymentStatus: 'Completed',
        finalMessage: 'Payment successful. Your appointment is confirmed.',
      };
    });
  };

  const paymentQrData = useMemo(() => {
    if (paymentAssistant?.selectedOption !== 'Online Payment') return '';

    return `Hospital Appointment Payment|Name:${paymentAssistant.patientName}|Doctor:${paymentAssistant.doctorName}|DateTime:${paymentAssistant.dateTime}`;
  }, [paymentAssistant]);

  return (
    <div className="flex h-screen bg-[#edf6ff]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 md:p-6">
          <div className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="pointer-events-none absolute top-44 -left-20 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />

          <section className="relative z-10 mb-6 rounded-2xl border border-cyan-100 bg-gradient-to-r from-[#0f6ba8] via-[#0a7ebd] to-[#14a3c7] p-6 text-white shadow-lg">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium tracking-wide">
                  <ShieldCheck size={14} /> Patient Care Scheduler
                </p>
                <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                <p className="mt-2 max-w-xl text-sm text-cyan-50">
                  Manage bookings, receive timely reminders, and join secure online consultations in one place.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                  <p className="text-cyan-100">Total Appointments</p>
                  <p className="text-lg font-semibold">{appointments.length}</p>
                </div>
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                  <p className="text-cyan-100">Unread Alerts</p>
                  <p className="text-lg font-semibold">{unreadCount}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="relative z-10 rounded-2xl border border-cyan-100 bg-white/90 shadow-sm p-6 mb-6 backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-slate-800 inline-flex items-center gap-2">
                <BellRing size={18} className="text-cyan-700" /> Notifications
              </h2>
              <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-sm font-medium">
                {unreadCount} unread
              </span>
            </div>

            {notifications.length === 0 ? <p className="text-slate-500">No notifications yet</p> : null}

            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div key={notification._id} className={`rounded-xl border p-3 ${notification.isRead ? 'border-slate-200 bg-white' : 'border-cyan-200 bg-cyan-50/80'}`}>
                    <p className="font-medium text-slate-800">{notification.title}</p>
                    <p className="text-sm text-slate-600">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                      {notification.isRead ? null : (
                        <button
                          type="button"
                          className="text-xs font-medium text-cyan-700 hover:text-cyan-900"
                          onClick={() => markNotificationAsRead(notification._id)}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {user?.role === 'patient' ? (
            <form onSubmit={handleBook} className="relative z-10 mb-6 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <Stethoscope size={18} className="text-cyan-700" />
                <h2 className="text-xl font-semibold text-slate-800">Book New Appointment</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="doctorId" className="mb-2 block text-sm font-medium text-slate-700">Doctor</label>
                <select
                  id="doctorId"
                  title="Doctor"
                  value={form.doctorId}
                  onChange={(e) => setForm((prev) => ({ ...prev, doctorId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  required
                >
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.userId?.name || `${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`.trim()} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="appointmentDate" className="mb-2 block text-sm font-medium text-slate-700">Date</label>
                <input
                  id="appointmentDate"
                  type="date"
                  title="Date"
                  value={form.appointmentDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, appointmentDate: e.target.value }))}
                  min={todayDate}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="startTime" className="mb-2 block text-sm font-medium text-slate-700">Available Slots</label>
                <select
                  id="startTime"
                  title="Available Slots"
                  value={form.startTime}
                  onChange={(e) => {
                    const slot = visibleSlots.find((s) => s.startTime === e.target.value);
                    setForm((prev) => ({ ...prev, startTime: e.target.value, endTime: slot?.endTime || '' }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  required
                >
                  <option value="">Select slot</option>
                  {visibleSlots.map((slot) => (
                    <option key={slot.startTime} value={slot.startTime}>
                      {slot.startTime} - {slot.endTime}
                    </option>
                  ))}
                </select>
                {slotLoadFailed || slots.length === 0 ? (
                  <p className="mt-2 text-xs text-amber-600 inline-flex items-center gap-1"><Clock3 size={12} /> Showing default hourly slots from 09:00 to 21:00 (12:00-13:00 is lunch break).</p>
                ) : null}
                {isDoctorAvailableOnSelectedDate ? null : (
                  <p className="mt-2 text-xs text-rose-600">Selected doctor is not available on this day. Please choose another date.</p>
                )}
              </div>

              <div>
                <label htmlFor="reason" className="mb-2 block text-sm font-medium text-slate-700">Reason</label>
                <input
                  id="reason"
                  type="text"
                  title="Reason"
                  value={form.reason}
                  onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  placeholder="Consultation reason"
                  required
                />
              </div>

              <div>
                <label htmlFor="consultationType" className="mb-2 block text-sm font-medium text-slate-700">Consultation Type</label>
                <select
                  id="consultationType"
                  value={form.consultationType}
                  onChange={(e) => setForm((prev) => ({ ...prev, consultationType: e.target.value as 'in-person' | 'telemedicine' }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="in-person">In-person</option>
                  <option value="telemedicine">Video consultation (WebRTC)</option>
                </select>
              </div>

              <div>
                <label htmlFor="reminderLeadMinutes" className="mb-2 block text-sm font-medium text-slate-700">Reminder Before Appointment</label>
                <select
                  id="reminderLeadMinutes"
                  value={form.reminderLeadMinutes}
                  onChange={(e) => setForm((prev) => ({ ...prev, reminderLeadMinutes: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={1440}>1 day</option>
                </select>
              </div>

              <div className="md:col-span-2 rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                <p className="mb-3 block text-sm font-medium text-slate-700 inline-flex items-center gap-2"><BellRing size={14} /> Reminder Channels</p>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.reminderChannels.email}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        reminderChannels: { ...prev.reminderChannels, email: e.target.checked },
                      }))}
                    />
                    <Mail size={14} className="text-cyan-700" />
                    <span>Email</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.reminderChannels.sms}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        reminderChannels: { ...prev.reminderChannels, sms: e.target.checked },
                      }))}
                    />
                    <MessageSquare size={14} className="text-cyan-700" />
                    <span>SMS</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.reminderChannels.inApp}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        reminderChannels: { ...prev.reminderChannels, inApp: e.target.checked },
                      }))}
                    />
                    <BellRing size={14} className="text-cyan-700" />
                    <span>In-app Notification</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-md transition hover:from-cyan-700 hover:to-blue-700">
                  Book Appointment with {selectedDoctorName || 'Doctor'}
                </button>
              </div>
              </div>
            </form>
          ) : null}

          {paymentAssistant ? (
            <PaymentAssistantPanel
              paymentAssistant={paymentAssistant}
              paymentQrData={paymentQrData}
              onSelectMethod={handleSelectPaymentMethod}
              onCompleteOnlinePayment={handleCompleteOnlinePayment}
            />
          ) : null}

          <div className="relative z-10 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-semibold text-slate-800">
              <CalendarDays size={18} className="text-cyan-700" /> Appointment History
            </h2>
            {loading ? <p className="text-slate-500">Loading...</p> : null}

            {!loading && appointments.length === 0 ? <p className="text-slate-500">No appointments found</p> : null}

            {!loading && appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment._id} className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-cyan-50/40 p-4 shadow-sm transition hover:shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {appointment.doctorId?.userId?.name || `${appointment.doctorId?.userId?.firstName || ''} ${appointment.doctorId?.userId?.lastName || ''}`.trim()}
                      </p>
                      <p className="text-sm text-slate-600 inline-flex items-center gap-1">
                        <Clock3 size={14} className="text-cyan-700" />
                        {(appointment.appointmentDate || appointment.date || '').toString().slice(0, 10)} {appointment.startTime} - {appointment.endTime}
                      </p>
                      <p className="text-sm text-slate-500">{appointment.reason}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-700 capitalize">
                        {appointment.consultationType === 'telemedicine' ? <Video size={12} /> : <Stethoscope size={12} />}
                        {appointment.consultationType || 'in-person'}
                      </p>

                      {appointment.rating ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700"><Star size={12} className="fill-amber-400 text-amber-500" /> Your rating: {appointment.rating}/5</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusBadgeClass(appointment.status)}`}>
                        {appointment.status}
                      </span>

                      {appointment.consultationType === 'telemedicine' ? (
                        <button
                          type="button"
                          onClick={() => handleJoinVideo(appointment)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-sm text-white transition hover:bg-indigo-700"
                        >
                          <Video size={14} />
                          Join Video
                        </button>
                      ) : null}

                      {user?.role === 'patient' && appointment.status === 'completed' ? (
                        <div className="w-full md:w-72 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                          <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><Star size={12} /> Rate this doctor</p>
                          <select
                            title="Appointment rating"
                            className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-sm"
                            value={reviewDrafts[appointment._id]?.rating || appointment.rating || 5}
                            onChange={(e) => {
                              initializeReviewDraft(appointment._id, appointment.rating, appointment.review);
                              updateReviewDraft(appointment._id, { rating: Number(e.target.value) });
                            }}
                          >
                            <option value={5}>5 - Excellent</option>
                            <option value={4}>4 - Very good</option>
                            <option value={3}>3 - Good</option>
                            <option value={2}>2 - Fair</option>
                            <option value={1}>1 - Poor</option>
                          </select>
                          <textarea
                            className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-sm"
                            rows={2}
                            placeholder="Write a short review"
                            value={reviewDrafts[appointment._id]?.review ?? appointment.review ?? ''}
                            onChange={(e) => {
                              initializeReviewDraft(appointment._id, appointment.rating, appointment.review);
                              updateReviewDraft(appointment._id, { review: e.target.value });
                            }}
                          />
                          <button
                            type="button"
                            className="mt-2 w-full rounded-lg bg-emerald-600 px-2 py-1 text-sm text-white transition hover:bg-emerald-700"
                            onClick={() => handleSubmitReview(appointment._id)}
                          >
                            Submit Review
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
