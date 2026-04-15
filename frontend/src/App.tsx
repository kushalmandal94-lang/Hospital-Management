import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import DoctorsPage from './pages/DoctorsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import EMRPage from './pages/EMRPage';
import BillingPage from './pages/BillingPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import EmergencyAdminPage from './pages/EmergencyAdminPage';
import VideoConsultationPage from './pages/VideoConsultationPage';
import EmergencyAmbulanceWidget from './components/EmergencyAmbulanceWidget';

export default function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <Router>
      <Toaster position="top-right" />
      <EmergencyAmbulanceWidget />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />
        <Route
          path="/signup"
          element={token ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
              <PatientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <DoctorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video-consultation"
          element={
            <ProtectedRoute>
              <VideoConsultationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emr"
          element={
            <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'patient']}>
              <EMRPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute requiredRoles={['admin', 'accountant', 'patient', 'receptionist']}>
              <BillingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emergency-admin"
          element={
            <ProtectedRoute requiredRoles={['admin', 'receptionist']}>
              <EmergencyAdminPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
