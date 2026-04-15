import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import FormInput from '../components/FormInput';
import KushalLogo from '../components/KushalLogo';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(identifier, password);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen px-4 py-10">
      <div className="auth-glow auth-glow-left" aria-hidden="true" />
      <div className="auth-glow auth-glow-right" aria-hidden="true" />
      <div className="mx-auto max-w-6xl auth-grid">
        <section className="auth-brand-panel animate-float-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1 text-sm font-semibold text-teal-700">
            <ShieldCheck size={16} />
            Secure Access
          </div>
          <div className="mt-5 flex items-center gap-3">
            <KushalLogo size="lg" showText={true} />
          </div>
          <p className="mt-4 text-slate-600">
            Continue to your personalized dashboard, appointments, and secure patient workflows.
          </p>
          <div className="mt-6 rounded-2xl border border-sky-100 bg-white/80 p-5">
            <p className="text-sm text-slate-500">Sign in using your email or phone linked with your hospital account.</p>
          </div>
        </section>

        <section className="auth-card animate-float-up">
          <div className="mb-7">
            <h2 className="font-display text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Access your role-based hospital workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email or Phone"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="you@hospital.com or 9876543210"
              autoComplete="username"
            />

            <FormInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-center text-slate-600 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-teal-700 hover:text-teal-800 font-semibold">
              Create one
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
