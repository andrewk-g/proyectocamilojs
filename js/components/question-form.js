/**
 * <question-form>: crea o edita una pregunta de un examen con sus respuestas.
 * Cada respuesta tiene un radio "correcta" del mismo grupo, así que solo
 * una puede quedar marcada.
 * Propiedad: examId. Emite "question:saved" y "question:editing" (bubbles).
 */
import { addQuestion, updateQuestion } from '../services/exams.service.js';
import { ValidationError } from '../utils/errors.js';
import { QUESTION_LIMITS } from '../utils/validators.js';
import { prefersReducedMotion, toast } from '../utils/dom.js';
import { clearFieldError, clearFieldErrors, showFieldErrors } from '../utils/forms.js';
import { icons } from '../utils/icons.js';

const PREFIX = 'qf';
const { minAnswers, maxAnswers } = QUESTION_LIMITS;
let rowSeq = 0;

class QuestionForm extends HTMLElement {
  connectedCallback() {
    this.examId = this.examId ?? null;
    this.editingId = null;
    this.innerHTML = `
      <div class="form-mode">
        <div>
          <h2 class="card__title" data-title>Nueva pregunta</h2>
          <p class="card__subtitle" data-subtitle>Escribe el enunciado y sus posibles respuestas.</p>
        </div>
      </div>
      <form class="form-grid" novalidate>
        <div class="field">
          <label for="${PREFIX}-enunciado">Enunciado</label>
          <textarea id="${PREFIX}-enunciado" name="enunciado" rows="3" maxlength="300" required
            aria-describedby="${PREFIX}-enunciado-error"></textarea>
          <p class="field__error" id="${PREFIX}-enunciado-error"></p>
        </div>

        <fieldset class="answers" aria-describedby="${PREFIX}-answers-hint ${PREFIX}-respuestas-error ${PREFIX}-correcta-error">
          <legend>Respuestas</legend>
          <p class="field__hint" id="${PREFIX}-answers-hint">Marca el círculo de la respuesta correcta (solo una). Entre ${minAnswers} y ${maxAnswers} respuestas.</p>
          <ol class="answers__list" data-answers></ol>
          <p class="field__error" id="${PREFIX}-respuestas-error"></p>
          <p class="field__error" id="${PREFIX}-correcta-error"></p>
          <button class="btn btn--ghost btn--sm answers__add" type="button" data-action="add-answer">
            ${icons.plus}<span>Agregar respuesta</span>
          </button>
        </fieldset>

        <div class="form-actions">
          <button class="btn btn--primary" type="submit" data-submit>Agregar pregunta</button>
          <button class="btn btn--ghost" type="button" data-action="cancel" hidden>Cancelar edición</button>
        </div>
      </form>`;

    this.form = this.querySelector('form');
    this.list = this.querySelector('[data-answers]');
    this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    this.form.addEventListener('input', (event) => this.handleInput(event.target));
    this.form.addEventListener('change', (event) => this.handleInput(event.target));
    this.addEventListener('click', (event) => this.handleClick(event));
    this.resetAnswers();
  }

  // ---------- Filas de respuestas ----------

  addAnswer({ id = '', descripcion = '', correcta = false } = {}, { focus = false } = {}) {
    if (this.list.children.length >= maxAnswers) return;
    const key = `${PREFIX}-ans-${++rowSeq}`;
    const row = document.createElement('li');
    row.className = 'answer-row';
    row.dataset.id = id;
    row.innerHTML = `
      <label class="answer-row__correct" title="Marcar como correcta">
        <input type="radio" name="correcta">
        <span class="sr-only" data-radio-label></span>
      </label>
      <label class="sr-only" for="${key}" data-text-label></label>
      <input id="${key}" class="input" type="text" maxlength="150" data-answer>
      <button class="icon-btn icon-btn--danger" type="button" data-action="remove-answer">${icons.trash}</button>`;
    row.querySelector('[data-answer]').value = descripcion;
    row.querySelector('input[type="radio"]').checked = correcta;
    this.list.append(row);
    this.syncAnswers();
    if (focus) row.querySelector('[data-answer]').focus();
  }

  removeAnswer(row) {
    if (this.list.children.length <= minAnswers) return;
    const next = row.nextElementSibling ?? row.previousElementSibling;
    row.remove();
    this.syncAnswers();
    next?.querySelector('[data-answer]').focus();
  }

  resetAnswers(respuestas = []) {
    this.list.replaceChildren();
    respuestas.forEach((r) => this.addAnswer(r));
    while (this.list.children.length < minAnswers) this.addAnswer();
  }

