/**
 * <question-list>: lista numerada de las preguntas de un examen con sus
 * respuestas; la correcta aparece resaltada.
 * Propiedades: questions (array), selectedId (string|null).
 * Emite "question:edit" y "question:delete" (bubbles) con { id }.
 */
import { escapeHtml } from '../utils/dom.js';
import { icons } from '../utils/icons.js';

const LETTERS = 'ABCDEF';

class QuestionList extends HTMLElement {
  constructor() {
    super();
    this._questions = [];
    this._selectedId = null;
  }

  set questions(value) {
    this._questions = Array.isArray(value) ? value : [];
    this.render();
  }

  set selectedId(value) {
    this._selectedId = value;
    this.querySelectorAll('.question-card').forEach((card) => {
      card.classList.toggle('is-selected', card.dataset.id === value);
    });
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="table-toolbar">
        <h2 class="card__title">Preguntas del examen</h2>
        <span class="badge badge--primary" data-total></span>
      </div>
      <ol class="question-list" data-list></ol>
      <div class="empty" hidden>
        <span class="empty__icon">${icons.help}</span>
        <p class="empty__title">Este examen aún no tiene preguntas</p>
        <p>Agrega la primera con el formulario. Los estudiantes solo verán exámenes con al menos una pregunta.</p>
      </div>`;

    this.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const id = button.closest('.question-card').dataset.id;
      this.dispatchEvent(new CustomEvent(`question:${button.dataset.action}`, { bubbles: true, detail: { id } }));
    });

    this.render();
  }

  render() {
    const list = this.querySelector('[data-list]');
    if (!list) return;
    const questions = this._questions;

    list.innerHTML = questions.map((q, i) => `
      <li class="question-card ${q.id === this._selectedId ? 'is-selected' : ''}" data-id="${escapeHtml(q.id)}" style="animation-delay:${Math.min(i, 10) * 30}ms">
        <div class="question-card__head">
          <span class="question-card__num" aria-hidden="true">${i + 1}</span>
          <p class="question-card__text"><span class="sr-only">Pregunta ${i + 1}: </span>${escapeHtml(q.enunciado)}</p>
          <div class="question-card__actions">
            <button class="icon-btn" type="button" data-action="edit" aria-label="Editar la pregunta ${i + 1}" title="Editar">${icons.edit}</button>
            <button class="icon-btn icon-btn--danger" type="button" data-action="delete" aria-label="Eliminar la pregunta ${i + 1}" title="Eliminar">${icons.trash}</button>
          </div>
        </div>
        <ul class="answer-list">
          ${q.respuestas.map((r, j) => `
            <li class="answer ${r.correcta ? 'is-correct' : ''}">
              <span class="answer__letter" aria-hidden="true">${LETTERS[j] ?? j + 1}</span>
              <span class="answer__text">${escapeHtml(r.descripcion)}</span>
              ${r.correcta ? `<span class="badge badge--success">${icons.check}Correcta</span>` : ''}
            </li>`).join('')}
        </ul>
      </li>`).join('');

    const total = questions.length;
    this.querySelector('[data-total]').textContent = `${total} ${total === 1 ? 'pregunta' : 'preguntas'}`;
    list.hidden = total === 0;
    this.querySelector('.empty').hidden = total !== 0;
  }
}

customElements.define('question-list', QuestionList);
