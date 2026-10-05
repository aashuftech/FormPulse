import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/primitives/Input';
import { Button } from '@/components/primitives/Button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate(ROUTES.DASHBOARD);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to log in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="font-display text-2xl font-bold text-white">Log In to FormPulse</h2>
        <p className="font-sans text-sm text-gray-300">
          Enter your email to continue your training sessions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-center font-sans text-sm text-red-400">{error}</p>}
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          startIcon={<Mail className="h-4 w-4" />}
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          startIcon={<Lock className="h-4 w-4" />}
          required
        />

        <div className="flex items-center justify-between font-sans text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-brand-teal/40 bg-brand-dark text-brand-cyan focus:ring-0"
            />
            <span className="text-gray-300">Remember me</span>
          </label>
          <a href="#reset" className="text-brand-cyan hover:underline">
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-2 w-full font-sans text-sm font-semibold"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Log In
        </Button>
      </form>

      <div className="border-t border-brand-teal/20 pt-4 text-center font-sans text-sm text-gray-400">
        <span>Don't have an account? </span>
        <Link to={ROUTES.REGISTER} className="font-semibold text-brand-cyan hover:underline">
          Create an Account
        </Link>
      </div>
    </div>
  );
}
