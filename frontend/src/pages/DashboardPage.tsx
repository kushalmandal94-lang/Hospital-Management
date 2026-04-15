import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  CalendarCheck2,
  CalendarDays,
  CircleDashed,
  ClipboardList,
  Siren,
  Star,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import { appointmentAPI, doctorAPI, notificationAPI, patientAPI, type NotificationItem } from '../services/api';

interface DashboardStats {
  users: number;
  doctors: number;
  patients: number;
  appointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  todayAppointments: number;
}

interface DashboardAppointment {
  _id: string;
  appointmentDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  status: string;
  consultationType?: 'in-person' | 'telemedicine';
  doctorId?: {
    _id?: string;
    userId?: {
      name?: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

interface DashboardLoadResult {
  appointmentList: DashboardAppointment[];
  notifications: NotificationItem[];
  unreadCount: number;
  doctorsCount: number;
  patientsCount: number;
}

interface ResourceCapacity {
  total: number;
  occupied: number;
}

interface BedManagementState {
  icuBeds: ResourceCapacity;
  generalBeds: ResourceCapacity;
  ventilators: ResourceCapacity;
}

const countPendingAppointments = (appointments: Array<{ status: string }>) =>
  appointments.reduce((total, appointment) => total + (appointment.status === 'pending' ? 1 : 0), 0);

const countCompletedAppointments = (appointments: Array<{ status: string }>) =>
  appointments.reduce((total, appointment) => total + (appointment.status === 'completed' ? 1 : 0), 0);

const countTodayAppointments = (appointments: DashboardAppointment[]) => {
  const today = new Date().toISOString().slice(0, 10);
  return appointments.reduce((total, appointment) => {
    const dateValue = (appointment.appointmentDate || appointment.date || '').toString().slice(0, 10);
    return total + (dateValue === today ? 1 : 0);
  }, 0);
};

const toDateTimeValue = (appointment: DashboardAppointment) => {
  const rawDate = appointment.appointmentDate || appointment.date;
  if (!rawDate) return Number.MAX_SAFE_INTEGER;

  const datePart = new Date(rawDate).toISOString().slice(0, 10);
  const timePart = appointment.startTime || '00:00';
  const dateTime = new Date(`${datePart}T${timePart}:00`);
  return Number.isNaN(dateTime.getTime()) ? Number.MAX_SAFE_INTEGER : dateTime.getTime();
};

const getStatusBadgeClass = (status?: string) => {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'cancelled') return 'bg-rose-100 text-rose-700';
  if (status === 'confirmed' || status === 'scheduled') return 'bg-cyan-100 text-cyan-700';
  return 'bg-amber-100 text-amber-700';
};

const parseNonNegativeNumber = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
};

const getAvailability = ({ total, occupied }: ResourceCapacity) => {
  const safeTotal = Math.max(0, total);
  const safeOccupied = Math.min(Math.max(0, occupied), safeTotal);
  const available = Math.max(0, safeTotal - safeOccupied);
  const lowAvailability = safeTotal > 0 && available / safeTotal < 0.2;

  return {
    total: safeTotal,
    occupied: safeOccupied,
    available,
    lowAvailability,
  };
};

const loadDashboardDataForUser = async (userRole: string, userId: string): Promise<DashboardLoadResult> => {
  if (userRole === 'admin') {
    const [doctorsRes, patientsRes, appointmentsRes, notificationsRes] = await Promise.all([
      doctorAPI.getAll(1),
      patientAPI.getAll(1),
      appointmentAPI.getAll(),
      notificationAPI.getAll(6),
    ]);

    return {
      appointmentList: appointmentsRes.data?.appointments || [],
      notifications: notificationsRes.data?.notifications || [],
      unreadCount: notificationsRes.data?.unreadCount || 0,
      doctorsCount: doctorsRes.data?.count || 0,
      patientsCount: patientsRes.data?.count || 0,
    };
  }

  if (userRole === 'doctor') {
    const doctorProfile = await doctorAPI.getByUserId(userId);
    const doctorId = doctorProfile.data?.doctor?._id;

    const [appointmentsRes, notificationsRes] = await Promise.all([
      appointmentAPI.getAll({ doctorId }),
      notificationAPI.getAll(6),
    ]);

    return {
      appointmentList: appointmentsRes.data?.appointments || [],
      notifications: notificationsRes.data?.notifications || [],
      unreadCount: notificationsRes.data?.unreadCount || 0,
      doctorsCount: 0,
      patientsCount: 0,
    };
  }

  if (userRole === 'patient') {
    const patientProfile = await patientAPI.getByUserId(userId);
    const patientId = patientProfile.data?.patient?._id;

    const [appointmentsRes, notificationsRes] = await Promise.all([
      appointmentAPI.getAll({ patientId }),
      notificationAPI.getAll(6),
    ]);

    return {
      appointmentList: appointmentsRes.data?.appointments || [],
      notifications: notificationsRes.data?.notifications || [],
      unreadCount: notificationsRes.data?.unreadCount || 0,
      doctorsCount: 0,
      patientsCount: 0,
    };
  }

  return {
    appointmentList: [],
    notifications: [],
    unreadCount: 0,
    doctorsCount: 0,
    patientsCount: 0,
  };
};

export default function DashboardPage() { // NOSONAR
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    doctors: 0,
    patients: 0,
    appointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    todayAppointments: 0,
  });
  const [bedManagement, setBedManagement] = useState<BedManagementState>({
    icuBeds: { total: 20, occupied: 14 },
    generalBeds: { total: 100, occupied: 76 },
    ventilators: { total: 30, occupied: 22 },
  });

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const result = await loadDashboardDataForUser(user.role, user.id);
        const appointmentList = result.appointmentList;

        setAppointments(appointmentList);
        setNotifications(result.notifications);
        setUnreadNotifications(result.unreadCount);

        setStats({
          users: user.role === 'admin' ? result.doctorsCount + result.patientsCount : 0,
          doctors: user.role === 'admin' ? result.doctorsCount : 0,
          patients: user.role === 'admin' ? result.patientsCount : 0,
          appointments: appointmentList.length,
          pendingAppointments: countPendingAppointments(appointmentList),
          completedAppointments: countCompletedAppointments(appointmentList),
          todayAppointments: countTodayAppointments(appointmentList),
        });
      } catch {
        // Keep dashboard resilient if any API fails.
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const upcomingAppointments = useMemo(() => {
    return [...appointments]
      .filter((item) => ['pending', 'scheduled', 'confirmed'].includes(item.status))
      .sort((a, b) => toDateTimeValue(a) - toDateTimeValue(b))
      .slice(0, 5);
  }, [appointments]);

  const completionRate = stats.appointments > 0
    ? Math.round((stats.completedAppointments / stats.appointments) * 100)
    : 0;

  const icuAvailability = getAvailability(bedManagement.icuBeds);
  const generalAvailability = getAvailability(bedManagement.generalBeds);
  const ventilatorAvailability = getAvailability(bedManagement.ventilators);

  const handleCapacityChange = (
    resource: keyof BedManagementState,
    field: keyof ResourceCapacity,
    value: string
  ) => {
    const nextValue = parseNonNegativeNumber(value);

    setBedManagement((current) => {
      const currentResource = current[resource];
      const updatedResource: ResourceCapacity = {
        ...currentResource,
        [field]: nextValue,
      };

      if (field === 'total') {
        updatedResource.occupied = Math.min(updatedResource.occupied, updatedResource.total);
      }

      return {
        ...current,
        [resource]: updatedResource,
      };
    });
  };

  return (
    <div className="flex h-screen bg-[#edf6ff]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 md:p-8">
          <div className="dashboard-bg-image absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30" />
          <div className="absolute inset-0 bg-[#edf6ff]/78" />
          <div className="pointer-events-none absolute -top-16 -right-12 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="pointer-events-none absolute top-56 -left-20 h-72 w-72 rounded-full bg-blue-200/35 blur-3xl" />

          <div className="relative z-10">
            <section className="mb-6 rounded-2xl border border-cyan-100 bg-gradient-to-r from-[#0f6ba8] via-[#0a7ebd] to-[#14a3c7] p-6 text-white shadow-lg">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium tracking-wide">
                    <ClipboardList size={14} /> Care Operations Center
                  </p>
                  <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                  <p className="mt-2 text-sm text-cyan-50">
                    Welcome, {displayName}. Role: <span className="font-semibold capitalize">{user?.role}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                    <p className="text-cyan-100">Today</p>
                    <p className="text-lg font-semibold">{stats.todayAppointments} appointments</p>
                  </div>
                  <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                    <p className="text-cyan-100">Unread</p>
                    <p className="text-lg font-semibold">{unreadNotifications} alerts</p>
                  </div>
                </div>
              </div>
            </section>

            {loading ? (
              <div className="rounded-2xl border border-sky-100 bg-white p-6 font-semibold text-slate-900 shadow-sm">
                Loading dashboard data...
              </div>
            ) : null}

            {loading ? null : (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CalendarDays size={14} className="text-cyan-700" /> Appointments
                  </p>
                  <p className="text-3xl font-extrabold text-cyan-700">{stats.appointments}</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CircleDashed size={14} className="text-amber-600" /> Pending
                  </p>
                  <p className="text-3xl font-extrabold text-amber-600">{stats.pendingAppointments}</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Star size={14} className="text-emerald-700" /> Completed
                  </p>
                  <p className="text-3xl font-extrabold text-emerald-700">{stats.completedAppointments}</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ClipboardList size={14} className="text-indigo-700" /> Today
                  </p>
                  <p className="text-3xl font-extrabold text-indigo-700">{stats.todayAppointments}</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <BellRing size={14} className="text-rose-700" /> Completion Rate
                  </p>
                  <p className="text-3xl font-extrabold text-rose-700">{completionRate}%</p>
                </div>
              </div>
            )}

            {!loading && user?.role === 'admin' ? (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Users size={14} className="text-blue-700" /> Total Users
                  </p>
                  <p className="text-3xl font-extrabold text-blue-700">{stats.users}</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Stethoscope size={14} className="text-cyan-700" /> Doctors
                  </p>
                  <p className="text-3xl font-extrabold text-cyan-700">{stats.doctors}</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <User size={14} className="text-emerald-700" /> Patients
                  </p>
                  <p className="text-3xl font-extrabold text-emerald-700">{stats.patients}</p>
                </div>
              </div>
            ) : null}

            {loading ? null : (
              <section className="mb-6 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-slate-800">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => navigate('/appointments')}
                    className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-left text-sm font-medium text-cyan-800 transition hover:bg-cyan-100"
                  >
                    <p className="inline-flex items-center gap-2"><CalendarCheck2 size={14} /> Manage Appointments</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/doctors')}
                    className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-800 transition hover:bg-blue-100"
                  >
                    <p className="inline-flex items-center gap-2"><Stethoscope size={14} /> Doctors Directory</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-left text-sm font-medium text-indigo-800 transition hover:bg-indigo-100"
                  >
                    <p className="inline-flex items-center gap-2"><User size={14} /> Update Profile</p>
                  </button>
                  {user?.role === 'admin' || user?.role === 'receptionist' ? (
                    <button
                      type="button"
                      onClick={() => navigate('/emergency-admin')}
                      className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-left text-sm font-medium text-rose-800 transition hover:bg-rose-100"
                    >
                      <p className="inline-flex items-center gap-2"><Siren size={14} /> Emergency Console</p>
                    </button>
                  ) : null}
                </div>
              </section>
            )}

            {loading ? null : (
              <section className="mb-6 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-800">Hospital Bed Management</h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                    <p className="text-sm font-semibold text-cyan-900">ICU Beds</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="text-xs font-medium text-cyan-800">
                        <span>Total beds</span>
                        <input
                          type="number"
                          min={0}
                          value={bedManagement.icuBeds.total}
                          onChange={(event) => handleCapacityChange('icuBeds', 'total', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-cyan-200 focus:ring-2"
                        />
                      </label>
                      <label className="text-xs font-medium text-cyan-800">
                        <span>Occupied beds</span>
                        <input
                          type="number"
                          min={0}
                          value={bedManagement.icuBeds.occupied}
                          onChange={(event) => handleCapacityChange('icuBeds', 'occupied', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-cyan-200 focus:ring-2"
                        />
                      </label>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-cyan-900">
                      ICU Beds: {icuAvailability.available} / {icuAvailability.total}
                    </p>
                    {icuAvailability.lowAvailability ? (
                      <p className="mt-2 rounded-lg border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                        Warning: ICU bed availability is below 20%.
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-900">General Beds</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="text-xs font-medium text-emerald-800">
                        <span>Total beds</span>
                        <input
                          type="number"
                          min={0}
                          value={bedManagement.generalBeds.total}
                          onChange={(event) => handleCapacityChange('generalBeds', 'total', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-emerald-200 focus:ring-2"
                        />
                      </label>
                      <label className="text-xs font-medium text-emerald-800">
                        <span>Occupied beds</span>
                        <input
                          type="number"
                          min={0}
                          value={bedManagement.generalBeds.occupied}
                          onChange={(event) => handleCapacityChange('generalBeds', 'occupied', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-emerald-200 focus:ring-2"
                        />
                      </label>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-emerald-900">
                      General Beds: {generalAvailability.available} / {generalAvailability.total}
                    </p>
                    {generalAvailability.lowAvailability ? (
                      <p className="mt-2 rounded-lg border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                        Warning: General bed availability is below 20%.
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                    <p className="text-sm font-semibold text-violet-900">Ventilators</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="text-xs font-medium text-violet-800">
                        <span>Total units</span>
                        <input
                          type="number"
                          min={0}
                          value={bedManagement.ventilators.total}
                          onChange={(event) => handleCapacityChange('ventilators', 'total', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-violet-200 focus:ring-2"
                        />
                      </label>
                      <label className="text-xs font-medium text-violet-800">
                        <span>Occupied units</span>
                        <input
                          type="number"
                          min={0}
                          value={bedManagement.ventilators.occupied}
                          onChange={(event) => handleCapacityChange('ventilators', 'occupied', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-violet-200 focus:ring-2"
                        />
                      </label>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-violet-900">
                      Ventilators: {ventilatorAvailability.available} / {ventilatorAvailability.total}
                    </p>
                    {ventilatorAvailability.lowAvailability ? (
                      <p className="mt-2 rounded-lg border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                        Warning: Ventilator availability is below 20%.
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>
            )}

            {loading ? null : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-lg font-semibold text-slate-800">Upcoming Appointments</h2>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-sm text-slate-500">No upcoming appointments.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.map((appointment) => (
                        <div key={appointment._id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-slate-800">
                                {appointment.doctorId?.userId?.name || `${appointment.doctorId?.userId?.firstName || ''} ${appointment.doctorId?.userId?.lastName || ''}`.trim() || 'Doctor appointment'}
                              </p>
                              <p className="text-xs text-slate-600">
                                {(appointment.appointmentDate || appointment.date || '').toString().slice(0, 10)} {appointment.startTime} - {appointment.endTime}
                              </p>
                              <p className="text-xs text-slate-500">{appointment.reason || 'General consultation'}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusBadgeClass(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-lg font-semibold text-slate-800">Recent Notifications</h2>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-slate-500">No recent notifications.</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`rounded-xl border px-4 py-3 ${notification.isRead ? 'border-slate-200 bg-slate-50' : 'border-cyan-200 bg-cyan-50'}`}
                        >
                          <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                          <p className="text-xs text-slate-600">{notification.message}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {!loading && user?.role === 'doctor' ? (
              <div className="mt-6 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-800">Doctor Workspace</p>
                <p className="mt-1 text-sm text-slate-600">Open appointments and follow-up queue from Quick Actions to keep consultations on schedule.</p>
              </div>
            ) : null}

            {!loading && user?.role === 'patient' ? (
              <div className="mt-6 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-800">Patient Tip</p>
                <p className="mt-1 text-sm text-slate-600">
                  Keep reminder channels enabled and join telemedicine appointments 10 minutes early for a smoother consultation.
                </p>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
