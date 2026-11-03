import confetti from 'canvas-confetti';

export function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.65 },
    colors: ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'],
  });
}
