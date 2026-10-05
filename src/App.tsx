import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { WorkoutProvider } from '@/context/WorkoutContext';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  DashboardPage,
  WorkoutPage,
  ExercisesPage,
  HistoryPage,
  ProgressPage,
  ChallengesPage,
  ProfilePage,
  SettingsPage,
  NotFoundPage,
} from '@/pages';
import { ROUTES } from '@/lib/constants';

export function App() {
  return (
    <AuthProvider>
      <WorkoutProvider>
        <Routes>
          {/* Public Landing Route */}
          <Route element={<PublicLayout />}>
            <Route path={ROUTES.HOME} element={<HomePage />} />
          </Route>

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          </Route>

          {/* Main Authenticated Dashboard Shell */}
          <Route element={<AppLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.WORKOUT} element={<WorkoutPage />} />
            <Route path={ROUTES.EXERCISES} element={<ExercisesPage />} />
            <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
            <Route path={ROUTES.PROGRESS} element={<ProgressPage />} />
            <Route path={ROUTES.CHALLENGES} element={<ChallengesPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </WorkoutProvider>
    </AuthProvider>
  );
}

export default App;
