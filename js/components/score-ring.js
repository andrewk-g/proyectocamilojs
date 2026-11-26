/**
 * <score-ring value="72.5" passed>: anillo circular que muestra el porcentaje
 * obtenido. El arco y el número se animan desde 0 (salvo con
 * prefers-reduced-motion).
 */
import { prefersReducedMotion } from '../utils/dom.js';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DURATION = 1100;

const formatPercent = (n) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`;

class ScoreRing extends HTMLElement {
  connectedCallback() {
    const value = Math.max(0, Math.min(100, Number(this.getAttribute('value')) || 0));
    this.classList.toggle('is-passed', this.hasAttribute('passed'));
    this.innerHTML = `
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle class="score-ring__track" cx="60" cy="60" r="${RADIUS}"></circle>
        <circle class="score-ring__arc" cx="60" cy="60" r="${RADIUS}"
          stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${CIRCUMFERENCE}"></circle>
      </svg>
      <span class="score-ring__value" data-value>0%</span>
      <span class="sr-only">Obtuviste ${formatPercent(value)} de respuestas acertadas.</span>`;

    const arc = this.querySelector('.score-ring__arc');
    const label = this.querySelector('[data-value]');
    const finalOffset = CIRCUMFERENCE * (1 - value / 100);

    if (prefersReducedMotion()) {
      arc.style.strokeDashoffset = finalOffset;
      label.textContent = formatPercent(value);
      return;
    }

    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - (1 - t) ** 3; // ease-out cúbico
      arc.style.strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE - finalOffset) * eased;
      label.textContent = formatPercent(t < 1 ? Math.round(value * eased) : value);
      if (t < 1) this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.frame);
  }
}

customElements.define('score-ring', ScoreRing);
