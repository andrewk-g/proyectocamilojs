/**
 * <exam-runner-view>: presentación de un examen (ruta pública #/presentar/:id).
 *
 * Tiene dos pasos:
 *  1. Introducción: datos del examen + formulario de identificación y nombre.
 *  2. Examen: encabezado (título, total de preguntas, % para aprobar), reloj,
 *     preguntas numeradas y botón Terminar.
 * Al terminar (manualmente o por tiempo) se califica y se abre el resultado.
 */
import '../components/exam-timer.js';
import '../components/exam-question.js';
import { discardActiveAttempt, finishAttempt, getActiveAttempt, saveAnswer, startAttempt } from '../services/attempts.service.js';
import { getExam } from '../services/exams.service.js';
import { navigate } from '../router.js';
import { ValidationError } from '../utils/errors.js';
import { confirmDialog, escapeHtml, formToObject, toast } from '../utils/dom.js';
import { clearFieldError, clearFieldErrors, showFieldErrors } from '../utils/forms.js';
import { icons } from '../utils/icons.js';

const PREFIX = 'sf';
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

class ExamRunnerView extends HTMLElement {
  connectedCallback() {
    this.examId = this.params?.id;
    this.exam = getExam(this.examId);
    this.finishing = false;
    this.onBeforeUnload = (event) => event.preventDefault();

    const active = getActiveAttempt();

    if (!this.exam || this.exam.preguntas.length === 0) {
      // Si había un intento de este examen, ya no se puede continuar.
      if (active?.examId === this.examId) discardActiveAttempt();
      this.renderUnavailable();
      return;
    }

    if (active?.examId === this.examId) {
      // Se reanuda el intento (p. ej. tras recargar la página).
      if (Date.now() >= active.deadline) this.finish('tiempo');
      else this.renderExam(active);
    } else {
      this.renderIntro(active);
    }
  }

  disconnectedCallback() {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  }

  renderUnavailable() {
    this.innerHTML = `
      <section class="page container">
        <div class="card empty">
          <span class="empty__icon">${icons.file}</span>
          <p class="empty__title">Este examen no está disponible</p>
          <p>Puede que haya sido eliminado o que todavía no tenga preguntas.</p>
          <a class="btn btn--primary" href="#/">Ver exámenes disponibles</a>
        </div>
      </section>`;
  }

  // ---------- Paso 1: identificación ----------

