import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Pill, Sun, Moon, AlertCircle } from 'lucide-react';
import { loginUser, clearError } from '../../features/auth/authSlice';
import useTheme from '../../hooks/useTheme';

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

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'pharmacy_staff') navigate('/pharmacy');
      else navigate('/');
    }
  }, [user]);

  useEffect(() => {
    dispatch(clearError());
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel — Branding ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'hsl(161 94% 18%)' }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white"
              style={{
                width: `${(i + 1) * 120}px`,
                height: `${(i + 1) * 120}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">MediFind</span>
          </div>

          {/* Hero text */}
          <div>
            <p className="text-white/60 text-sm uppercase tracking-widest mb-4 font-medium">
              Medicine Availability Finder
            </p>
            <h1
              className="text-white text-5xl leading-tight mb-6"
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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
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
        </div>
      </motion.div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: 'hsl(var(--background))' }}>
        {/* Top bar */}
        <div className="flex justify-between items-center p-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <Pill className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
            <span className="font-bold text-lg">MediFind</span>
          </div>
          <div className="hidden lg:block" />

          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'hsl(var(--secondary))' }}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md">

            {/* Heading */}
            <motion.div
              custom={0} variants={fadeUp} initial="hidden" animate="visible"
              className="mb-8"
            >
              <h2
                className="text-3xl mb-2"
                style={{ fontFamily: "'DM Serif Display', serif", color: 'hsl(var(--foreground))' }}
              >
                Welcome back
              </h2>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                Sign in to your MediFind account
              </p>
            </motion.div>

            {/* Error banner */}
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
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
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    backgroundColor: 'hsl(var(--secondary))',
                    color: 'hsl(var(--foreground))',
                    border: '1.5px solid hsl(var(--border))',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                  onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                />
              </motion.div>

              {/* Password */}
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
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                    style={{
                      backgroundColor: 'hsl(var(--secondary))',
                      color: 'hsl(var(--foreground))',
                      border: '1.5px solid hsl(var(--border))',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                    onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all mt-2"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    opacity: loading ? 0.7 : 1,
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
                  ) : 'Sign in'}
                </button>
              </motion.div>
            </form>

            {/* Footer link */}
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