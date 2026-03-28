import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// allowedRoles: array e.g. ['patient'] or ['pharmacy_staff', 'admin']
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useSelector((state) => state.auth);

  // No token at all — send to login
  if (!token) return <Navigate to="/login" replace />;

  // Token exists but user not loaded yet — show nothing briefly
  if (!user) return null;

  // Role not allowed — send to their own portal
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'pharmacy_staff') return <Navigate to="/pharmacy" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;