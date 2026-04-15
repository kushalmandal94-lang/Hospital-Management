import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Filter, Mail, Star, Stethoscope } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { doctorAPI, type Doctor, type DoctorReview } from '../services/api';
import { useAuthStore } from '../store/authStore';

const SPECIALIZATION_OPTIONS = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Dermatology',
  'ENT',
  'General Surgery',
  'General Physician',
  'Pediatrics',
  'Gynecology',
  'Psychiatry',
  'Oncology',
  'Radiology',
  'Pathology',
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialization, setSpecialization] = useState('');
  const [reviewsByDoctor, setReviewsByDoctor] = useState<Record<string, DoctorReview[]>>({});
  const [loadingReviewsFor, setLoadingReviewsFor] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const getReviewerName = (review: DoctorReview) => {
    return review.userId?.name || `${review.userId?.firstName || ''} ${review.userId?.lastName || ''}`.trim() || 'Anonymous patient';
  };

  const loadDoctorReviews = async (doctorId: string) => {
    if (reviewsByDoctor[doctorId] !== undefined) {
      setReviewsByDoctor((prev) => {
        const { [doctorId]: _removed, ...rest } = prev;
        return rest;
      });
      return;
    }

    try {
      setLoadingReviewsFor(doctorId);
      const res = await doctorAPI.getReviews(doctorId, 1, 3);
      setReviewsByDoctor((prev) => ({ ...prev, [doctorId]: res.data?.reviews || [] }));
    } finally {
      setLoadingReviewsFor(null);
    }
  };

  const getReviewToggleLabel = (doctorId: string) => {
    if (loadingReviewsFor === doctorId) return 'Loading reviews...';
    if (reviewsByDoctor[doctorId] === undefined) return 'View reviews';
    return 'Hide reviews';
  };

  const matchedDoctorsCount = doctors.length;

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await doctorAPI.getAll(1, specialization, 40);
        setDoctors(res.data?.doctors || []);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    loadDoctors();
  }, [specialization]);

  return (
    <div className="flex h-screen bg-[#edf6ff]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="relative flex-1 overflow-auto p-4 md:p-6">
          <div className="pointer-events-none absolute -top-16 -right-14 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="pointer-events-none absolute top-44 -left-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

          <section className="relative z-10 mb-6 rounded-2xl border border-cyan-100 bg-gradient-to-r from-[#0f6ba8] via-[#0a7ebd] to-[#14a3c7] p-6 text-white shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium tracking-wide">
                  <Stethoscope size={14} /> Specialist Directory
                </p>
                <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
                <p className="mt-2 max-w-2xl text-sm text-cyan-50">
                  Discover experienced clinicians across departments, check ratings, and book appointments with confidence.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                  <p className="text-cyan-100">Available Doctors</p>
                  <p className="text-lg font-semibold">{matchedDoctorsCount}</p>
                </div>
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                  <p className="text-cyan-100">Selected Filter</p>
                  <p className="text-lg font-semibold">{specialization || 'All'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="relative z-10 mb-6 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 inline-flex items-center gap-2">
                  <Filter size={16} className="text-cyan-700" /> Filter Doctors
                </h2>
                <p className="mt-1 text-sm text-slate-500">Choose a specialization to narrow the doctor list.</p>
              </div>

              <div className="w-full md:w-80">
                <label htmlFor="specialization" className="sr-only">
                  Filter doctors by specialization
                </label>
                <select
                  id="specialization"
                  title="Doctor specialization filter"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                >
                  <option value="">All Specializations</option>
                  {SPECIALIZATION_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {loading ? <div className="relative z-10 rounded-2xl border border-sky-100 bg-white p-6 text-slate-600 shadow-sm">Loading doctors...</div> : null}

          {loading ? null : (
            <div className="relative z-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <div key={doctor._id} className="group rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-cyan-50/30 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  {(() => {
                    const doctorName = doctor.userId?.name || `${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`.trim();
                    return (
                      <img
                        src={doctor.userId?.profilePicture || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80'}
                        alt={`${doctorName} profile`}
                        className="mb-4 h-20 w-20 rounded-full border-2 border-cyan-100 object-cover shadow-sm"
                      />
                    );
                  })()}
                  <h3 className="text-lg font-semibold text-slate-800">
                    {doctor.userId?.name || `${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`.trim()}
                  </h3>
                  <p className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">{doctor.specialization}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-600">
                    <Mail size={14} className="text-cyan-700" /> {doctor.userId?.email}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-amber-700">
                    <Star size={14} className="fill-amber-400 text-amber-500" />
                    {(doctor.rating || 0).toFixed(1)} / 5 ({doctor.totalReviews || 0} reviews)
                  </p>

                  <button
                    type="button"
                    className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                    onClick={() => loadDoctorReviews(doctor._id)}
                  >
                    {getReviewToggleLabel(doctor._id)}
                  </button>

                  {reviewsByDoctor[doctor._id] && reviewsByDoctor[doctor._id].length > 0 ? (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                      {reviewsByDoctor[doctor._id].map((review) => (
                        <div key={review._id} className="rounded-xl border border-slate-200 bg-white p-2">
                          <p className="text-xs font-medium text-slate-700">{getReviewerName(review)} • {review.rating}/5</p>
                          <p className="text-xs text-slate-600">{review.review || 'No written review.'}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {user?.role === 'patient' ? (
                    <button
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-2 text-sm font-semibold text-white transition hover:from-cyan-700 hover:to-blue-700"
                      onClick={() => navigate(`/appointments?doctorId=${doctor._id}`)}
                    >
                      <CalendarDays size={15} />
                      Book Appointment
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
