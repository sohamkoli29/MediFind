import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Pill, Sun, Moon, AlertCircle } from 'lucide-react';
import { loginUser, clearError } from '../../features/auth/authSlice';
import useTheme from '../../hooks/useTheme';
import GoogleAuthButton from '../oauth/GoogleAuthButton';
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { loading, error, user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'pharmacy_staff') navigate('/pharmacy');
      else navigate('/');
    }
  }, [user]);

  useEffect(() => {
    dispatch(clearError());
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col lg:flex-row">
      {/* ── Left Panel — Branding (hidden on mobile) ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-10 xl:p-14"
        style={{ background: 'hsl(161 94% 18%)' }}
      >
        {/* Concentric rings */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white"
              style={{
                width: `${(i + 1) * 130}px`,
                height: `${(i + 1) * 130}px`,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">MediFind</span>
        </div>

        <div className="relative z-10">
          <p className="text-white/60 text-sm uppercase tracking-widest mb-4 font-medium">
            Medicine Availability Finder
          </p>
          <h1
            className="text-white text-4xl xl:text-5xl leading-tight mb-6"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Find medicine.
            <br />
            <span className="text-white/60">Not excuses.</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Real-time stock visibility across pharmacies near you — no delivery, just accurate, fast information.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { value: 'Live', label: 'Stock Updates' },
            { value: '25km', label: 'Search Radius' },
            { value: '2', label: 'Portals' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
              <p className="text-white/50 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Right Panel — Form ── */}
      <div
        className="flex-1 flex flex-col"
        style={{ backgroundColor: 'hsl(var(--background))' }}
      >
        {/* Top bar */}
        <div className="flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--primary))' }}
            >
              <Pill className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base">MediFind</span>
          </div>
          <div className="hidden lg:block" />

          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors nav-btn"
            style={{ backgroundColor: 'hsl(var(--secondary))' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-sm sm:max-w-md">

            <motion.div
              custom={0} variants={fadeUp} initial="hidden" animate="visible"
              className="mb-8"
            >
              <h2
                className="text-2xl sm:text-3xl mb-2"
                style={{ fontFamily: "'DM Serif Display', serif", color: 'hsl(var(--foreground))' }}
              >
                Welcome back
              </h2>
              <p className="text-sm sm:text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Sign in to your MediFind account
              </p>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl mb-6 text-sm"
                style={{
                  backgroundColor: 'hsl(var(--destructive) / 0.1)',
                  color: 'hsl(var(--destructive))',
                  border: '1px solid hsl(var(--destructive) / 0.2)',
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    backgroundColor: 'hsl(var(--secondary))',
                    color: 'hsl(var(--foreground))',
                    border: '1.5px solid hsl(var(--border))',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--primary))')}
                  onBlur={(e) => (e.target.style.borderColor = 'hsl(var(--border))')}
                />
              </motion.div>

              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                    style={{
                      backgroundColor: 'hsl(var(--secondary))',
                      color: 'hsl(var(--foreground))',
                      border: '1.5px solid hsl(var(--border))',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--primary))')}
                    onBlur={(e) => (e.target.style.borderColor = 'hsl(var(--border))')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center nav-btn"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all mt-1"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    opacity: loading ? 0.7 : 1,
                    minHeight: '48px',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </motion.div>
            </form>
                  <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />
    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>or</span>
    <div className="flex-1 h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />
  </div>
  <GoogleAuthButton label="Sign in with Google" disabled={loading} />
</motion.div>
            <motion.p
              custom={4} variants={fadeUp} initial="hidden" animate="visible"
              className="text-center text-sm mt-6"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold transition-colors"
                style={{ color: 'hsl(var(--primary))' }}
              >
                Create one
              </Link>
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;