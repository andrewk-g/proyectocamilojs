/**
 * <user-table>: tabla de usuarios con búsqueda.
 * Propiedades: users (array), selectedId (string|null).
 * Emite "user:edit" y "user:delete" (bubbles) con { id }.
 */
import { escapeHtml } from '../utils/dom.js';
import { icons } from '../utils/icons.js';

const COLUMNS = ['Identificación', 'Nombre', 'Email', 'Teléfono', 'Cargo'];

class UserTable extends HTMLElement {
  constructor() {
    super();
    this._users = [];
    this._selectedId = null;
    this.query = '';
  }

  set users(value) {
    this._users = Array.isArray(value) ? value : [];
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
        <h2 class="card__title">Usuarios registrados</h2>
        <label class="search">
          <span class="sr-only">Buscar usuario</span>
          ${icons.search}
          <input type="search" placeholder="Buscar usuario…" title="Busca por nombre, email o identificación" data-search>
        </label>
      </div>
      <div class="table-wrap">
        <table class="table">
          <caption class="sr-only">Listado de usuarios con acciones para editar o eliminar</caption>
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
        <span class="empty__icon">${icons.users}</span>
        <p class="empty__title" data-empty-title></p>
        <p data-empty-text></p>
      </div>`;

    this.querySelector('[data-search]').addEventListener('input', (event) => {
      this.query = event.target.value.trim().toLowerCase();
      this.renderRows();
    });

    this.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const id = button.closest('tr').dataset.id;
      this.dispatchEvent(new CustomEvent(`user:${button.dataset.action}`, { bubbles: true, detail: { id } }));
    });

    this.renderRows();
  }

  filtered() {
    if (!this.query) return this._users;
    return this._users.filter((u) =>
      [u.nombre, u.email, u.identificacion].some((v) => v.toLowerCase().includes(this.query)));
  }

  renderRows() {
    const tbody = this.querySelector('tbody');
    if (!tbody) return;
    const users = this.filtered();

    tbody.innerHTML = users.map((u, i) => `
      <tr data-id="${escapeHtml(u.id)}" class="${u.id === this._selectedId ? 'is-selected' : ''}" style="animation-delay:${Math.min(i, 10) * 25}ms">
        <td data-label="Identificación" class="nowrap">${escapeHtml(u.identificacion)}</td>
        <td data-label="Nombre" class="cell-main">${escapeHtml(u.nombre)}</td>
        <td data-label="Email">${escapeHtml(u.email)}</td>
        <td data-label="Teléfono" class="nowrap">${escapeHtml(u.telefono)}</td>
        <td data-label="Cargo">
          <span class="badge ${u.cargo === 'Docente' ? 'badge--accent' : 'badge--primary'}">${escapeHtml(u.cargo)}</span>
        </td>
        <td class="table__actions">
          <button class="icon-btn" type="button" data-action="edit" aria-label="Editar a ${escapeHtml(u.nombre)}" title="Editar">${icons.edit}</button>
          <button class="icon-btn icon-btn--danger" type="button" data-action="delete" aria-label="Eliminar a ${escapeHtml(u.nombre)}" title="Eliminar">${icons.trash}</button>
        </td>
      </tr>`).join('');

    const empty = users.length === 0;
    this.querySelector('.table-wrap').hidden = empty;
    this.querySelector('.empty').hidden = !empty;
    if (empty) {
      this.querySelector('[data-empty-title]').textContent = this.query ? 'Sin resultados' : 'Aún no hay usuarios';
      this.querySelector('[data-empty-text]').textContent = this.query
        ? 'Prueba con otro nombre, email o identificación.'
        : 'Crea el primero con el formulario.';
    }
  }
}

customElements.define('user-table', UserTable);
