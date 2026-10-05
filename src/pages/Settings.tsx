import { useState } from 'react';
import { Settings, Volume2, Check, SlidersHorizontal, Bell } from 'lucide-react';
import { PageContainer } from '@/components/primitives/PageContainer';
import { PageHeading } from '@/components/primitives/Typography';
import { Card } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Badge } from '@/components/primitives/Badge';
import { MOCK_SETTINGS } from '@/services/mockData';
import type { UserSettings } from '@/types';

export function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(MOCK_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);

  const handleToggle = (key: keyof UserSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <PageContainer maxWidth="xl">
      <PageHeading
        title="Settings"
        subtitle="Manage audio voice cues, form feedback strictness, units, and notification preferences."
      >
        <Button
          size="md"
          variant="primary"
          onClick={handleSave}
          leftIcon={isSaved ? <Check className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
        >
          {isSaved ? 'Preferences Saved' : 'Save Changes'}
        </Button>
      </PageHeading>

      <div className="space-y-6">
        {/* Form Feedback Sensitivity */}
        <Card className="space-y-4 border border-brand-teal/30 bg-brand-dark/30 p-6">
          <div className="flex items-center justify-between border-b border-brand-teal/20 pb-3">
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="h-5 w-5 text-brand-cyan" />
              <h3 className="font-display text-lg font-bold leading-tight tracking-normal text-white">
                Form Feedback Strictness
              </h3>
            </div>
            <Badge variant="cyan">{settings.formStrictness} Mode</Badge>
          </div>

          <p className="text-xs text-gray-400">
            Choose how strictly the AI checks your form during squats, presses, and pulls.
          </p>

          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
            {(['Relaxed', 'Standard', 'Strict'] as const).map(sens => (
              <button
                key={sens}
                type="button"
                onClick={() => setSettings({ ...settings, formStrictness: sens })}
                className={`rounded-xl border p-4 text-left transition-all ${
                  settings.formStrictness === sens
                    ? 'border-brand-cyan bg-brand-dark shadow-sm'
                    : 'border-brand-teal/20 bg-brand-black/60 hover:border-brand-teal/40'
                }`}
              >
                <div className="font-sans text-sm font-bold text-white">{sens}</div>
                <div className="mt-1 text-xs text-gray-400">
                  {sens === 'Strict'
                    ? 'Flags minor form variations for experienced lifters'
                    : sens === 'Standard'
                      ? 'Balanced feedback for regular strength training'
                      : 'Forgiving tolerance for beginners learning movement'}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Audio & Vibration Alerts */}
        <Card className="space-y-4 border border-brand-teal/30 bg-brand-dark/30 p-6">
          <div className="flex items-center gap-2.5 border-b border-brand-teal/20 pb-3">
            <Volume2 className="h-5 w-5 text-brand-cyan" />
            <h3 className="font-display text-lg font-bold leading-tight tracking-normal text-white">
              Audio & Vibration Cues
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-brand-teal/15 bg-brand-black/50 p-4">
              <div>
                <div className="text-sm font-medium text-white">Voice Coaching Guidance</div>
                <div className="mt-0.5 text-xs text-gray-400">
                  Hear spoken voice cues like "Keep your back straight" during sets
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('voiceGuidance')}
                className={`relative h-6 w-12 rounded-full border transition-colors ${
                  settings.voiceGuidance
                    ? 'border-brand-cyan bg-brand-cyan'
                    : 'border-brand-teal/40 bg-brand-dark'
                }`}
              >
                <div
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-brand-white transition-transform ${
                    settings.voiceGuidance ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-brand-teal/15 bg-brand-black/50 p-4">
              <div>
                <div className="text-sm font-medium text-white">Vibration Rep Alerts</div>
                <div className="mt-0.5 text-xs text-gray-400">
                  Vibrate your phone gently when a repetition is successfully counted
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('vibrationAlerts')}
                className={`relative h-6 w-12 rounded-full border transition-colors ${
                  settings.vibrationAlerts
                    ? 'border-brand-cyan bg-brand-cyan'
                    : 'border-brand-teal/40 bg-brand-dark'
                }`}
              >
                <div
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-brand-white transition-transform ${
                    settings.vibrationAlerts ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Units & Notifications */}
        <Card className="space-y-4 border border-brand-teal/30 bg-brand-dark/30 p-6">
          <div className="flex items-center gap-2.5 border-b border-brand-teal/20 pb-3">
            <Bell className="h-5 w-5 text-brand-cyan" />
            <h3 className="font-display text-lg font-bold leading-tight tracking-normal text-white">
              Units & Notifications
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-brand-teal/15 bg-brand-black/50 p-4">
              <span className="block text-xs font-medium text-gray-400">Weight Units</span>
              <div className="mt-2.5 flex gap-2">
                {(['Metric (kg)', 'Imperial (lbs)'] as const).map(unit => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setSettings({ ...settings, unitSystem: unit })}
                    className={`rounded-lg border px-3.5 py-1.5 font-sans text-xs font-medium transition-colors ${
                      settings.unitSystem === unit
                        ? 'border-brand-cyan bg-brand-dark font-semibold text-brand-cyan'
                        : 'border-brand-teal/20 bg-brand-black text-gray-400'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-brand-teal/15 bg-brand-black/50 p-4">
              <div>
                <span className="block text-xs font-medium text-gray-400">Workout Reminders</span>
                <div className="mt-1 text-xs font-medium text-white">
                  Weekly email summary & habit reminders
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('emailNotifications')}
                className={`relative h-6 w-12 rounded-full border transition-colors ${
                  settings.emailNotifications
                    ? 'border-brand-cyan bg-brand-cyan'
                    : 'border-brand-teal/40 bg-brand-dark'
                }`}
              >
                <div
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-brand-white transition-transform ${
                    settings.emailNotifications ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
