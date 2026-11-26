/**
 * <exam-result-view>: resultado de un intento (ruta pública #/resultado/:id).
 * Muestra el porcentaje de respuestas acertadas, el mensaje de aprobación o
 * no aprobación según el porcentaje del examen, y el detalle por pregunta
 * (sin revelar cuál era la respuesta correcta).
 */
import '../components/score-ring.js';
import { getAttempt } from '../services/attempts.service.js';
import { formatDuration } from '../components/exam-timer.js';
import { escapeHtml } from '../utils/dom.js';
import { icons } from '../utils/icons.js';

const formatPercent = (n) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`;

class ExamResultView extends HTMLElement {
  connectedCallback() {
    const attempt = getAttempt(this.params?.id);
    if (!attempt) {
      this.innerHTML = `
        <section class="page container">
          <div class="card empty">
            <span class="empty__icon">${icons.file}</span>
            <p class="empty__title">No encontramos este resultado</p>
            <a class="btn btn--primary" href="#/">Ver exámenes disponibles</a>
          </div>
        </section>`;
      return;
    }

    const passed = attempt.aprobado;
    const used = new Date(attempt.finishedAt) - new Date(attempt.startedAt);

    this.innerHTML = `
      <section class="page container result">
        <article class="card result__card ${passed ? 'is-passed' : 'is-failed'}">
          <score-ring value="${attempt.porcentaje}" ${passed ? 'passed' : ''}></score-ring>
          <div class="result__summary">
            <p class="eyebrow">${escapeHtml(attempt.examCodigo)} · ${escapeHtml(attempt.examTitulo)}</p>
            <h1 class="result__title" tabindex="-1">${passed ? '¡Aprobaste el examen!' : 'No aprobaste el examen'}</h1>
            <p class="result__message">
              ${escapeHtml(attempt.nombre)}, acertaste el <strong>${formatPercent(attempt.porcentaje)}</strong> de las preguntas.
              ${passed
                ? `Alcanzaste el ${attempt.porcentajeAprobacion}% necesario para aprobar.`
                : `Necesitabas al menos el ${attempt.porcentajeAprobacion}% para aprobar.`}
            </p>
            <dl class="result__stats">
              <div><dt>Respuestas correctas</dt><dd>${attempt.correctas} de ${attempt.total}</dd></div>
              <div><dt>Para aprobar</dt><dd>${attempt.porcentajeAprobacion}%</dd></div>
              <div><dt>Tiempo usado</dt><dd>${formatDuration(used)} de ${attempt.tiempoLimite} min</dd></div>
              <div><dt>Entrega</dt><dd>${attempt.finalizadoPor === 'tiempo' ? 'Tiempo agotado' : 'Terminado por ti'}</dd></div>
            </dl>
            <div class="result__actions">
              <a class="btn btn--primary" href="#/">Volver a exámenes</a>
              <a class="btn" href="#/presentar/${encodeURIComponent(attempt.examId)}">Intentar de nuevo</a>
            </div>
          </div>
        </article>

        <article class="card">
          <h2 class="card__title">Detalle de tus respuestas</h2>
          <ol class="review-list">
            ${attempt.detalle.map((d, i) => `
              <li class="review ${d.acertada ? 'is-correct' : 'is-wrong'}">
                <span class="review__icon" aria-hidden="true">${d.acertada ? icons.check : icons.close}</span>
                <div>
                  <p class="review__question"><span class="sr-only">${d.acertada ? 'Correcta' : 'Incorrecta'}. </span>${i + 1}. ${escapeHtml(d.enunciado)}</p>
                  <p class="review__answer">${d.respuestaTexto === null ? 'Sin responder' : `Tu respuesta: ${escapeHtml(d.respuestaTexto)}`}</p>
                </div>
              </li>`).join('')}
          </ol>
        </article>
      </section>`;

    this.querySelector('.result__title').focus({ preventScroll: true });
  }
}

customElements.define('exam-result-view', ExamResultView);
