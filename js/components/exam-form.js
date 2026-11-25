/**
 * <exam-form>: formulario de creación y actualización de exámenes.
 * Emite "exam:saved" (bubbles) con { exam, mode } y "exam:editing" con { id }.
 */
import { createExam, getExam, updateExam } from '../services/exams.service.js';
import { getCurrentUser } from '../services/auth.service.js';
import { ValidationError } from '../utils/errors.js';
import { formToObject, prefersReducedMotion, toast } from '../utils/dom.js';
import { clearFieldError, clearFieldErrors, showFieldErrors } from '../utils/forms.js';

const PREFIX = 'ef';
const EDITABLE = ['codigo', 'titulo', 'tiempo', 'porcentajeAprobacion', 'descripcion'];

const field = (name, label, control, hint = '') => `
  <div class="field">
    <label for="${PREFIX}-${name}">${label}</label>
    ${control}
    ${hint ? `<p class="field__hint" id="${PREFIX}-${name}-hint">${hint}</p>` : ''}
    <p class="field__error" id="${PREFIX}-${name}-error"></p>
  </div>`;

const describedBy = (name, withHint = false) =>
  `aria-describedby="${withHint ? `${PREFIX}-${name}-hint ` : ''}${PREFIX}-${name}-error"`;

class ExamForm extends HTMLElement {
  connectedCallback() {
    this.editingId = null;
    this.innerHTML = `
      <div class="form-mode">
        <div>
          <h2 class="card__title" data-title>Nuevo examen</h2>
          <p class="card__subtitle" data-subtitle>Define los datos generales; las preguntas se agregan después.</p>
        </div>
      </div>
      <form class="form-grid" novalidate>
        ${field('codigo', 'Código',
          `<input id="${PREFIX}-codigo" name="codigo" type="text" maxlength="20" autocomplete="off"
             class="input--upper" placeholder="JS-101" required ${describedBy('codigo', true)}>`,
          'Letras, números o guiones. Debe ser único.')}
        ${field('titulo', 'Título',
          `<input id="${PREFIX}-titulo" name="titulo" type="text" maxlength="100" required ${describedBy('titulo')}>`)}
        <div class="field-row">
          ${field('tiempo', 'Tiempo (minutos)',
            `<input id="${PREFIX}-tiempo" name="tiempo" type="number" inputmode="numeric" min="1" max="300" step="1" required ${describedBy('tiempo')}>`)}
          ${field('porcentajeAprobacion', 'Aprobación (%)',
            `<input id="${PREFIX}-porcentajeAprobacion" name="porcentajeAprobacion" type="number" inputmode="numeric" min="1" max="100" step="1" required ${describedBy('porcentajeAprobacion')}>`)}
        </div>
        ${field('descripcion', 'Descripción del examen',
          `<textarea id="${PREFIX}-descripcion" name="descripcion" rows="4" maxlength="500" required ${describedBy('descripcion', true)}></textarea>`,
          '<span data-counter>0</span>/500 caracteres')}

        <div class="form-actions">
          <button class="btn btn--primary" type="submit" data-submit>Crear examen</button>
          <button class="btn btn--ghost" type="button" data-action="cancel" hidden>Cancelar edición</button>
        </div>
      </form>`;

    this.form = this.querySelector('form');
    this.counter = this.querySelector('[data-counter]');
    this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    this.form.addEventListener('input', (event) => {
      clearFieldError(this.form, event.target, PREFIX);
      if (event.target.name === 'descripcion') this.updateCounter();
    });
    this.querySelector('[data-action="cancel"]').addEventListener('click', () => this.reset());
  }

  updateCounter() {
    this.counter.textContent = this.form.elements.descripcion.value.length;
  }

  edit(id) {
    const exam = getExam(id);
    if (!exam) {
      toast('El examen ya no existe.', 'error');
      return;
    }
    this.reset();
    this.editingId = id;
    EDITABLE.forEach((name) => { this.form.elements[name].value = exam[name]; });
    this.updateCounter();
    this.querySelector('[data-title]').textContent = 'Editar examen';
    this.querySelector('[data-subtitle]').textContent = `Estás modificando "${exam.titulo}".`;
    this.querySelector('[data-submit]').textContent = 'Guardar cambios';
    this.querySelector('[data-action="cancel"]').hidden = false;
    this.classList.add('is-editing');

    this.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    this.form.elements.titulo.focus({ preventScroll: true });
    this.dispatchEvent(new CustomEvent('exam:editing', { bubbles: true, detail: { id } }));
  }

  reset() {
    const wasEditing = this.editingId !== null;
    this.editingId = null;
    this.form.reset();
    clearFieldErrors(this.form);
    this.updateCounter();
    this.querySelector('[data-title]').textContent = 'Nuevo examen';
    this.querySelector('[data-subtitle]').textContent = 'Define los datos generales; las preguntas se agregan después.';
    this.querySelector('[data-submit]').textContent = 'Crear examen';
    this.querySelector('[data-action="cancel"]').hidden = true;
    this.classList.remove('is-editing');
    if (wasEditing) this.dispatchEvent(new CustomEvent('exam:editing', { bubbles: true, detail: { id: null } }));
  }

  handleSubmit(event) {
    event.preventDefault();
    clearFieldErrors(this.form);
    const data = formToObject(this.form);

    try {
      const mode = this.editingId ? 'update' : 'create';
      const exam = mode === 'update'
        ? updateExam(this.editingId, data)
        : createExam(data, { createdBy: getCurrentUser()?.id ?? null });
      toast(mode === 'update' ? 'Examen actualizado.' : 'Examen creado. Ahora agrégale preguntas.', 'success');
      this.reset();
      this.dispatchEvent(new CustomEvent('exam:saved', { bubbles: true, detail: { exam, mode } }));
    } catch (error) {
      if (error instanceof ValidationError) {
        showFieldErrors(this.form, error.errors, PREFIX);
        toast(error.message, 'warning');
      } else {
        console.error(error);
        toast(error.message, 'error');
      }
    }
  }
}

customElements.define('exam-form', ExamForm);
