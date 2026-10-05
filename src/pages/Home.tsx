import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Camera,
  CheckCircle2,
  Dumbbell,
  LineChart,
  PlayCircle,
  ShieldCheck,
  Trophy,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Card } from '@/components/primitives/Card';
import { Badge } from '@/components/primitives/Badge';
import { ROUTES } from '@/lib/constants';

export function HomePage() {
  return (
    <div className="relative min-h-screen bg-brand-black font-sans text-brand-white">
      {/* 1. Navbar is provided in PublicLayout */}

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden border-b border-brand-teal/20 pb-20 pt-12 md:pb-28 md:pt-20">
        <div className="pointer-events-none absolute left-1/2 top-1/4 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-teal/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl">
              AI-Powered Workout Tracking & Real-Time Form Analysis
            </h1>

            <p className="mx-auto max-w-2xl font-sans text-base leading-relaxed text-gray-300 sm:text-lg">
              Train with confidence. FormPulse uses your device camera to guide your exercise form,
              count reps automatically, and help you build strength safely.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
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

            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-gray-400 sm:gap-10 sm:text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-cyan" /> No wearable hardware needed
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-cyan" /> Works right in your browser
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-cyan" /> Private on-device analysis
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live AI Analysis Preview */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
          <Badge variant="outline">Live Demonstration Preview</Badge>
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            See Real-Time Guidance in Action
          </h2>
          <p className="text-sm text-gray-400 sm:text-base">
            Instant cues help you maintain proper posture throughout every repetition.
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Visual Camera Simulation Card */}
          <div className="lg:col-span-7">
            <Card className="border border-brand-teal/30 bg-brand-dark/30 p-4 sm:p-6">
              <div className="flex items-center justify-between border-b border-brand-teal/20 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="font-display text-sm font-semibold text-white">
                    Camera Preview Demo — Barbell Squat
                  </span>
                </div>
                <Badge variant="cyan">Demo Mode</Badge>
              </div>

              {/* Viewport Frame */}
              <div className="relative my-4 flex h-72 flex-col items-center justify-center overflow-hidden rounded-xl border border-brand-teal/30 bg-brand-black/90 sm:h-80">
                <div className="space-y-3 p-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-cyan/40 bg-brand-dark/80 text-brand-cyan">
                    <Activity className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-display text-lg font-bold text-white">Rep #6 in Progress</p>
                    <p className="text-sm font-medium text-brand-cyan">
                      Form Quality: 96% — Great depth on this squat!
                    </p>
                  </div>
                </div>

                {/* Bottom Overlay Status */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between rounded-lg border border-brand-teal/20 bg-brand-dark/80 px-3 py-2 text-xs backdrop-blur-md">
                  <span className="text-gray-300">Tempo: 2s down, 1s up</span>
                  <span className="font-semibold text-emerald-400">Back straight & heels down</span>
                </div>
              </div>

              {/* Real-time Guidance Feedback row */}
              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                <div className="flex items-start gap-2.5 rounded-lg border border-brand-teal/20 bg-brand-dark/40 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                  <div>
                    <p className="text-xs font-semibold text-white">Knee Position</p>
                    <p className="mt-0.5 text-xs text-gray-400">Tracking straight over your toes</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-lg border border-brand-teal/20 bg-brand-dark/40 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                  <div>
                    <p className="text-xs font-semibold text-white">Spine Alignment</p>
                    <p className="mt-0.5 text-xs text-gray-400">Chest stays tall and upright</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Explanatory List */}
          <div className="space-y-6 lg:col-span-5">
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold text-white">
                Workout smarter without expensive personal trainers
              </h3>
              <p className="text-sm leading-relaxed text-gray-300">
                Whether you are working out at home or in the gym, FormPulse gives you immediate
                feedback to ensure each exercise is performed with correct form.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-teal/30 bg-brand-teal/20 text-brand-cyan">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display text-base font-semibold text-white">
                    Simple Camera Setup
                  </h4>
                  <p className="mt-1 text-xs text-gray-400">
                    Place your phone or laptop on a flat surface so your body is visible in the
                    frame.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-teal/30 bg-brand-teal/20 text-brand-cyan">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display text-base font-semibold text-white">
                    Automated Rep Counting
                  </h4>
                  <p className="mt-1 text-xs text-gray-400">
                    Focus on lifting. The app automatically detects completed reps and counts them
                    for you.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-teal/30 bg-brand-teal/20 text-brand-cyan">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display text-base font-semibold text-white">
                    Injury Prevention
                  </h4>
                  <p className="mt-1 text-xs text-gray-400">
                    Receive clear audio and visual alerts if your posture deviates from safe
                    movement patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section className="border-y border-brand-teal/20 bg-brand-dark/20 py-20">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <Badge variant="cyan">3 Easy Steps</Badge>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              How FormPulse Works
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              Get started in seconds with just your browser and camera.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border-brand-teal/20 bg-brand-dark/30">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cyan font-display text-lg font-bold text-brand-black">
                1
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-white">
                Choose Your Workout
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Select from ready-made strength routines or pick individual exercises from the
                library.
              </p>
            </Card>

            <Card className="border-brand-teal/20 bg-brand-dark/30">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cyan font-display text-lg font-bold text-brand-black">
                2
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-white">
                Turn On Your Camera
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Position your device a few feet away. FormPulse monitors your form securely on your
                device.
              </p>
            </Card>

            <Card className="border-brand-teal/20 bg-brand-dark/30">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cyan font-display text-lg font-bold text-brand-black">
                3
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-white">
                Receive Feedback & Track
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Get real-time audio and visual cues, celebrate completed sets, and review your
                progress stats.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. FormPulse Capabilities */}
      <section className="mx-auto max-w-7xl space-y-12 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <Badge variant="outline">Core Capabilities</Badge>
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Designed for Serious Fitness Progress
          </h2>
          <p className="text-sm text-gray-400 sm:text-base">
            Everything you need to improve workout consistency, avoid plateaus, and train with
            correct technique.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-brand-teal/20 bg-brand-dark/20">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-teal/20 text-brand-cyan">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="mb-1.5 font-display text-base font-bold text-white">
              Live Form Correction
            </h3>
            <p className="text-xs leading-relaxed text-gray-400">
              Clear prompts tell you exactly when to adjust your back, knees, or chest during a
              lift.
            </p>
          </Card>

          <Card className="border-brand-teal/20 bg-brand-dark/20">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-teal/20 text-brand-cyan">
              <Dumbbell className="h-5 w-5" />
            </div>
            <h3 className="mb-1.5 font-display text-base font-bold text-white">
              Automatic Rep Counting
            </h3>
            <p className="text-xs leading-relaxed text-gray-400">
              Full range of motion detection counts valid reps while filtering out incomplete
              movements.
            </p>
          </Card>

          <Card className="border-brand-teal/20 bg-brand-dark/20">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-teal/20 text-brand-cyan">
              <LineChart className="h-5 w-5" />
            </div>
            <h3 className="mb-1.5 font-display text-base font-bold text-white">
              Progress Analytics
            </h3>
            <p className="text-xs leading-relaxed text-gray-400">
              View your workout history, total volume lifted, calorie estimates, and form score
              trends.
            </p>
          </Card>

          <Card className="border-brand-teal/20 bg-brand-dark/20">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-teal/20 text-brand-cyan">
              <Trophy className="h-5 w-5" />
            </div>
            <h3 className="mb-1.5 font-display text-base font-bold text-white">
              Community Challenges
            </h3>
            <p className="text-xs leading-relaxed text-gray-400">
              Join monthly challenges, build unbroken workout streaks, and unlock achievement
              badges.
            </p>
          </Card>
        </div>
      </section>

      {/* 6. Exercise Library Preview */}
      <section className="border-y border-brand-teal/20 bg-brand-dark/20 py-20">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Badge variant="cyan">Exercise Library</Badge>
              <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
                Popular Supported Movements
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Learn proper technique with step-by-step guidance and common mistake warnings.
              </p>
            </div>
            <Link to={ROUTES.EXERCISES}>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                View All Exercises
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="flex flex-col justify-between border-brand-teal/20 bg-brand-dark/30">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Badge variant="cyan">Legs & Glutes</Badge>
                  <span className="text-xs text-gray-400">Intermediate</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white">Barbell Back Squat</h3>
                <p className="mt-2 text-xs text-gray-300">
                  Fundamental compound movement for lower-body power and core stability.
                </p>
                <div className="mt-4 rounded-lg bg-brand-dark/50 p-2.5 text-xs text-gray-400">
                  <strong className="mb-0.5 block text-white">Key Tip:</strong>
                  Keep chest tall and lower until thighs are parallel to the floor.
                </div>
              </div>
              <Link to={ROUTES.EXERCISES} className="mt-4">
                <Button variant="ghost" size="sm" className="w-full">
                  Learn Technique &rarr;
                </Button>
              </Link>
            </Card>

            <Card className="flex flex-col justify-between border-brand-teal/20 bg-brand-dark/30">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Badge variant="cyan">Chest & Arms</Badge>
                  <span className="text-xs text-gray-400">Intermediate</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white">Incline Bench Press</h3>
                <p className="mt-2 text-xs text-gray-300">
                  Builds upper chest strength and shoulder stability with controlled dumbbell
                  presses.
                </p>
                <div className="mt-4 rounded-lg bg-brand-dark/50 p-2.5 text-xs text-gray-400">
                  <strong className="mb-0.5 block text-white">Key Tip:</strong>
                  Tuck elbows at a 45-degree angle to protect shoulder joints.
                </div>
              </div>
              <Link to={ROUTES.EXERCISES} className="mt-4">
                <Button variant="ghost" size="sm" className="w-full">
                  Learn Technique &rarr;
                </Button>
              </Link>
            </Card>

            <Card className="flex flex-col justify-between border-brand-teal/20 bg-brand-dark/30">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Badge variant="cyan">Back & Core</Badge>
                  <span className="text-xs text-gray-400">Intermediate</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white">Strict Pull-Ups</h3>
                <p className="mt-2 text-xs text-gray-300">
                  Upper body pulling movement targeting lats, biceps, and core control.
                </p>
                <div className="mt-4 rounded-lg bg-brand-dark/50 p-2.5 text-xs text-gray-400">
                  <strong className="mb-0.5 block text-white">Key Tip:</strong>
                  Pull until your chin clears the bar without swinging your legs.
                </div>
              </div>
              <Link to={ROUTES.EXERCISES} className="mt-4">
                <Button variant="ghost" size="sm" className="w-full">
                  Learn Technique &rarr;
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* 7. Real-Time Form Feedback Showcase */}
      <section className="mx-auto max-w-7xl space-y-12 px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <Badge variant="outline">Instant Guidance</Badge>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Instant Feedback You Can Actually Understand
            </h2>
            <p className="text-sm leading-relaxed text-gray-300">
              No complicated joint angles or confusing charts while you are lifting. FormPulse uses
              clear visual indicators and concise audio voice cues to keep you on track.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-brand-teal/25 bg-brand-dark/40 p-3.5">
                <span className="text-sm font-medium text-white">"Keep your back straight"</span>
                <Badge variant="cyan">Spine Alert</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-brand-teal/25 bg-brand-dark/40 p-3.5">
                <span className="text-sm font-medium text-white">
                  "Lower your hips 2 inches more"
                </span>
                <Badge variant="cyan">Depth Cue</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-brand-teal/25 bg-brand-dark/40 p-3.5">
                <span className="text-sm font-medium text-white">"Great rep! Smooth lockout"</span>
                <Badge variant="success">Rep Confirmed</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-brand-teal/30 bg-brand-dark/30 p-6">
            <h3 className="font-display text-lg font-bold text-white">
              Demonstration: Form Quality Breakdown
            </h3>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-300">Squat Depth Consistency</span>
                  <span className="font-bold text-brand-cyan">95%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-brand-black">
                  <div className="h-full w-[95%] bg-brand-cyan" />
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-300">Spine Neutrality</span>
                  <span className="font-bold text-brand-cyan">98%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-brand-black">
                  <div className="h-full w-[98%] bg-brand-cyan" />
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-300">Rep Cadence Control</span>
                  <span className="font-bold text-brand-cyan">92%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-brand-black">
                  <div className="h-full w-[92%] bg-brand-cyan" />
                </div>
              </div>
            </div>
            <p className="pt-2 text-[11px] text-gray-400">
              * Demonstration preview showing how user metrics are summarized after each session.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Progress Tracking Preview */}
      <section className="border-y border-brand-teal/20 bg-brand-dark/20 py-20">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <Badge variant="cyan">Progress Tracking</Badge>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Watch Your Strength & Form Improve
            </h2>
            <p className="text-sm text-gray-400 sm:text-base">
              Monitor weekly workouts, total volume lifted, and form accuracy gains over time.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="space-y-2 border-brand-teal/20 bg-brand-dark/30 p-6 text-center">
              <span className="text-xs font-medium text-gray-400">AVERAGE FORM SCORE</span>
              <div className="font-display text-4xl font-bold text-brand-cyan">94%</div>
              <p className="text-xs font-medium text-emerald-400">+6% improvement this month</p>
            </Card>

            <Card className="space-y-2 border-brand-teal/20 bg-brand-dark/30 p-6 text-center">
              <span className="text-xs font-medium text-gray-400">WORKOUT STREAK</span>
              <div className="font-display text-4xl font-bold text-white">14 Days</div>
              <p className="text-xs text-gray-400">Consistent daily habits</p>
            </Card>

            <Card className="space-y-2 border-brand-teal/20 bg-brand-dark/30 p-6 text-center">
              <span className="text-xs font-medium text-gray-400">TOTAL VOLUME LIFTED</span>
              <div className="font-display text-4xl font-bold text-white">28,200 kg</div>
              <p className="text-xs font-medium text-brand-cyan">Across 4 workouts this week</p>
            </Card>
          </div>
        </div>
      </section>

      {/* 9. AI Coach Preview */}
      <section className="mx-auto max-w-7xl space-y-12 px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-6">
            <Badge variant="outline">Smart Workout Adjustments</Badge>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              An AI Coach That Adapts to Your Energy & Recovery
            </h2>
            <p className="text-sm leading-relaxed text-gray-300">
              Based on your consistency and past workout volume, FormPulse suggests optimal weight
              progressions and helps you avoid overtraining.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-brand-teal/20 bg-brand-dark/30 p-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-cyan" />
                <span className="text-xs text-gray-200 sm:text-sm">
                  Recommends rest days when workout fatigue accumulates
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-brand-teal/20 bg-brand-dark/30 p-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-cyan" />
                <span className="text-xs text-gray-200 sm:text-sm">
                  Suggests weight increases when your form score stays above 90%
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-brand-teal/20 bg-brand-dark/30 p-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-cyan" />
                <span className="text-xs text-gray-200 sm:text-sm">
                  Flags recurring form errors so you can fix weak points
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <Card className="space-y-4 border border-brand-teal/30 bg-brand-dark/40 p-6">
              <div className="flex items-center gap-3 border-b border-brand-teal/20 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-cyan font-bold text-brand-black">
                  AI
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-white">
                    Today's Coaching Tip
                  </h4>
                  <p className="text-xs text-gray-400">Personalized workout recommendation</p>
                </div>
              </div>

              <p className="rounded-xl border border-brand-teal/20 bg-brand-dark/60 p-4 text-sm leading-relaxed text-gray-200">
                "You maintained great form on your heavy squats on Tuesday. For today's upper body
                session, focus on controlled 3-second descents on the incline bench press."
              </p>

              <div className="flex items-center justify-between pt-1 text-xs text-gray-400">
                <span>Suggested Routine: Upper Body Strength</span>
                <span className="font-semibold text-brand-cyan">35-45 mins</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 10. Real-Time Challenges Preview */}
      <section className="border-y border-brand-teal/20 bg-brand-dark/20 py-20">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Badge variant="cyan">Challenges & Community</Badge>
              <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
                Stay Motivated with Fitness Challenges
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Compete with yourself or join friendly community goals.
              </p>
            </div>
            <Link to={ROUTES.CHALLENGES}>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Explore Challenges
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border-brand-teal/20 bg-brand-dark/30 p-5">
              <Badge variant="cyan" size="sm">
                Form Challenge
              </Badge>
              <h3 className="mt-2 font-display text-base font-bold text-white">
                Squat Form Perfection
              </h3>
              <p className="mt-1 text-xs text-gray-300">
                Complete 50 squat sets with a 90%+ form score.
              </p>
              <div className="mt-4 flex justify-between border-t border-brand-teal/15 pt-3 text-xs text-gray-400">
                <span>840 Participants</span>
                <span className="font-medium text-amber-300">Reward: Form Master</span>
              </div>
            </Card>

            <Card className="border-brand-teal/20 bg-brand-dark/30 p-5">
              <Badge variant="cyan" size="sm">
                Volume Challenge
              </Badge>
              <h3 className="mt-2 font-display text-base font-bold text-white">
                October 100k Volume
              </h3>
              <p className="mt-1 text-xs text-gray-300">
                Accumulate 100,000 kg total weight lifted this month.
              </p>
              <div className="mt-4 flex justify-between border-t border-brand-teal/15 pt-3 text-xs text-gray-400">
                <span>1,250 Participants</span>
                <span className="font-medium text-amber-300">Reward: Iron Lifter</span>
              </div>
            </Card>

            <Card className="border-brand-teal/20 bg-brand-dark/30 p-5">
              <Badge variant="cyan" size="sm">
                Habit Challenge
              </Badge>
              <h3 className="mt-2 font-display text-base font-bold text-white">
                21-Day Workout Habit
              </h3>
              <p className="mt-1 text-xs text-gray-300">
                Complete at least 3 workouts each week for 3 weeks.
              </p>
              <div className="mt-4 flex justify-between border-t border-brand-teal/15 pt-3 text-xs text-gray-400">
                <span>520 Participants</span>
                <span className="font-medium text-amber-300">Reward: Consistency Pro</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 11. Final CTA */}
      <section className="mx-auto max-w-4xl space-y-6 px-4 py-24 text-center">
        <div className="inline-flex rounded-full border border-brand-cyan/40 bg-brand-dark p-3 text-brand-cyan">
          <PlayCircle className="h-6 w-6" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Start Training with Real-Time AI Coaching Today
        </h2>
        <p className="mx-auto max-w-xl text-base text-gray-300">
          No sign-up fee. Open your camera, pick an exercise, and experience immediate form
          feedback.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link to={ROUTES.DASHBOARD}>
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Launch Dashboard
            </Button>
          </Link>
          <Link to={ROUTES.EXERCISES}>
            <Button size="lg" variant="outline">
              Browse Exercise Library
            </Button>
          </Link>
        </div>
      </section>

      {/* 12. Footer is provided in PublicLayout */}
    </div>
  );
}
