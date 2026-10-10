import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Eye,
  LineChart,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/primitives/Button';
import { Card } from '@/components/primitives/Card';
import { Badge } from '@/components/primitives/Badge';
import { ROUTES } from '@/lib/constants';

function PosePreview() {
  return (
    <div className="home-hero-visual bg-subtle-grid relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-brand-teal/40 bg-brand-black p-4 shadow-[0_30px_100px_rgba(19,51,54,0.45)] sm:p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-transparent" />
      <div className="relative flex items-center justify-between gap-3 border-b border-brand-teal/30 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-cyan/30 bg-brand-dark/80 text-brand-cyan">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-white">Pose analysis preview</p>
            <p className="mt-0.5 text-xs text-gray-400">Illustrative pose overlay</p>
          </div>
        </div>
        <Badge variant="outline">On-device</Badge>
      </div>

      <div className="relative mt-4 grid min-h-[300px] place-items-center overflow-hidden rounded-2xl border border-brand-teal/25 bg-brand-black/75 sm:min-h-[360px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(54,125,138,0.14),transparent_65%)]" />
        <svg
          aria-label="Illustration of a pose landmark skeleton"
          className="relative h-[270px] w-full max-w-[300px] drop-shadow-[0_0_18px_rgba(54,125,138,0.45)] sm:h-[320px]"
          fill="none"
          role="img"
          viewBox="0 0 240 300"
        >
          <g stroke="#55c2d0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4">
            <path d="M119 53 103 105 81 139 59 176 44 229" />
            <path d="m103 105 30 35 37 16 33 22 10 48" />
            <path d="m103 105 43 1 26 31 28 19" />
            <path d="m81 139 36 22 24 33 26 35" />
            <path d="m117 161-35 17-28 21" />
            <path d="m117 161 42 3 26 23" />
            <path d="M113 46c0-12 7-20 17-20s17 8 17 20-7 20-17 20-17-8-17-20Z" />
          </g>
          <g fill="#b8f3f3" stroke="#367d8a" strokeWidth="3">
            <circle cx="130" cy="46" r="8" />
            <circle cx="103" cy="105" r="7" />
            <circle cx="81" cy="139" r="7" />
            <circle cx="59" cy="176" r="7" />
            <circle cx="44" cy="229" r="7" />
            <circle cx="133" cy="140" r="7" />
            <circle cx="170" cy="156" r="7" />
            <circle cx="203" cy="173" r="7" />
            <circle cx="146" cy="106" r="7" />
            <circle cx="172" cy="137" r="7" />
            <circle cx="200" cy="155" r="7" />
            <circle cx="117" cy="161" r="7" />
            <circle cx="141" cy="194" r="7" />
            <circle cx="167" cy="229" r="7" />
            <circle cx="82" cy="178" r="7" />
            <circle cx="54" cy="199" r="7" />
            <circle cx="159" cy="164" r="7" />
            <circle cx="185" cy="187" r="7" />
            <circle cx="209" cy="235" r="7" />
          </g>
        </svg>
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-teal/30 bg-brand-dark/90 px-4 py-3 text-xs backdrop-blur">
          <span className="flex items-center gap-2 text-gray-200">
            <span className="h-2 w-2 rounded-full bg-brand-cyan" />
            MediaPipe pose landmarks
          </span>
          <span className="text-brand-cyan">Processed in your browser</span>
        </div>
      </div>
      <div className="relative mt-3 flex items-center gap-2 px-1 text-xs text-gray-400">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-cyan" />
        Camera frames stay on your device
      </div>
    </div>
  );
}

