import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Footer from '../components/Footer';
import KushalLogo from '../components/KushalLogo';
import { Activity, CalendarCheck, ShieldCheck, Stethoscope } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const highlights = [
    {
      title: 'Realtime Care Operations',
      description: 'Unified dashboards for doctors, patients, and administrators with role-based workflows.',
      icon: Activity,
    },
    {
      title: 'Fast Appointment Flow',
      description: 'Doctor discovery, availability checks, and bookings that stay synced with your records.',
      icon: CalendarCheck,
    },
    {
      title: 'Security by Design',
      description: 'Protected routes, JWT-based sessions, and auditable activity handling for critical actions.',
      icon: ShieldCheck,
    },
    {
      title: 'Clinical Experience Focused',
      description: 'EMR-ready architecture built for practical, daily hospital operations.',
      icon: Stethoscope,
    },
  ];

  return (
    <div className="min-h-screen text-slate-900">
      <nav className="sticky top-0 z-20 border-b border-sky-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <KushalLogo size="md" showText={true} />
          <div className="space-x-4">
            {token ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-secondary"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="btn-primary"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="glass-card animate-float-up overflow-hidden">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <p className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">Digital Hospital Platform</p>
              <h2 className="font-display text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
                Clinical care, appointments, and patient workflows in one modern workspace.
              </h2>
              <p className="text-lg text-slate-600">
                Built for real teams that need speed, reliability, and clear role-based access across hospital operations.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" onClick={() => navigate(token ? '/dashboard' : '/signup')}>
                  {token ? 'Open Dashboard' : 'Create Account'}
                </button>
                <button className="btn-secondary" onClick={() => navigate('/doctors')}>
                  Explore Doctors
                </button>
              </div>
            </div>

            <div className="section-shell bg-gradient-to-br from-sky-50 to-teal-50">
              <p className="text-sm font-semibold uppercase tracking-wider text-sky-700">Operational Snapshot</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-sky-100 bg-white p-4">
                  <p className="text-sm text-slate-500">Uptime</p>
                  <p className="mt-1 text-2xl font-extrabold text-teal-700">99.9%</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white p-4">
                  <p className="text-sm text-slate-500">Roles</p>
                  <p className="mt-1 text-2xl font-extrabold text-sky-700">RBAC</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white p-4">
                  <p className="text-sm text-slate-500">Booking</p>
                  <p className="mt-1 text-2xl font-extrabold text-orange-600">Realtime</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white p-4">
                  <p className="text-sm text-slate-500">Records</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">Secure</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="section-shell animate-float-up">
                <div className="mb-3 inline-flex rounded-lg bg-sky-100 p-2 text-sky-700">
                  <Icon size={22} />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-slate-600">{item.description}</p>
              </article>
            );
          })}
        </section>
      </main>

      <Footer />
    </div>
  );
}
