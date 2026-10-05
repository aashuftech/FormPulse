import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlayCircle,
  BookOpen,
  History,
  TrendingUp,
  Trophy,
  User,
  Settings,
  Activity,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface NavItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Start Workout', path: ROUTES.WORKOUT, icon: PlayCircle },
  { name: 'Exercises', path: ROUTES.EXERCISES, icon: BookOpen },
  { name: 'Workout History', path: ROUTES.HISTORY, icon: History },
  { name: 'My Progress', path: ROUTES.PROGRESS, icon: TrendingUp },
  { name: 'Challenges', path: ROUTES.CHALLENGES, icon: Trophy },
  { name: 'Profile', path: ROUTES.PROFILE, icon: User },
  { name: 'Settings', path: ROUTES.SETTINGS, icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-brand-teal/20 bg-brand-black lg:flex',
        className,
      )}
    >
      {/* Brand Header */}
      <Link
        to={ROUTES.HOME}
        className="group flex h-16 items-center gap-3 border-b border-brand-teal/20 px-6 transition-colors hover:bg-brand-dark/20"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-cyan/40 bg-brand-dark transition-colors group-hover:border-brand-cyan">
          <Activity className="h-5 w-5 text-brand-cyan" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-base font-bold text-brand-white">FormPulse</span>
          <span className="font-sans text-xs text-gray-400">AI Fitness Coach</span>
        </div>
      </Link>

      {/* Today's Progress Card */}
      <div className="mx-3 my-4 rounded-xl border border-brand-teal/25 bg-brand-dark/30 p-4">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs font-medium text-gray-300">Today's Progress</span>
          <span className="font-display text-sm font-bold text-brand-cyan">92%</span>
        </div>
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full border border-brand-teal/20 bg-brand-black">
          <div className="h-full w-[92%] rounded-full bg-brand-cyan" />
        </div>
        <p className="mt-2 text-[11px] text-gray-400">3 of 4 weekly targets completed</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-1">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between rounded-lg px-3.5 py-2.5 font-sans text-sm font-medium transition-colors',
                  isActive
                    ? 'border border-brand-cyan/40 bg-brand-dark/70 font-semibold text-brand-white'
                    : 'border border-transparent text-gray-400 hover:bg-brand-dark/30 hover:text-brand-white',
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive ? 'text-brand-cyan' : 'text-gray-400 group-hover:text-brand-cyan',
                    )}
                  />
                  <span>{item.name}</span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User Profile summary */}
      <div className="flex items-center justify-between border-t border-brand-teal/20 bg-brand-dark/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-teal/50 bg-brand-dark text-xs font-bold text-brand-cyan">
            MV
          </div>
          <div>
            <p className="text-sm font-medium leading-tight text-brand-white">Marcus Vance</p>
            <p className="font-sans text-xs text-gray-400">Active Member</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400">
          <Flame className="h-4 w-4" />
          <span className="text-xs font-semibold">14d</span>
        </div>
      </div>
    </aside>
  );
}