  renderIntro(otherActive) {
    const exam = this.exam;
    const otherExam = otherActive && getExam(otherActive.examId);

    this.innerHTML = `
      <section class="page container intro">
        <a class="back-link" href="#/">${icons.arrowLeft}<span>Volver a exámenes</span></a>
        <div class="intro__grid">
          <article class="card intro__exam">
            <span class="code">${escapeHtml(exam.codigo)}</span>
            <h1 class="page__title">${escapeHtml(exam.titulo)}</h1>
            <p class="intro__desc">${escapeHtml(exam.descripcion)}</p>
            <ul class="meta-list">
              <li>${icons.clock}<span>${exam.tiempo} minutos</span></li>
              <li>${icons.list}<span>${plural(exam.preguntas.length, 'pregunta', 'preguntas')}</span></li>
              <li>${icons.target}<span>Aprueba con ${exam.porcentajeAprobacion}%</span></li>
            </ul>
            <ul class="intro__rules">
              <li>El reloj empieza cuando pulses <strong>Comenzar examen</strong>.</li>
              <li>Cada pregunta tiene una sola respuesta correcta.</li>
              <li>Si se acaba el tiempo, el examen se entrega automáticamente.</li>
            </ul>
          </article>

          <form class="card intro__form" novalidate>
            <h2 class="card__title">Tus datos</h2>
            <p class="card__subtitle">Tus respuestas quedarán asociadas a estos datos.</p>
            <div class="form-grid">
              <div class="field">
                <label for="${PREFIX}-identificacion">Número de identificación</label>
                <input id="${PREFIX}-identificacion" name="identificacion" type="text" inputmode="numeric"
                  maxlength="15" autocomplete="off" required aria-describedby="${PREFIX}-identificacion-error">
                <p class="field__error" id="${PREFIX}-identificacion-error"></p>
              </div>
              <div class="field">
                <label for="${PREFIX}-nombre">Nombre completo</label>
                <input id="${PREFIX}-nombre" name="nombre" type="text" maxlength="80" autocomplete="name"
                  required aria-describedby="${PREFIX}-nombre-error">
                <p class="field__error" id="${PREFIX}-nombre-error"></p>
              </div>
              ${otherExam ? `<p class="notice">Tienes en curso "${escapeHtml(otherExam.titulo)}". Si comienzas este, aquel se descartará.</p>` : ''}
              <button class="btn btn--primary btn--block btn--lg" type="submit">Comenzar examen</button>
            </div>
          </form>
        </div>
      </section>`;

    const form = this.querySelector('form');
    form.addEventListener('input', (event) => clearFieldError(form, event.target, PREFIX));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearFieldErrors(form);
      try {
        const attempt = startAttempt(this.examId, formToObject(form));
        this.renderExam(attempt);
      } catch (error) {
        if (error instanceof ValidationError) showFieldErrors(form, error.errors, PREFIX);
        else toast(error.message, 'error');
      }
    });
    form.elements.identificacion.focus();
  }

  // ---------- Paso 2: examen ----------

  renderExam(attempt) {
    const exam = this.exam;
    const total = exam.preguntas.length;

    this.innerHTML = `
      <section class="runner container">
        <header class="runner__header">
          <div class="runner__info">
            <p class="eyebrow">Examen · ${escapeHtml(exam.codigo)}</p>
            <h1 class="runner__title" tabindex="-1">${escapeHtml(exam.titulo)}</h1>
            <ul class="meta-list">
              <li>${icons.list}<span>${plural(total, 'pregunta', 'preguntas')}</span></li>
              <li>${icons.target}<span>Aprueba con ${exam.porcentajeAprobacion}%</span></li>
            </ul>
          </div>
          <exam-timer></exam-timer>
          <div class="runner__progress">
            <span><strong data-answered>0</strong> de ${total} respondidas</span>
            <div class="progress" aria-hidden="true"><span data-progress></span></div>
          </div>
        </header>

        <p class="runner__student">Presentando como <strong>${escapeHtml(attempt.nombre)}</strong> · ID ${escapeHtml(attempt.identificacion)}</p>

        <form class="runner__form" novalidate>
          <ol class="runner__list">
            ${exam.preguntas.map(() => '<li><exam-question></exam-question></li>').join('')}
          </ol>
          <div class="runner__footer card">
            <p class="muted" data-footer-text></p>
            <button class="btn btn--primary btn--lg" type="submit" data-finish>Terminar</button>
          </div>
        </form>
      </section>`;

    this.questionEls = [...this.querySelectorAll('exam-question')];
    this.questionEls.forEach((el, index) => {
      const question = exam.preguntas[index];
      el.data = { question, index, selectedId: attempt.respuestas[question.id] ?? null };
    });
    this.answers = { ...attempt.respuestas };
    this.updateProgress();

    this.addEventListener('answer:change', (event) => {
      const { questionId, answerId } = event.detail;
      if (saveAnswer(questionId, answerId)) {
        this.answers[questionId] = answerId;
        this.updateProgress();
      }
    });

    this.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      this.confirmFinish();
    });

    this.timer = this.querySelector('exam-timer');
    this.timer.addEventListener('timer:expired', () => this.finish('tiempo'));
    this.timer.start({ deadline: attempt.deadline, durationMs: exam.tiempo * 60_000 });

    window.addEventListener('beforeunload', this.onBeforeUnload);
    this.querySelector('.runner__title').focus();
  }

  answeredCount() {
    return this.exam.preguntas.filter((q) => this.answers[q.id]).length;
  }

  updateProgress() {
    const total = this.exam.preguntas.length;
    const answered = this.answeredCount();
    this.querySelector('[data-answered]').textContent = answered;
    this.querySelector('[data-progress]').style.transform = `scaleX(${answered / total})`;
    const missing = total - answered;
    this.querySelector('[data-footer-text]').textContent = missing
      ? `Te faltan ${plural(missing, 'pregunta', 'preguntas')} por responder.`
      : '¡Respondiste todas las preguntas! Revisa y pulsa Terminar.';
  }

  async confirmFinish() {
    const missing = this.exam.preguntas.length - this.answeredCount();
    if (missing > 0) {
      const confirmed = await confirmDialog({
        title: '¿Terminar el examen?',
        message: `Tienes ${plural(missing, 'pregunta', 'preguntas')} sin responder; contarán como incorrectas.`,
        confirmText: 'Terminar',
        variant: 'primary',
      });
      if (!confirmed) return;
    }
    this.finish('usuario');
  }

  // ---------- Fin ----------

  finish(reason) {
    if (this.finishing) return;
    this.finishing = true;
    this.timer?.stop();
    this.questionEls?.forEach((el) => el.disable());
    document.querySelector('app-confirm')?.dismiss();
    window.removeEventListener('beforeunload', this.onBeforeUnload);

    try {
      const attempt = finishAttempt({ reason });
      if (attempt.finalizadoPor === 'tiempo') {
        toast('Se acabó el tiempo. Tu examen se entregó automáticamente.', 'warning');
      }
      navigate(`/resultado/${attempt.id}`);
    } catch (error) {
      toast(error.message, 'error');
      navigate('/');
    }
  }
}

customElements.define('exam-runner-view', ExamRunnerView);
