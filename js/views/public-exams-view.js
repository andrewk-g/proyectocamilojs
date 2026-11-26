/**
 * <public-exams-view>: módulo PÚBLICO (no requiere sesión). Lista los
 * exámenes disponibles con su título, tiempo y porcentaje de aprobación.
 */
import { discardActiveAttempt, getActiveAttempt, listAvailableExams } from '../services/attempts.service.js';
import { getExam } from '../services/exams.service.js';
import { escapeHtml } from '../utils/dom.js';
import { icons } from '../utils/icons.js';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

class PublicExamsView extends HTMLElement {
  connectedCallback() {
    this.exams = listAvailableExams();
    this.query = '';

    this.innerHTML = `
      <section class="page container">
        <header class="hero">
          <p class="eyebrow">Acme School</p>
          <h1 class="hero__title">Exámenes disponibles</h1>
          <p class="hero__lead">Elige un examen, escribe tu identificación y tu nombre, y respóndelo antes de que se acabe el tiempo.</p>
        </header>

        <div class="resume" data-resume hidden></div>

        <div class="toolbar">
          <p class="muted" data-total></p>
          <label class="search">
            <span class="sr-only">Buscar examen</span>
            ${icons.search}
            <input type="search" placeholder="Buscar examen…" data-search>
          </label>
        </div>

        <ul class="exam-grid" data-grid></ul>
        <div class="card empty" data-empty hidden>
          <span class="empty__icon">${icons.file}</span>
          <p class="empty__title" data-empty-title></p>
          <p data-empty-text></p>
        </div>
      </section>`;

    this.querySelector('[data-search]').addEventListener('input', (event) => {
      this.query = event.target.value.trim().toLowerCase();
      this.renderGrid();
    });

    this.renderResume();
    this.renderGrid();
  }

  /** Si hay un examen a medias, ofrece continuarlo. */
  renderResume() {
    const active = getActiveAttempt();
    if (!active) return;
    const exam = getExam(active.examId);
    if (!exam || exam.preguntas.length === 0) {
      // El examen se eliminó o se quedó sin preguntas: el intento ya no se puede continuar.
      discardActiveAttempt();
      return;
    }
    const box = this.querySelector('[data-resume]');
    box.hidden = false;
    box.innerHTML = `
      <span class="resume__icon">${icons.clock}</span>
      <p><strong>Tienes un examen en curso:</strong> ${escapeHtml(exam.titulo)}. El reloj sigue corriendo.</p>
      <a class="btn btn--primary btn--sm" href="#/presentar/${encodeURIComponent(exam.id)}">Continuar</a>`;
  }

  renderGrid() {
    const exams = this.query
      ? this.exams.filter((e) => [e.titulo, e.codigo].some((v) => v.toLowerCase().includes(this.query)))
      : this.exams;

    this.querySelector('[data-total]').textContent = plural(this.exams.length, 'examen disponible', 'exámenes disponibles');

    this.querySelector('[data-grid]').innerHTML = exams.map((exam, i) => `
      <li class="exam-card" style="animation-delay:${Math.min(i, 8) * 50}ms">
        <span class="code">${escapeHtml(exam.codigo)}</span>
        <h2 class="exam-card__title">${escapeHtml(exam.titulo)}</h2>
        <p class="exam-card__desc">${escapeHtml(exam.descripcion)}</p>
        <dl class="exam-card__facts">
          <div>${icons.clock}<dt>Tiempo</dt><dd>${exam.tiempo} min</dd></div>
          <div>${icons.target}<dt>Aprobación</dt><dd>${exam.porcentajeAprobacion}%</dd></div>
          <div>${icons.list}<dt>Preguntas</dt><dd>${exam.preguntas.length}</dd></div>
        </dl>
        <a class="btn btn--primary btn--block" href="#/presentar/${encodeURIComponent(exam.id)}"
          aria-label="Presentar ${escapeHtml(exam.titulo)}">Presentar examen</a>
      </li>`).join('');

    const empty = exams.length === 0;
    this.querySelector('[data-empty]').hidden = !empty;
    if (empty) {
      this.querySelector('[data-empty-title]').textContent = this.query ? 'Sin resultados' : 'No hay exámenes disponibles';
      this.querySelector('[data-empty-text]').textContent = this.query
        ? 'Prueba con otro título o código.'
        : 'Vuelve más tarde: los docentes aún no han publicado exámenes.';
    }
  }
}

customElements.define('public-exams-view', PublicExamsView);
