import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchMe } from '../../features/auth/authSlice';
import { Loader2, Pill } from 'lucide-react';

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const role = params.get('role');
    const error = params.get('error');

    if (error || !token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    localStorage.setItem('token', token);

    dispatch(fetchMe()).then((action) => {
      // Navigate based on role from URL param (user object may lag)
      const userRole = action?.payload?.user?.role || role;
      if (userRole === 'pharmacy_staff') {
        navigate('/pharmacy', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    });
  }, []);

  return (
    <div
      className="min-h-screen min-h-dvh flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: 'hsl(var(--background))' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2"
        style={{ backgroundColor: 'hsl(var(--primary))' }}
      >
        <Pill className="w-6 h-6 text-white" />
      </div>
      <Loader2
        className="w-6 h-6 animate-spin"
        style={{ color: 'hsl(var(--primary))' }}
      />
      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Signing you in...
      </p>
    </div>
  );
};

export default OAuthCallbackPage;