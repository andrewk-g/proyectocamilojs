/**
 * <users-view>: módulo privado de gestión de usuarios.
 * Orquesta <user-form> y <user-table> mediante eventos personalizados.
 */
import '../components/user-form.js';
import '../components/user-table.js';
import { deleteUser, getUser, listUsers } from '../services/users.service.js';
import { getCurrentUser } from '../services/auth.service.js';
import { confirmDialog, toast } from '../utils/dom.js';

class UsersView extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="page container">
        <header class="page__header">
          <div>
            <p class="eyebrow">Administración</p>
            <h1 class="page__title">Gestión de usuarios</h1>
            <p class="page__subtitle">Crea, actualiza o elimina las cuentas que pueden acceder a los módulos privados de la plataforma.</p>
          </div>
          <div class="stat" aria-live="polite">
            <span class="stat__value" data-count>0</span>
            <span class="stat__label">usuarios registrados</span>
          </div>
        </header>
        <div class="page__grid">
          <user-form class="card"></user-form>
          <user-table class="card"></user-table>
        </div>
      </section>`;

    this.form = this.querySelector('user-form');
    this.table = this.querySelector('user-table');

    this.addEventListener('user:saved', () => this.refresh());
    this.addEventListener('user:edit', (event) => this.form.edit(event.detail.id));
    this.addEventListener('user:editing', (event) => { this.table.selectedId = event.detail.id; });
    this.addEventListener('user:delete', (event) => this.handleDelete(event.detail.id));

    this.refresh();
  }

  refresh() {
    const users = listUsers();
    this.table.users = users;
    this.querySelector('[data-count]').textContent = users.length;
  }

  async handleDelete(id) {
    const user = getUser(id);
    const me = getCurrentUser();
    if (!user) {
      this.refresh();
      return;
    }
    if (user.id === me?.id) {
      toast('No puedes eliminar la cuenta con la que iniciaste sesión.', 'warning');
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Eliminar usuario',
      message: `Se eliminará la cuenta de ${user.nombre}. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;

    try {
      deleteUser(id, { currentUserId: me?.id });
      if (this.form.editingId === id) this.form.reset();
      toast('Usuario eliminado.', 'success');
      this.refresh();
    } catch (error) {
      toast(error.message, 'error');
    }
  }
}

customElements.define('users-view', UsersView);
