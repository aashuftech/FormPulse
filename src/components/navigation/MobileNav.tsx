import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlayCircle, BookOpen, TrendingUp, User } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const links = [
    { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Workout', path: ROUTES.WORKOUT, icon: PlayCircle },
    { name: 'Exercises', path: ROUTES.EXERCISES, icon: BookOpen },
    { name: 'Progress', path: ROUTES.PROGRESS, icon: TrendingUp },
    { name: 'Profile', path: ROUTES.PROFILE, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-brand-teal/20 bg-brand-black/95 px-2 backdrop-blur-lg lg:hidden">
      {links.map(link => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              cn(
                'flex w-16 flex-col items-center justify-center gap-1 py-1 font-sans text-xs font-medium transition-colors',
                isActive ? 'font-semibold text-brand-cyan' : 'text-gray-400 hover:text-brand-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-5 w-5', isActive && 'text-brand-cyan')} />
                <span>{link.name}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
