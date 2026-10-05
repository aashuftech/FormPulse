import { Link } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { ROUTES } from '@/lib/constants';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-6 bg-brand-black p-6 text-center font-sans">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-teal/40 bg-brand-dark shadow-sm">
        <HelpCircle className="h-8 w-8 text-brand-cyan" />
      </div>

      <div className="max-w-md space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-cyan">
          Page Not Found
        </div>
        <h1 className="font-display text-3xl font-bold text-brand-white">
          This Page Does Not Exist
        </h1>
        <p className="text-sm text-gray-400">
          The page you are looking for may have been moved or is no longer available.
        </p>
      </div>

      <div className="flex gap-4">
        <Link to={ROUTES.DASHBOARD}>
          <Button size="md" variant="primary" leftIcon={<Home className="h-4 w-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
