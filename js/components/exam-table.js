/**
 * <exam-table>: tabla de exámenes con búsqueda.
 * Propiedades: exams (array), selectedId (string|null).
 * Emite "exam:edit" y "exam:delete" (bubbles) con { id }.
 */
import { escapeHtml } from '../utils/dom.js';
import { icons } from '../utils/icons.js';

const COLUMNS = ['Código', 'Título', 'Tiempo', 'Aprobación', 'Preguntas'];

const questionsBadge = (count) => (count === 0
  ? '<span class="badge badge--danger">Sin preguntas</span>'
  : `<span class="badge badge--success">${count} ${count === 1 ? 'pregunta' : 'preguntas'}</span>`);

class ExamTable extends HTMLElement {
  constructor() {
    super();
    this._exams = [];
    this._selectedId = null;
    this.query = '';
  }

  set exams(value) {
    this._exams = Array.isArray(value) ? value : [];
    this.renderRows();
  }

  set selectedId(value) {
    this._selectedId = value;
    this.querySelectorAll('tbody tr').forEach((row) => {
      row.classList.toggle('is-selected', row.dataset.id === value);
    });
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="table-toolbar">
        <h2 class="card__title">Exámenes registrados</h2>
        <label class="search">
          <span class="sr-only">Buscar examen</span>
          ${icons.search}
          <input type="search" placeholder="Buscar examen…" title="Busca por código o título" data-search>
        </label>
      </div>
      <div class="table-wrap">
        <table class="table">
          <caption class="sr-only">Listado de exámenes con acciones para gestionar preguntas, editar o eliminar</caption>
          <thead>
            <tr>
              ${COLUMNS.map((c) => `<th scope="col">${c}</th>`).join('')}
              <th scope="col"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="empty" hidden>
        <span class="empty__icon">${icons.file}</span>
        <p class="empty__title" data-empty-title></p>
        <p data-empty-text></p>
      </div>`;

    this.querySelector('[data-search]').addEventListener('input', (event) => {
      this.query = event.target.value.trim().toLowerCase();
      this.renderRows();
    });

    this.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const id = button.closest('tr').dataset.id;
      this.dispatchEvent(new CustomEvent(`exam:${button.dataset.action}`, { bubbles: true, detail: { id } }));
    });

    this.renderRows();
  }

  filtered() {
    if (!this.query) return this._exams;
    return this._exams.filter((e) =>
      [e.codigo, e.titulo].some((v) => v.toLowerCase().includes(this.query)));
  }

  renderRows() {
    const tbody = this.querySelector('tbody');
    if (!tbody) return;
    const exams = this.filtered();

    tbody.innerHTML = exams.map((e, i) => {
      const id = escapeHtml(e.id);
      const title = escapeHtml(e.titulo);
      return `
        <tr data-id="${id}" class="${e.id === this._selectedId ? 'is-selected' : ''}" style="animation-delay:${Math.min(i, 10) * 25}ms">
          <td data-label="Código" class="nowrap"><span class="code">${escapeHtml(e.codigo)}</span></td>
          <td data-label="Título" class="cell-main">${title}</td>
          <td data-label="Tiempo" class="nowrap">${e.tiempo} min</td>
          <td data-label="Aprobación" class="nowrap">${e.porcentajeAprobacion}%</td>
          <td data-label="Preguntas">${questionsBadge(e.preguntas.length)}</td>
          <td class="table__actions">
            <a class="icon-btn" href="#/examenes/${encodeURIComponent(e.id)}/preguntas" aria-label="Gestionar preguntas de ${title}" title="Preguntas">${icons.list}</a>
            <button class="icon-btn" type="button" data-action="edit" aria-label="Editar ${title}" title="Editar">${icons.edit}</button>
            <button class="icon-btn icon-btn--danger" type="button" data-action="delete" aria-label="Eliminar ${title}" title="Eliminar">${icons.trash}</button>
          </td>
        </tr>`;
    }).join('');

    const empty = exams.length === 0;
    this.querySelector('.table-wrap').hidden = empty;
    this.querySelector('.empty').hidden = !empty;
    if (empty) {
      this.querySelector('[data-empty-title]').textContent = this.query ? 'Sin resultados' : 'Aún no hay exámenes';
      this.querySelector('[data-empty-text]').textContent = this.query
        ? 'Prueba con otro código o título.'
        : 'Crea el primero con el formulario.';
    }
  }
}

customElements.define('exam-table', ExamTable);
