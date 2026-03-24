import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '@biopropose/shared-types';
import { FileText, Eye, EyeOff } from 'lucide-react';

const ROLES = [
  { value: UserRole.PROPOSAL_MANAGER, label: 'Proposal Manager' },
  { value: UserRole.QA_QC, label: 'SME / Reviewer' },
] as const;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.PROPOSAL_MANAGER);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email address'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    login({ name, email: email.trim().toLowerCase(), role });
    navigate('/dashboard');
  };

  const isDisabled = !email || password.length < 6 || !role;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg">

        {/* Header */}
        <div className="text-center space-y-4 px-8 pt-8 pb-6">
          <div className="mx-auto w-16 h-16 bg-brand-800 rounded-2xl flex items-center justify-center">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Biologics RFI/RFP Platform</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to access your proposal workspace</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 pb-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className="input h-12"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input h-12 pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role selector dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Select Role <span className="text-red-500">*</span>
              </label>
              <select
                className="input h-12"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                required
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center h-12 text-base"
              disabled={isDisabled}
            >
              Sign In
            </button>
          </form>

          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Use any valid email and password (min 6 characters)
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
