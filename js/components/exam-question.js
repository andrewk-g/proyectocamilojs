/**
 * <exam-question>: una pregunta del examen con sus opciones de respuesta.
 * Usa botones de opción (radio) del mismo grupo: solo se puede elegir una.
 * Nunca recibe ni pinta cuál es la respuesta correcta.
 *
 * Propiedad: data = { question, index, selectedId }.
 * Emite "answer:change" (bubbles) con { questionId, answerId }.
 */
import { escapeHtml } from '../utils/dom.js';

const LETTERS = 'ABCDEF';

class ExamQuestion extends HTMLElement {
  set data({ question, index, selectedId = null }) {
    this.question = question;
    this.innerHTML = `
      <fieldset class="exam-question">
        <legend class="exam-question__title">
          <span class="exam-question__num" aria-hidden="true">${index + 1}</span>
          <span><span class="sr-only">Pregunta ${index + 1}: </span>${escapeHtml(question.enunciado)}</span>
        </legend>
        <div class="exam-question__options">
          ${question.respuestas.map((answer, j) => `
            <label class="option">
              <input type="radio" name="q-${escapeHtml(question.id)}" value="${escapeHtml(answer.id)}"
                ${answer.id === selectedId ? 'checked' : ''}>
              <span class="option__letter" aria-hidden="true">${LETTERS[j] ?? j + 1}</span>
              <span class="option__text">${escapeHtml(answer.descripcion)}</span>
            </label>`).join('')}
        </div>
      </fieldset>`;
    this.classList.toggle('is-answered', Boolean(selectedId));
  }

  connectedCallback() {
    this.addEventListener('change', (event) => {
      if (event.target.type !== 'radio') return;
      this.classList.add('is-answered');
      this.dispatchEvent(new CustomEvent('answer:change', {
        bubbles: true,
        detail: { questionId: this.question.id, answerId: event.target.value },
      }));
    });
  }

  disable() {
    this.querySelectorAll('input').forEach((input) => { input.disabled = true; });
  }
}

customElements.define('exam-question', ExamQuestion);
