import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useSelector((state) => state.auth);

  if (!token) return <Navigate to="/login" replace />;

  // Token exists but user not loaded yet — show spinner instead of blank
  if (!user || loading) {
    return (
      <div
        className="min-h-screen min-h-dvh flex items-center justify-center"
        style={{ backgroundColor: 'hsl(var(--background))' }}
      >
        <Loader2
          className="w-6 h-6 animate-spin"
          style={{ color: 'hsl(var(--primary))' }}
        />
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'pharmacy_staff') return <Navigate to="/pharmacy" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;