export function HomePage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const elements = root.querySelectorAll<HTMLElement>('[data-reveal]');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(element => element.classList.add('is-visible'));
      return;
    }

    if (!('IntersectionObserver' in window)) {
      elements.forEach(element => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' },
    );

    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={pageRef}
      className="relative min-h-screen overflow-hidden bg-brand-black font-sans text-brand-white"
    >
      <section className="relative border-b border-brand-teal/20 px-4 pb-20 pt-14 sm:px-6 md:pb-28 md:pt-20 lg:px-8">
        <div className="pointer-events-none absolute left-1/4 top-1/4 h-[420px] w-[420px] rounded-full bg-brand-teal/10 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="space-y-7 text-center lg:text-left" data-reveal>
            <Badge variant="outline">
              <span className="mr-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-brand-cyan" />
              Real-time pose analysis
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.25rem]">
              Workout tracking, <span className="text-brand-cyan">meet real-time</span> form
              feedback.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg lg:mx-0">
              Train with your camera and get clear guidance as you move. FormPulse detects your pose
              on-device, counts exercise reps, and keeps your workout progress in one place.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
              <Link to={ROUTES.DASHBOARD}>
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Start Training Free
                </Button>
              </Link>
              <Link to={ROUTES.EXERCISES}>
                <Button size="lg" variant="outline">
                  Explore Exercises
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-3 text-xs text-gray-400 sm:text-sm lg:justify-start">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-cyan" /> No wearable needed
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-cyan" /> Works in your browser
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-cyan" /> On-device processing
              </span>
            </div>
          </div>
          <div data-reveal>
            <PosePreview />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-12 px-4 py-20 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-3 text-center" data-reveal>
          <Badge variant="outline">Built for your workouts</Badge>
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Real-time tools. Your progress.
          </h2>
          <p className="text-sm leading-relaxed text-gray-400 sm:text-base">
            FormPulse brings movement tracking and workout history together without inventing stats
            or recommendations.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger>
          <Card
            data-reveal
            className="border-brand-teal/25 bg-brand-dark/25 transition duration-300 hover:-translate-y-1 hover:border-brand-cyan/50 hover:shadow-[0_16px_50px_rgba(54,125,138,0.12)]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-teal/30 bg-brand-teal/20 text-brand-cyan">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-display text-lg font-bold text-white">Pose detection</h3>
            <p className="text-sm leading-relaxed text-gray-400">
              MediaPipe reads body landmarks in your browser during supported exercises.
            </p>
          </Card>
          <Card
            data-reveal
            className="border-brand-teal/25 bg-brand-dark/25 transition duration-300 hover:-translate-y-1 hover:border-brand-cyan/50 hover:shadow-[0_16px_50px_rgba(54,125,138,0.12)]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-teal/30 bg-brand-teal/20 text-brand-cyan">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-display text-lg font-bold text-white">
              Automatic rep counting
            </h3>
            <p className="text-sm leading-relaxed text-gray-400">
              Exercise detectors track completed repetitions for supported movements.
            </p>
          </Card>
          <Card
            data-reveal
            className="border-brand-teal/25 bg-brand-dark/25 transition duration-300 hover:-translate-y-1 hover:border-brand-cyan/50 hover:shadow-[0_16px_50px_rgba(54,125,138,0.12)]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-teal/30 bg-brand-teal/20 text-brand-cyan">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-display text-lg font-bold text-white">
              Real-time form feedback
            </h3>
            <p className="text-sm leading-relaxed text-gray-400">
              Get visual cues and optional browser voice guidance from exercise feedback.
            </p>
          </Card>
          <Card
            data-reveal
            className="border-brand-teal/25 bg-brand-dark/25 transition duration-300 hover:-translate-y-1 hover:border-brand-cyan/50 hover:shadow-[0_16px_50px_rgba(54,125,138,0.12)]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-teal/30 bg-brand-teal/20 text-brand-cyan">
              <LineChart className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-display text-lg font-bold text-white">Workout progress</h3>
            <p className="text-sm leading-relaxed text-gray-400">
              Review your saved workout history and progress from your account.
            </p>
          </Card>
        </div>
      </section>

      <section className="border-y border-brand-teal/20 bg-brand-dark/20 py-20 md:py-24">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-3 text-center" data-reveal>
            <Badge variant="cyan">Three simple steps</Badge>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              How FormPulse works
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              Use your browser and camera to follow a workout from start to finish.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3" data-stagger>
            <Card
              data-reveal
              className="border-brand-teal/25 bg-brand-dark/35 transition duration-300 hover:-translate-y-1 hover:border-brand-cyan/50"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-cyan font-display text-lg font-bold text-brand-black">
                <Dumbbell className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-white">Choose an exercise</h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Start a workout and select one of the supported movements.
              </p>
            </Card>
            <Card
              data-reveal
              className="border-brand-teal/25 bg-brand-dark/35 transition duration-300 hover:-translate-y-1 hover:border-brand-cyan/50"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-cyan font-display text-lg font-bold text-brand-black">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-white">Set up your camera</h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Allow camera access and position yourself so your body is in view.
              </p>
            </Card>
            <Card
              data-reveal
              className="border-brand-teal/25 bg-brand-dark/35 transition duration-300 hover:-translate-y-1 hover:border-brand-cyan/50"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-cyan font-display text-lg font-bold text-brand-black">
                <Clock3 className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-white">Train and track</h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Follow live form cues, complete your sets, and revisit saved progress.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 md:py-28 lg:px-8"
        data-reveal
      >
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-cyan/40 bg-brand-dark text-brand-cyan">
          <PlayCircle className="h-7 w-7" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Start Training with Real-Time Form Feedback Today
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-300">
          Choose a supported exercise, follow on-screen guidance, and keep your completed workouts
          together in FormPulse.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={ROUTES.DASHBOARD}>
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Start Training Free
            </Button>
          </Link>
          <Link to={ROUTES.EXERCISES}>
            <Button size="lg" variant="outline">
              Explore Exercises
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
