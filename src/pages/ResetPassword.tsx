import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { ROUTES } from '@/lib/constants';
import { authApi } from '@/services/authApi';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      setMessage(await authApi.resetPassword(token, password));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="font-display text-2xl font-bold text-white">Choose a New Password</h2>
        <p className="font-sans text-sm text-gray-300">
          Use at least 12 characters with uppercase and lowercase letters, a number and a symbol.
        </p>
      </div>
      {token ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && <p className="text-center font-sans text-sm text-gray-300">{message}</p>}
          {error && <p className="text-center font-sans text-sm text-red-400">{error}</p>}
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            startIcon={<Lock className="h-4 w-4" />}
            minLength={12}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmation}
            onChange={event => setConfirmation(event.target.value)}
            startIcon={<Lock className="h-4 w-4" />}
            minLength={12}
            required
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-sans text-sm font-semibold"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Update Password
          </Button>
        </form>
      ) : (
        <p className="text-center font-sans text-sm text-red-400">
          This password reset link is missing or invalid.
        </p>
      )}
      <div className="border-t border-brand-teal/20 pt-4 text-center font-sans text-sm">
        <Link to={ROUTES.LOGIN} className="font-semibold text-brand-cyan hover:underline">
          Return to Log In
        </Link>
      </div>
    </div>
  );
}
