import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/primitives/Button';
import { authApi } from '@/services/authApi';
import { ROUTES } from '@/lib/constants';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const started = useRef(false);
  const [message, setMessage] = useState('Verifying your email…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = searchParams.get('token');
    navigate(ROUTES.VERIFY_EMAIL, { replace: true });
    if (!token) {
      setMessage('This verification link is missing or invalid.');
      setFailed(true);
      return;
    }
    void authApi
      .verifyEmail(token)
      .then(() => setMessage('Your email is verified. You can now log in.'))
      .catch(() => {
        setMessage('This verification link is invalid, expired, or already used.');
        setFailed(true);
      });
  }, [navigate, searchParams]);

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl font-bold text-white">Email Verification</h2>
        <p className={`font-sans text-sm ${failed ? 'text-red-400' : 'text-gray-300'}`}>
          {message}
        </p>
      </div>
      <Link to={ROUTES.LOGIN}>
        <Button variant="primary" size="lg" className="w-full font-sans text-sm font-semibold">
          Continue to Log In
        </Button>
      </Link>
    </div>
  );
}
