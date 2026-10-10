import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Eye,
  LineChart,
  PlayCircle,
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
    <div className="home-hero-visual relative flex aspect-[0.91/1] h-full w-full flex-col overflow-hidden rounded-[22px] border border-[#102d32] bg-[#050b0d] p-[14px] shadow-[0_18px_60px_rgba(0,0,0,0.18)] lg:aspect-auto">
      <div className="flex h-[14px] shrink-0 items-center justify-between text-[10px] leading-[14px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-gray-500" />
          Live camera
        </span>
        <span>Squat</span>
      </div>

      <div className="home-pose-grid relative mt-[5px] min-h-0 flex-1 overflow-hidden rounded-[15px] border border-[#102d32]">
        <svg
          aria-label="Illustrative squat pose landmarks"
          className="absolute inset-0 h-full w-full"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          viewBox="0 0 366 388"
        >
          <g stroke="#22cabb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5">
            <path d="M162 99 205 137 250 128" />
            <path d="M162 99 130 215 216 252 173 349" />
          </g>
          <path
            d="M190 245 A29 29 0 0 0 200 221"
            fill="none"
            stroke="#ffbf43"
            strokeLinecap="round"
            strokeWidth="3.5"
          />
          <g fill="#071114" stroke="#55e0ed" strokeWidth="3">
            <circle cx="162" cy="59" r="24" />
            <circle cx="162" cy="99" r="8" />
            <circle cx="205" cy="137" r="8" />
            <circle cx="250" cy="128" r="8" />
            <circle cx="130" cy="215" r="8" />
            <circle cx="216" cy="252" r="9" />
            <circle cx="173" cy="349" r="9" />
          </g>
        </svg>
        <div className="absolute right-3 top-3 rounded-[10px] border border-[#164148] bg-[#071114]/95 px-[10px] py-[7px]">
          <p className="text-[9px] leading-3 text-gray-500">Form</p>
          <p className="text-[13px] font-semibold leading-[17px] text-[#55e0c7]">Good depth</p>
        </div>
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
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-10">
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
          <div className="h-full" data-reveal>
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
