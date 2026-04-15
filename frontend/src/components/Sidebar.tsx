import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import KushalLogo from './KushalLogo';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  User,
  Siren,
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'doctor', 'patient'],
    },
    {
      path: '/patients',
      label: 'Patients',
      icon: Users,
      roles: ['admin', 'doctor'],
    },
    {
      path: '/doctors',
      label: 'Doctors',
      icon: Stethoscope,
      roles: ['admin', 'patient', 'doctor'],
    },
    {
      path: '/appointments',
      label: 'Book Appointment',
      icon: Calendar,
      roles: ['admin', 'doctor', 'patient'],
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: User,
      roles: ['admin', 'doctor', 'patient'],
    },
    {
      path: '/emergency-admin',
      label: 'Emergency Admin',
      icon: Siren,
      roles: ['admin', 'receptionist'],
    },
  ];

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <aside className="w-64 border-r border-sky-100 bg-slate-900 text-white">
      <div className="flex h-full flex-col">
      <div className="p-4">
        <KushalLogo size="sm" showText={false} />
        <p className="text-xs uppercase tracking-wider text-slate-400 mt-2">Hospital Console</p>
      </div>

      <nav className="space-y-2 px-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 rounded-xl px-4 py-2.5 transition ${
                isActive(item.path)
                  ? 'bg-teal-700 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400">© 2026 Kushal Hospitals</p>
      </div>
      </div>
    </aside>
  );
}
