import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

import { lazy, Suspense } from 'react';
const SplashScreen = lazy(() => import('@/pages/SplashScreen').then(m => ({ default: m.SplashScreen })));

// Auth
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage';
import SelectUniversityPage from '@/pages/auth/SelectUniversityPage';
import TwoFactorVerifyPage from '@/pages/auth/TwoFactorVerifyPage';

// Dashboard
import { DashboardPage } from '@/pages/dashboard/DashboardPage';

// Students
import { StudentsListPage } from '@/pages/students/StudentsListPage';
import { StudentDetailPage } from '@/pages/students/StudentDetailPage';
import { StudentFormPage } from '@/pages/students/StudentFormPage';

// Teachers
import { TeachersListPage } from '@/pages/teachers/TeachersListPage';
import { TeacherDetailPage } from '@/pages/teachers/TeacherDetailPage';
import { TeacherFormPage } from '@/pages/teachers/TeacherFormPage';

// Rooms
import { RoomsListPage } from '@/pages/rooms/RoomsListPage';
import { RoomDetailPage } from '@/pages/rooms/RoomDetailPage';
import { RoomFormPage } from '@/pages/rooms/RoomFormPage';

// Courses
import { CoursesListPage } from '@/pages/courses/CoursesListPage';
import { CourseDetailPage } from '@/pages/courses/CourseDetailPage';
import { CourseFormPage } from '@/pages/courses/CourseFormPage';

// Schedule
import { SchedulePage } from '@/pages/schedule/SchedulePage';
import { SessionFormPage } from '@/pages/schedule/SessionFormPage';

// RFID
import { RfidAccessPage } from '@/pages/rfid/RfidAccessPage';
import { RfidEventDetailPage } from '@/pages/rfid/RfidEventDetailPage';
import RfidAssignPage from '@/pages/rfid/RfidAssignPage';

// Temporary Codes (lazy)
const TemporaryCodesPage = lazy(() => import('@/pages/temporary-codes/TemporaryCodesPage'));

// Filieres
import FilieresListPage from '@/pages/filieres/FilieresListPage';
import FiliereFormPage from '@/pages/filieres/FiliereFormPage';
import BulkUpdatePage from '@/pages/filieres/BulkUpdatePage';
import FiliereDetailPage from '@/pages/filieres/FiliereDetailPage';

// Student directory
import { StudentDirectoryPage } from '@/pages/students/StudentDirectoryPage';

// Stats & Reports
import { StatsPage } from '@/pages/stats/StatsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';

// Config & Profile
import { ConfigPage } from '@/pages/config/ConfigPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { ChangePasswordPage } from '@/pages/profile/ChangePasswordPage';
import TwoFactorSetupPage from '@/pages/profile/TwoFactorSetupPage';

// Errors
import { NotFoundPage } from '@/pages/errors/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/splash" replace />,
  },
  {
    path: '/splash',
    element: (
      <Suspense fallback={
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0B1120, #0F172A, #1E1B4B)' }}>
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      }>
        <SplashScreen />
      </Suspense>
    ),
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/verify-2fa', element: <TwoFactorVerifyPage /> },
    ],
  },
  { path: '/auth/oauth/callback', element: <OAuthCallbackPage /> },
  { path: '/setup/university', element: <SelectUniversityPage /> },
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },

      { path: '/students', element: <StudentsListPage /> },
      { path: '/students/new', element: <StudentFormPage /> },
      { path: '/students/directory', element: <StudentDirectoryPage /> },
      { path: '/students/:id', element: <StudentDetailPage /> },
      { path: '/students/:id/edit', element: <StudentFormPage /> },

      { path: '/teachers', element: <TeachersListPage /> },
      { path: '/teachers/new', element: <TeacherFormPage /> },
      { path: '/teachers/:id', element: <TeacherDetailPage /> },
      { path: '/teachers/:id/edit', element: <TeacherFormPage /> },

      { path: '/rooms', element: <RoomsListPage /> },
      { path: '/rooms/new', element: <RoomFormPage /> },
      { path: '/rooms/:id', element: <RoomDetailPage /> },
      { path: '/rooms/:id/edit', element: <RoomFormPage /> },

      { path: '/courses', element: <CoursesListPage /> },
      { path: '/courses/new', element: <CourseFormPage /> },
      { path: '/courses/:id', element: <CourseDetailPage /> },
      { path: '/courses/:id/edit', element: <CourseFormPage /> },

      { path: '/schedule', element: <SchedulePage /> },
      { path: '/schedule/sessions/new', element: <SessionFormPage /> },
      { path: '/schedule/sessions/:id/edit', element: <SessionFormPage /> },

      { path: '/filieres', element: <FilieresListPage /> },
      { path: '/filieres/new', element: <FiliereFormPage /> },
      { path: '/filieres/bulk-update', element: <BulkUpdatePage /> },
      { path: '/filieres/:id', element: <FiliereDetailPage /> },
      { path: '/filieres/:id/edit', element: <FiliereFormPage /> },

      { path: '/rfid-access', element: <RfidAccessPage /> },
      { path: '/rfid-access/:id', element: <RfidEventDetailPage /> },
      { path: '/rfid-assign', element: <RfidAssignPage /> },
      { path: '/temporary-codes', element: <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>}><TemporaryCodesPage /></Suspense> },

      { path: '/statistics', element: <StatsPage /> },
      { path: '/reports', element: <ReportsPage /> },

      { path: '/configuration', element: <ConfigPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/profile/change-password', element: <ChangePasswordPage /> },
      { path: '/profile/2fa', element: <TwoFactorSetupPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
