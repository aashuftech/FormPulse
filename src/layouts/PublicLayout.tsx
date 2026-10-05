import { Outlet, Link } from 'react-router-dom';
import { Activity, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { ROUTES } from '@/lib/constants';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-black font-sans text-brand-white selection:bg-brand-cyan/20 selection:text-brand-white">
      {/* 1. Navbar */}
      <header className="sticky top-0 z-50 h-20 border-b border-brand-teal/20 bg-brand-black/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to={ROUTES.HOME} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-cyan/40 bg-brand-dark">
              <Activity className="h-5 w-5 text-brand-cyan" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold text-brand-white">FormPulse</span>
              <span className="font-sans text-xs text-gray-400">AI Fitness Coach</span>
            </div>
          </Link>

          <div className="hidden items-center gap-8 font-sans text-sm text-gray-300 md:flex">
            <Link to={ROUTES.EXERCISES} className="transition-colors hover:text-brand-cyan">
              Exercises
            </Link>
            <Link to={ROUTES.CHALLENGES} className="transition-colors hover:text-brand-cyan">
              Challenges
            </Link>
            <Link to={ROUTES.DASHBOARD} className="transition-colors hover:text-brand-cyan">
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 12. Footer */}
      <footer className="border-t border-brand-teal/20 bg-brand-dark/20 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row lg:px-8">
          <Link
            to={ROUTES.HOME}
            className="group flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-teal/40 bg-brand-dark text-brand-cyan transition-colors group-hover:border-brand-cyan">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-semibold text-brand-white">
              FormPulse © 2026
            </span>
          </Link>

          <div className="flex items-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand-cyan" />
              Private On-Device Analysis
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-brand-cyan" />
              Real-Time Feedback
            </span>
          </div>

          <div className="flex gap-6 text-sm text-gray-400">
            <Link to={ROUTES.DASHBOARD} className="transition-colors hover:text-brand-cyan">
              Dashboard
            </Link>
            <Link to={ROUTES.EXERCISES} className="transition-colors hover:text-brand-cyan">
              Exercises
            </Link>
            <Link to={ROUTES.SETTINGS} className="transition-colors hover:text-brand-cyan">
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
