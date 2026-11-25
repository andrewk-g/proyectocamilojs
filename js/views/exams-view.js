/**
 * <exams-view>: módulo privado de gestión de exámenes.
 * Orquesta <exam-form> y <exam-table> mediante eventos personalizados.
 */
import '../components/exam-form.js';
import '../components/exam-table.js';
import { deleteExam, getExam, listExams } from '../services/exams.service.js';
import { navigate } from '../router.js';
import { confirmDialog, toast } from '../utils/dom.js';

class ExamsView extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="page container">
        <header class="page__header">
          <div>
            <p class="eyebrow">Evaluación</p>
            <h1 class="page__title">Gestión de exámenes</h1>
            <p class="page__subtitle">Crea, actualiza o elimina exámenes y administra las preguntas de cada uno.</p>
          </div>
          <div class="stat" aria-live="polite">
            <span class="stat__value" data-count>0</span>
            <span class="stat__label">exámenes registrados</span>
          </div>
        </header>
        <div class="page__grid">
          <exam-form class="card"></exam-form>
          <exam-table class="card"></exam-table>
        </div>
      </section>`;

    this.form = this.querySelector('exam-form');
    this.table = this.querySelector('exam-table');

    this.addEventListener('exam:saved', (event) => {
      // Un examen nuevo no tiene preguntas: se lleva al usuario directo a crearlas.
      if (event.detail.mode === 'create') navigate(`/examenes/${event.detail.exam.id}/preguntas`);
      else this.refresh();
    });
    this.addEventListener('exam:edit', (event) => this.form.edit(event.detail.id));
    this.addEventListener('exam:editing', (event) => { this.table.selectedId = event.detail.id; });
    this.addEventListener('exam:delete', (event) => this.handleDelete(event.detail.id));

    this.refresh();
  }

  refresh() {
    const exams = listExams();
    this.table.exams = exams;
    this.querySelector('[data-count]').textContent = exams.length;
  }

  async handleDelete(id) {
    const exam = getExam(id);
    if (!exam) {
      this.refresh();
      return;
    }
    const count = exam.preguntas.length;
    const confirmed = await confirmDialog({
      title: 'Eliminar examen',
      message: `Se eliminará "${exam.titulo}"${count ? ` junto con sus ${count} preguntas` : ''}. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;

    try {
      deleteExam(id);
      if (this.form.editingId === id) this.form.reset();
      toast('Examen eliminado.', 'success');
      this.refresh();
    } catch (error) {
      toast(error.message, 'error');
    }
  }
}

customElements.define('exams-view', ExamsView);
