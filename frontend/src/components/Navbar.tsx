import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';
import KushalLogo from './KushalLogo';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="border-b border-sky-100 bg-white/80 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <KushalLogo size="md" showText={true} />
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{displayName}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role?.replace('_', ' ')}</p>
            </div>

            <button
              onClick={() => navigate('/profile')}
              className="rounded-lg px-2 py-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Profile
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 rounded-lg px-2 py-1 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
