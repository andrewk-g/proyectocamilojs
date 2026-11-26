/**
 * <exam-timer>: reloj de cuenta regresiva del examen.
 *
 * start({ deadline, durationMs }) inicia el conteo hasta la hora límite.
 * El tiempo restante se calcula siempre como deadline - Date.now(), así el
 * reloj no se atrasa aunque el navegador ralentice los intervalos (por
 * ejemplo, cuando la pestaña queda en segundo plano).
 * Emite "timer:expired" (bubbles) una sola vez al llegar a 0.
 */
import { icons } from '../utils/icons.js';

const pad = (n) => String(n).padStart(2, '0');

export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

// Avisos para lectores de pantalla (milisegundos restantes → mensaje).
const ANNOUNCEMENTS = [
  [5 * 60_000, 'Quedan 5 minutos.'],
  [60_000, 'Queda 1 minuto.'],
  [10_000, 'Quedan 10 segundos.'],
];

class ExamTimer extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="timer">
        <span class="timer__icon">${icons.clock}</span>
        <div>
          <span class="timer__label" id="timer-label">Tiempo restante</span>
          <span class="timer__value" role="timer" aria-labelledby="timer-label" data-value>--:--</span>
        </div>
      </div>
      <div class="timer__bar" aria-hidden="true"><span data-bar></span></div>
      <p class="sr-only" aria-live="assertive" data-announce></p>`;
    this.valueEl = this.querySelector('[data-value]');
    this.barEl = this.querySelector('[data-bar]');
    this.announceEl = this.querySelector('[data-announce]');
  }

  disconnectedCallback() {
    this.stop();
  }

  start({ deadline, durationMs }) {
    this.stop();
    this.deadline = deadline;
    this.duration = durationMs;
    this.expired = false;
    // No se anuncian los umbrales que ya pasaron (p. ej. al reanudar).
    this.pending = ANNOUNCEMENTS.filter(([threshold]) => deadline - Date.now() > threshold);
    this.tick();
    if (!this.expired) this.interval = setInterval(() => this.tick(), 250);
  }

  stop() {
    clearInterval(this.interval);
    this.interval = null;
  }

  tick() {
    const remaining = this.deadline - Date.now();
    this.valueEl.textContent = formatDuration(remaining);
    this.barEl.style.transform = `scaleX(${Math.max(0, Math.min(1, remaining / this.duration))})`;

    const warningAt = Math.max(60_000, this.duration * 0.2);
    this.classList.toggle('is-warning', remaining <= warningAt && remaining > 10_000);
    this.classList.toggle('is-danger', remaining <= 10_000);

    while (this.pending.length && remaining <= this.pending[0][0]) {
      this.announceEl.textContent = this.pending.shift()[1];
    }

    if (remaining <= 0 && !this.expired) {
      this.expired = true;
      this.stop();
      this.announceEl.textContent = 'Se acabó el tiempo.';
      this.dispatchEvent(new CustomEvent('timer:expired', { bubbles: true }));
    }
  }
}

customElements.define('exam-timer', ExamTimer);
