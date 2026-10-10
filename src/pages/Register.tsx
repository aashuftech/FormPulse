import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Input } from '@/components/primitives/Input';
import { Button } from '@/components/primitives/Button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [goal, setGoal] = useState<'Build Muscle' | 'Build Strength' | 'Increase Endurance'>(
    'Build Muscle',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const { register } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await register(name, email, password, goal);
      setRegistered(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="font-display text-2xl font-bold text-white">
          {registered ? 'Check Your Email' : 'Create Your Account'}
        </h2>
        <p className="font-sans text-sm text-gray-300">
          {registered
            ? `We sent a verification link to ${email}. Verify your email before logging in.`
            : 'Start your real-time AI workout coaching journey'}
        </p>
      </div>

      {!registered && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-center font-sans text-sm text-red-400">{error}</p>}
          <Input
            label="Your Full Name"
            type="text"
            placeholder="e.g. Marcus Vance"
            value={name}
            onChange={e => setName(e.target.value)}
            startIcon={<User className="h-4 w-4" />}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="athlete@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            startIcon={<Mail className="h-4 w-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="12+ characters with upper/lowercase, number and symbol"
            value={password}
            onChange={e => setPassword(e.target.value)}
            startIcon={<Lock className="h-4 w-4" />}
            required
          />

          {/* Primary Fitness Goal */}
          <div className="space-y-2">
            <label className="block font-sans text-sm font-medium text-gray-200">
              Primary Fitness Goal
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['Build Muscle', 'Build Strength', 'Increase Endurance'] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={`rounded-lg border px-2 py-2 text-center font-sans text-xs font-medium transition-colors sm:text-sm ${
                    goal === g
                      ? 'border-brand-cyan bg-brand-dark font-semibold text-brand-cyan shadow-sm'
                      : 'border-brand-teal/30 bg-brand-black/50 text-gray-300 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="mt-3 w-full font-sans text-sm font-semibold"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Create Account
          </Button>
        </form>
      )}

      <div className="border-t border-brand-teal/20 pt-4 text-center font-sans text-sm text-gray-400">
        <span>{registered ? 'Verified your email? ' : 'Already have an account? '}</span>
        <Link to={ROUTES.LOGIN} className="font-semibold text-brand-cyan hover:underline">
          Log In
        </Link>
      </div>
    </div>
  );
}
