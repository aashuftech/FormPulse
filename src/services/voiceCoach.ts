const DEFAULT_COOLDOWN_MS = 2500;

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  try {
    return window.speechSynthesis;
  } catch {
    return null;
  }
}

/** Browser-only voice feedback. Unsupported browsers quietly keep visual feedback. */
export class VoiceCoach {
  private enabled = false;
  private speaking = false;
  private currentFeedback = '';
  private pendingFeedback = '';
  private lastSpokenFeedback = '';
  private lastSpokenAt = 0;
  private requestId = 0;
  private cooldownTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly cooldownMs = DEFAULT_COOLDOWN_MS) {}

  get isAvailable() {
    return getSpeechSynthesis() !== null && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  start() {
    this.enabled = true;
    return this.isAvailable;
  }

  stop() {
    this.enabled = false;
    this.requestId += 1;
    this.speaking = false;
    this.pendingFeedback = '';
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
    this.cooldownTimer = null;
    try {
      getSpeechSynthesis()?.cancel();
    } catch {
      // Speech is an optional enhancement; browser speech errors are non-fatal.
    }
  }

  reset() {
    this.stop();
    this.currentFeedback = '';
    this.lastSpokenFeedback = '';
    this.lastSpokenAt = 0;
  }

  speak(feedback: string) {
    const text = feedback.trim();
    if (!this.enabled || !text || !this.isAvailable) return false;
    if (text === this.currentFeedback) return false;

    this.currentFeedback = text;
    this.pendingFeedback = text === this.lastSpokenFeedback ? '' : text;
    this.speakLatestWhenReady();
    return true;
  }

  private speakLatestWhenReady() {
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
    this.cooldownTimer = null;
    if (!this.enabled || !this.pendingFeedback || this.speaking) return;
    const synthesis = getSpeechSynthesis();
    if (!synthesis || typeof SpeechSynthesisUtterance === 'undefined') return;

    if (synthesis.speaking || synthesis.pending) {
      this.scheduleLatest(100);
      return;
    }

    const cooldownRemaining = this.cooldownMs - (Date.now() - this.lastSpokenAt);
    if (cooldownRemaining > 0) {
      this.scheduleLatest(cooldownRemaining);
      return;
    }

    const text = this.pendingFeedback;
    this.pendingFeedback = '';
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const requestId = ++this.requestId;
      this.speaking = true;
      this.lastSpokenFeedback = text;
      this.lastSpokenAt = Date.now();
      const finish = () => {
        if (this.requestId !== requestId) return;
        this.speaking = false;
        this.speakLatestWhenReady();
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      synthesis.speak(utterance);
    } catch {
      this.speaking = false;
    }
  }

  private scheduleLatest(delayMs: number) {
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
    this.cooldownTimer = setTimeout(
      () => {
        this.cooldownTimer = null;
        this.speakLatestWhenReady();
      },
      Math.max(0, delayMs),
    );
  }
}

export const voiceCoach = new VoiceCoach();