  /** Renumera etiquetas y habilita/deshabilita los botones según los límites. */
  syncAnswers() {
    const rows = [...this.list.children];
    rows.forEach((row, i) => {
      const n = i + 1;
      row.querySelector('[data-radio-label]').textContent = `Marcar la respuesta ${n} como correcta`;
      row.querySelector('[data-text-label]').textContent = `Respuesta ${n}`;
      row.querySelector('[data-answer]').placeholder = `Respuesta ${n}`;
      const remove = row.querySelector('[data-action="remove-answer"]');
      remove.disabled = rows.length <= minAnswers;
      remove.setAttribute('aria-label', `Quitar la respuesta ${n}`);
    });
    this.querySelector('[data-action="add-answer"]').disabled = rows.length >= maxAnswers;
  }

  collectAnswers() {
    return [...this.list.children].map((row) => ({
      id: row.dataset.id || undefined,
      descripcion: row.querySelector('[data-answer]').value,
      correcta: row.querySelector('input[type="radio"]').checked,
    }));
  }

  // ---------- Modo edición ----------

  edit(question) {
    this.reset();
    this.editingId = question.id;
    this.form.elements.enunciado.value = question.enunciado;
    this.resetAnswers(question.respuestas);
    this.querySelector('[data-title]').textContent = 'Editar pregunta';
    this.querySelector('[data-subtitle]').textContent = 'Modifica el enunciado o las respuestas y guarda los cambios.';
    this.querySelector('[data-submit]').textContent = 'Guardar cambios';
    this.querySelector('[data-action="cancel"]').hidden = false;
    this.classList.add('is-editing');

    this.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    this.form.elements.enunciado.focus({ preventScroll: true });
    this.dispatchEvent(new CustomEvent('question:editing', { bubbles: true, detail: { id: question.id } }));
  }

  reset() {
    const wasEditing = this.editingId !== null;
    this.editingId = null;
    this.form.reset();
    this.clearErrors();
    this.resetAnswers();
    this.querySelector('[data-title]').textContent = 'Nueva pregunta';
    this.querySelector('[data-subtitle]').textContent = 'Escribe el enunciado y sus posibles respuestas.';
    this.querySelector('[data-submit]').textContent = 'Agregar pregunta';
    this.querySelector('[data-action="cancel"]').hidden = true;
    this.classList.remove('is-editing');
    if (wasEditing) this.dispatchEvent(new CustomEvent('question:editing', { bubbles: true, detail: { id: null } }));
  }

  // ---------- Errores ----------

  clearErrors() {
    clearFieldErrors(this.form);
    this.list.querySelectorAll('.answer-row.is-invalid').forEach((row) => row.classList.remove('is-invalid'));
  }

  showErrors(errors) {
    const first = showFieldErrors(this.form, errors, PREFIX);
    if (errors.respuestas) {
      const emptyInputs = [...this.list.querySelectorAll('[data-answer]')].filter((input) => !input.value.trim());
      emptyInputs.forEach((input) => input.setAttribute('aria-invalid', 'true'));
      if (!first) emptyInputs[0]?.focus();
    }
    if (errors.correcta) {
      this.list.querySelectorAll('.answer-row').forEach((row) => row.classList.add('is-invalid'));
      if (!first && !errors.respuestas) this.list.querySelector('input[type="radio"]')?.focus();
    }
  }

  // ---------- Eventos ----------

  handleInput(target) {
    if (target.name === 'enunciado') clearFieldError(this.form, target, PREFIX);
    if (target.matches('[data-answer]')) {
      target.removeAttribute('aria-invalid');
      this.querySelector(`#${PREFIX}-respuestas-error`).textContent = '';
    }
    if (target.type === 'radio') {
      this.list.querySelectorAll('.answer-row.is-invalid').forEach((row) => row.classList.remove('is-invalid'));
      this.querySelector(`#${PREFIX}-correcta-error`).textContent = '';
    }
  }

  handleClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const { action } = button.dataset;
    if (action === 'add-answer') this.addAnswer({}, { focus: true });
    if (action === 'remove-answer') this.removeAnswer(button.closest('.answer-row'));
    if (action === 'cancel') this.reset();
  }

  handleSubmit(event) {
    event.preventDefault();
    this.clearErrors();
    const data = { enunciado: this.form.elements.enunciado.value, respuestas: this.collectAnswers() };

    try {
      const mode = this.editingId ? 'update' : 'create';
      const question = mode === 'update'
        ? updateQuestion(this.examId, this.editingId, data)
        : addQuestion(this.examId, data);
      toast(mode === 'update' ? 'Pregunta actualizada.' : 'Pregunta agregada.', 'success');
      this.reset();
      this.form.elements.enunciado.focus();
      this.dispatchEvent(new CustomEvent('question:saved', { bubbles: true, detail: { question, mode } }));
    } catch (error) {
      if (error instanceof ValidationError) {
        this.showErrors(error.errors);
        toast(error.message, 'warning');
      } else {
        console.error(error);
        toast(error.message, 'error');
      }
    }
  }
}

customElements.define('question-form', QuestionForm);
