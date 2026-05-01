import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Pill, Sun, Moon, AlertCircle, User, Store } from 'lucide-react';
import { registerUser, clearError } from '../../features/auth/authSlice';
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

const roles = [
  {
    value: 'patient',
    label: 'Patient',
    description: 'Search for medicines near you',
    icon: User,
  },
  {
    value: 'pharmacy_staff',
    label: 'Pharmacy Staff',
    description: 'Manage your pharmacy inventory',
    icon: Store,
  },
];

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { loading, error, user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'patient',
  });
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
    dispatch(registerUser(form));
  };

  const inputStyle = {
    backgroundColor: 'hsl(var(--secondary))',
    color: 'hsl(var(--foreground))',
    border: '1.5px solid hsl(var(--border))',
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col lg:flex-row">
      {/* ── Left Panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-10 xl:p-14"
        style={{ background: 'hsl(161 94% 18%)' }}
      >
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
            Join the platform
          </p>
          <h1
            className="text-white text-4xl xl:text-5xl leading-tight mb-6"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Medicine,
            <br />
            <span className="text-white/60">found fast.</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Join as a patient to find medicines, or as pharmacy staff to list your stock in real-time.
          </p>
        </div>

        <div
          className="relative z-10 p-6 rounded-2xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <p className="text-white/60 text-xs uppercase tracking-wider mb-3">How it works</p>
          {['Register your account', 'Set up your profile', 'Start finding or listing medicines'].map(
            (step, i) => (
              <div key={step} className="flex items-center gap-3 mb-2 last:mb-0">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-white/80 text-sm">{step}</p>
              </div>
            )
          )}
        </div>
      </motion.div>

      {/* ── Right Panel ── */}
      <div
        className="flex-1 flex flex-col"
        style={{ backgroundColor: 'hsl(var(--background))' }}
      >
        {/* Top bar */}
        <div className="flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4">
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
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-6 sm:px-8">
          <div className="w-full max-w-sm sm:max-w-md">

            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-6 sm:mb-8">
              <h2
                className="text-2xl sm:text-3xl mb-2"
                style={{ fontFamily: "'DM Serif Display', serif", color: 'hsl(var(--foreground))' }}
              >
                Create account
              </h2>
              <p className="text-sm sm:text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Get started with MediFind today
              </p>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-3 p-4 rounded-xl mb-5 text-sm"
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
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Role selector */}
              <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {roles.map(({ value, label, description, icon: Icon }) => {
                    const selected = form.role === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, role: value }))}
                        className="p-3 sm:p-4 rounded-xl text-left transition-all"
                        style={{
                          border: selected
                            ? '2px solid hsl(var(--primary))'
                            : '2px solid hsl(var(--border))',
                          backgroundColor: selected
                            ? 'hsl(var(--primary) / 0.08)'
                            : 'hsl(var(--secondary))',
                          minHeight: '80px',
                        }}
                      >
                        <Icon
                          className="w-4 h-4 mb-1.5 sm:w-5 sm:h-5 sm:mb-2"
                          style={{
                            color: selected
                              ? 'hsl(var(--primary))'
                              : 'hsl(var(--muted-foreground))',
                          }}
                        />
                        <p
                          className="font-semibold text-xs sm:text-sm"
                          style={{
                            color: selected
                              ? 'hsl(var(--primary))'
                              : 'hsl(var(--foreground))',
                          }}
                        >
                          {label}
                        </p>
                        <p
                          className="text-xs mt-0.5 leading-tight"
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                          {description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Full name */}
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Soham Koli"
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--primary))')}
                  onBlur={(e) => (e.target.style.borderColor = 'hsl(var(--border))')}
                />
              </motion.div>

              {/* Email */}
              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
                <label
                  className="block text-sm font-medium mb-1.5"
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
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--primary))')}
                  onBlur={(e) => (e.target.style.borderColor = 'hsl(var(--border))')}
                />
              </motion.div>

              {/* Phone */}
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  Phone number{' '}
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>(optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  autoComplete="tel"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--primary))')}
                  onBlur={(e) => (e.target.style.borderColor = 'hsl(var(--border))')}
                />
              </motion.div>

              {/* Password */}
              <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
                <label
                  className="block text-sm font-medium mb-1.5"
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
                    minLength={6}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle}
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

              {/* Submit */}
              <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
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
                      Creating account...
                    </span>
                  ) : (
                    'Create account'
                  )}
                </button>
              </motion.div>
            </form>
                  <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />
    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>or</span>
    <div className="flex-1 h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />
  </div>
  <GoogleAuthButton label="Sign up with Google" disabled={loading} />
</motion.div>
            <motion.p
              custom={7} variants={fadeUp} initial="hidden" animate="visible"
              className="text-center text-sm mt-5"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold"
                style={{ color: 'hsl(var(--primary))' }}
              >
                Sign in
              </Link>
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;