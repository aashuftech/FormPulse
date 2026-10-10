import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, PlayCircle } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

export function Navbar({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case ROUTES.DASHBOARD:
        return 'Dashboard';
      case ROUTES.WORKOUT:
        return 'Workout Session';
      case ROUTES.EXERCISES:
        return 'Exercises';
      case ROUTES.HISTORY:
        return 'Workout History';
      case ROUTES.PROGRESS:
        return 'My Progress';
      case ROUTES.CHALLENGES:
        return 'Challenges';
      case ROUTES.PROFILE:
        return 'Profile';
      case ROUTES.SETTINGS:
        return 'Settings';
      default:
        return 'FormPulse';
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-brand-teal/20 bg-brand-black/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-4">
        {onMobileMenuToggle && (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="p-2 text-gray-400 hover:text-white focus:outline-none lg:hidden"
            aria-label="Toggle Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-brand-cyan" />
          <span className="font-display text-base font-bold leading-tight tracking-normal text-brand-white">
            {getPageTitle(location.pathname)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link to={ROUTES.WORKOUT}>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<PlayCircle className="h-4 w-4" />}
            className="hidden sm:inline-flex"
          >
            Start Workout
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
          Log Out
        </Button>

        {/* Notifications Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative rounded-lg border border-brand-teal/25 p-2 text-gray-400 hover:bg-brand-dark/50 hover:text-white"
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
            aria-controls="notifications-panel"
          >
            <Bell className="h-4 w-4" />
          </button>

          {isNotificationsOpen && (
            <div
              id="notifications-panel"
              className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-brand-teal/30 bg-brand-dark p-4 text-xs shadow-card"
            >
              <div className="flex items-center justify-between border-b border-brand-teal/20 pb-2.5">
                <span className="font-display text-sm font-bold leading-tight tracking-normal text-white">
                  Notifications
                </span>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="py-4 text-center text-xs text-gray-400">No notifications yet.</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
