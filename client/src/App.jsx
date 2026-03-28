import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { fetchMe } from './features/auth/authSlice';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import SearchPage from './pages/patient/SearchPage';
import DashboardPage from './pages/pharmacy/DashboardPage';
import AdminPage from './pages/admin/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  // On app load, if token exists re-fetch user profile
  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Patient portal */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <SearchPage />
            </ProtectedRoute>
          }
        />

        {/* Pharmacy portal */}
        <Route
          path="/pharmacy"
          element={
            <ProtectedRoute allowedRoles={['pharmacy_staff']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin portal */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;