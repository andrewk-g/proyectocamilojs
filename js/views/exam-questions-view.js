/**
 * <exam-questions-view>: gestión de las preguntas de un examen (ruta
 * privada #/examenes/:id/preguntas). Orquesta <question-form> y <question-list>.
 */
import '../components/question-form.js';
import '../components/question-list.js';
import { deleteQuestion, getExam } from '../services/exams.service.js';
import { confirmDialog, toast } from '../utils/dom.js';
import { icons } from '../utils/icons.js';

class ExamQuestionsView extends HTMLElement {
  connectedCallback() {
    this.examId = this.params?.id;
    const exam = getExam(this.examId);
    if (!exam) {
      this.renderNotFound();
      return;
    }

    this.innerHTML = `
      <section class="page container">
        <a class="back-link" href="#/examenes">${icons.arrowLeft}<span>Volver a exámenes</span></a>
        <header class="page__header">
          <div>
            <p class="eyebrow">Examen · <span data-code></span></p>
            <h1 class="page__title" data-title></h1>
            <ul class="meta-list" aria-label="Datos del examen">
              <li>${icons.clock}<span data-time></span></li>
              <li>${icons.target}<span data-pass></span></li>
            </ul>
          </div>
          <div class="stat" aria-live="polite">
            <span class="stat__value" data-count>0</span>
            <span class="stat__label">preguntas</span>
          </div>
        </header>
        <div class="page__grid page__grid--wide-form">
          <question-form class="card"></question-form>
          <question-list class="card"></question-list>
        </div>
      </section>`;

    this.form = this.querySelector('question-form');
    this.form.examId = this.examId;
    this.list = this.querySelector('question-list');

    this.addEventListener('question:saved', () => this.refresh());
    this.addEventListener('question:edit', (event) => this.handleEdit(event.detail.id));
    this.addEventListener('question:editing', (event) => { this.list.selectedId = event.detail.id; });
    this.addEventListener('question:delete', (event) => this.handleDelete(event.detail.id));

    this.refresh();
  }

  renderNotFound() {
    this.innerHTML = `
      <section class="page container">
        <div class="card empty">
          <span class="empty__icon">${icons.file}</span>
          <p class="empty__title">No encontramos este examen</p>
          <p>Puede que haya sido eliminado.</p>
          <a class="btn btn--primary" href="#/examenes">Ir a exámenes</a>
        </div>
      </section>`;
  }

  /** Devuelve el examen actualizado o muestra "no encontrado" si se eliminó. */
  currentExam() {
    const exam = getExam(this.examId);
    if (!exam) this.renderNotFound();
    return exam;
  }

  refresh() {
    const exam = this.currentExam();
    if (!exam) return;
    this.querySelector('[data-code]').textContent = exam.codigo;
    this.querySelector('[data-title]').textContent = exam.titulo;
    this.querySelector('[data-time]').textContent = `${exam.tiempo} minutos`;
    this.querySelector('[data-pass]').textContent = `Aprueba con ${exam.porcentajeAprobacion}%`;
    this.querySelector('[data-count]').textContent = exam.preguntas.length;
    this.list.questions = exam.preguntas;
    document.title = `Preguntas · ${exam.titulo} · Acme School`;
  }

  handleEdit(id) {
    const question = this.currentExam()?.preguntas.find((q) => q.id === id);
    if (!question) {
      toast('La pregunta ya no existe.', 'error');
      this.refresh();
      return;
    }
    this.form.edit(question);
  }

  async handleDelete(id) {
    const exam = this.currentExam();
    const index = exam?.preguntas.findIndex((q) => q.id === id) ?? -1;
    if (index === -1) {
      this.refresh();
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Eliminar pregunta',
      message: `Se eliminará la pregunta ${index + 1} con sus respuestas. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;

    try {
      deleteQuestion(this.examId, id);
      if (this.form.editingId === id) this.form.reset();
      toast('Pregunta eliminada.', 'success');
      this.refresh();
    } catch (error) {
      toast(error.message, 'error');
    }
  }
}

customElements.define('exam-questions-view', ExamQuestionsView);
