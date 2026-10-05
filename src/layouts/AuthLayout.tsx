import { Outlet, Link } from 'react-router-dom';
import { Activity, ShieldCheck, Lock } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-brand-black py-12 font-sans sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-teal/10 blur-3xl" />

      {/* Brand Header */}
      <div className="z-10 text-center sm:mx-auto sm:w-full sm:max-w-md">
        <Link to={ROUTES.HOME} className="group inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-cyan/40 bg-brand-dark transition-colors group-hover:border-brand-cyan">
            <Activity className="h-5 w-5 text-brand-cyan" />
          </div>
          <span className="font-display text-2xl font-bold text-brand-white">FormPulse</span>
        </Link>
        <p className="mt-2 font-sans text-sm text-gray-300">
          AI Fitness Coach & Real-Time Form Tracker
        </p>
      </div>

      {/* Auth Content Card Slot */}
      <div className="z-10 mt-8 px-4 sm:mx-auto sm:w-full sm:max-w-md sm:px-0">
        <div className="rounded-2xl border border-brand-teal/30 bg-brand-dark/30 px-6 py-8 shadow-card backdrop-blur-md sm:px-10">
          <Outlet />
        </div>

        {/* Footnote */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-brand-cyan" />
            Secure & Private
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-cyan" />
            On-Device Processing
          </span>
        </div>
      </div>
    </div>
  );
}
