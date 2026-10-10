import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { ROUTES } from '@/lib/constants';
import { authApi } from '@/services/authApi';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      setMessage(await authApi.forgotPassword(email));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to request a reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="font-display text-2xl font-bold text-white">Reset Your Password</h2>
        <p className="font-sans text-sm text-gray-300">
          Enter your email and we’ll send a password reset link if an account exists.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && <p className="text-center font-sans text-sm text-gray-300">{message}</p>}
        {error && <p className="text-center font-sans text-sm text-red-400">{error}</p>}
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          startIcon={<Mail className="h-4 w-4" />}
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
          Send Reset Link
        </Button>
      </form>
      <div className="border-t border-brand-teal/20 pt-4 text-center font-sans text-sm">
        <Link to={ROUTES.LOGIN} className="font-semibold text-brand-cyan hover:underline">
          Return to Log In
        </Link>
      </div>
    </div>
  );
}
