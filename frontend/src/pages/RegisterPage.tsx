import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Copy, RefreshCw, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import FormInput from '../components/FormInput';

const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lower = 'abcdefghijklmnopqrstuvwxyz';
const nums = '0123456789';
const symbols = '!@#$%^&*()-_=+[]{};:,.?/';

const makePassword = () => {
  const pool = upper + lower + nums + symbols;
  const length = Math.floor(Math.random() * 9) + 8;
  return Array.from({ length }, () => pool[Math.floor(Math.random() * pool.length)]).join('');
};

const getStrength = (value: string) => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as 'admin' | 'doctor' | 'patient',
  });
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getStrength(formData.password), [formData.password]);
  const strengthWidthClass = ['w-0', 'w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full'][strength.score] || 'w-0';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = () => {
    const generated = makePassword();
    setFormData((prev) => ({ ...prev, password: generated, confirmPassword: generated }));
    toast.success('Password generated');
  };

  const handleCopy = async () => {
    if (!formData.password) {
      toast.error('Generate or type a password first');
      return;
    }

    await navigator.clipboard.writeText(formData.password);
    toast.success('Password copied');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (strength.score < 3) {
      toast.error('Use a stronger password');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });
      toast.success('Registration successful');
      navigate('/dashboard');
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Registration failed');
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
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-sm font-semibold text-sky-700">
            <UserPlus size={16} />
            New Account Setup
          </div>
          <h1 className="mt-5 font-display text-4xl font-extrabold text-slate-900">Create your hospital workspace access</h1>
          <p className="mt-4 text-slate-600">
            Register once, keep your profile synced, and access appointments and records with secure role-based access.
          </p>
        </section>

        <section className="auth-card animate-float-up">
          <div className="mb-7">
            <h2 className="font-display text-2xl font-bold text-slate-900">Create account</h2>
            <p className="mt-2 text-sm text-slate-500">Your form data is saved to the database on signup</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Full Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Dr. Jane Doe"
              required
            />

            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@hospital.com"
              required
              autoComplete="email"
            />

            <FormInput
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="9876543210"
              autoComplete="tel"
            />

            <div>
              <FormInput
                label="Password"
                name="password"
                type="text"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create strong password"
                required
                autoComplete="new-password"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <RefreshCw size={14} />
                  Generate
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Password strength</span>
                  <span className="font-semibold">{strength.label}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} ${strengthWidthClass} transition-all duration-300`} />
                </div>
              </div>
            </div>

            <FormInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                id="role"
                name="role"
                title="Select role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="text-center text-slate-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-700 hover:text-teal-800 font-semibold">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
