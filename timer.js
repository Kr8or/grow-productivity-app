/* Clock independent of rendering; injectable time keeps edge cases testable. */
(function (root) {
  class FocusTimer {
    constructor(now = () => Date.now()) { this.now = now; this.reset(); }
    reset() { this.total = 1800000; this.remaining = this.total; this.deadline = null; }
    get running() { return this.deadline !== null; }
    read() {
      if (this.running) {
        this.remaining = Math.max(0, this.deadline - this.now());
        if (this.remaining === 0) this.deadline = null;
      }
      return this.remaining;
    }
    start() { if (!this.running && this.read() > 0) this.deadline = this.now() + this.remaining; }
    pause() { this.read(); this.deadline = null; }
    adjust(minutes) {
      const wasRunning = this.running;
      const previous = this.read();
      this.remaining = Math.min(5999000, Math.max(0, previous + minutes * 60000));
      this.total = Math.max(1, this.total + this.remaining - previous);
      this.deadline = wasRunning && this.remaining > 0 ? this.now() + this.remaining : null;
    }
    get fraction() { return Math.max(0, Math.min(1, this.read() / this.total)); }
    get display() {
      const seconds = Math.ceil(this.read() / 1000);
      return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
  }
  if (typeof module !== 'undefined') module.exports = FocusTimer;
  else root.FocusTimer = FocusTimer;
})(typeof window !== 'undefined' ? window : globalThis);
