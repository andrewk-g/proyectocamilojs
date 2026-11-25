/**
 * <user-form>: formulario de creación y actualización de usuarios.
 * Emite "user:saved" (bubbles) con { user, mode } al guardar.
 */
import { createUser, getUser, updateUser, ValidationError } from '../services/users.service.js';
import { CARGOS } from '../utils/validators.js';
import { formToObject, prefersReducedMotion, toast } from '../utils/dom.js';
import { clearFieldError, clearFieldErrors, showFieldErrors, togglePasswordVisibility } from '../utils/forms.js';

const FIELDS = [
  { name: 'identificacion', label: 'Número de identificación', attrs: 'inputmode="numeric" autocomplete="off" maxlength="15"' },
  { name: 'nombre', label: 'Nombre completo', attrs: 'autocomplete="name" maxlength="80"' },
  { name: 'email', label: 'Email', type: 'email', attrs: 'autocomplete="email" maxlength="120"' },
  { name: 'telefono', label: 'Teléfono', type: 'tel', attrs: 'autocomplete="tel" maxlength="20"' },
];

const inputField = ({ name, label, type = 'text', attrs = '' }) => `
  <div class="field">
    <label for="uf-${name}">${label}</label>
    <input id="uf-${name}" name="${name}" type="${type}" ${attrs} required aria-describedby="uf-${name}-error">
    <p class="field__error" id="uf-${name}-error"></p>
  </div>`;

class UserForm extends HTMLElement {
  connectedCallback() {
    this.editingId = null;
    this.innerHTML = `
      <div class="form-mode">
        <div>
          <h2 class="card__title" data-title>Nuevo usuario</h2>
          <p class="card__subtitle" data-subtitle>Completa los datos para crear una cuenta.</p>
        </div>
      </div>
      <form class="form-grid" novalidate>
        ${FIELDS.map(inputField).join('')}

        <div class="field">
          <label for="uf-cargo">Cargo</label>
          <select id="uf-cargo" name="cargo" required aria-describedby="uf-cargo-error">
            <option value="">Selecciona un cargo</option>
            ${CARGOS.map((c) => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <p class="field__error" id="uf-cargo-error"></p>
        </div>

        <div class="field">
          <label for="uf-password" data-password-label>Contraseña</label>
          <div class="input-group">
            <input id="uf-password" name="password" type="password" autocomplete="new-password"
              aria-describedby="uf-password-hint uf-password-error">
            <button class="input-group__btn" type="button" data-action="toggle-password"
              aria-pressed="false" aria-controls="uf-password">Mostrar</button>
          </div>
          <p class="field__hint" id="uf-password-hint">Mínimo 8 caracteres, con letras y números.</p>
          <p class="field__error" id="uf-password-error"></p>
        </div>

        <div class="form-actions">
          <button class="btn btn--primary" type="submit" data-submit>Crear usuario</button>
          <button class="btn btn--ghost" type="button" data-action="cancel" hidden>Cancelar edición</button>
        </div>
      </form>`;

    this.form = this.querySelector('form');
    this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    this.form.addEventListener('input', (event) => this.clearFieldError(event.target));
    this.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'cancel') this.reset();
      if (action === 'toggle-password') this.togglePassword(event.target.closest('button'));
    });
  }

  /** Carga un usuario en el formulario para editarlo. */
  edit(id) {
    const user = getUser(id);
    if (!user) {
      toast('El usuario ya no existe.', 'error');
      return;
    }
    this.reset();
    this.editingId = id;
    for (const name of ['identificacion', 'nombre', 'email', 'telefono', 'cargo']) {
      this.form.elements[name].value = user[name];
    }
    this.querySelector('[data-title]').textContent = 'Editar usuario';
    this.querySelector('[data-subtitle]').textContent = `Estás modificando a ${user.nombre}.`;
    this.querySelector('[data-password-label]').textContent = 'Nueva contraseña (opcional)';
    this.querySelector('[data-submit]').textContent = 'Guardar cambios';
    this.querySelector('[data-action="cancel"]').hidden = false;
    this.classList.add('is-editing');

    this.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    this.form.elements.nombre.focus({ preventScroll: true });
    this.dispatchEvent(new CustomEvent('user:editing', { bubbles: true, detail: { id } }));
  }

  reset() {
    const wasEditing = this.editingId !== null;
    this.editingId = null;
    this.form.reset();
    this.clearErrors();
    this.querySelector('[data-title]').textContent = 'Nuevo usuario';
    this.querySelector('[data-subtitle]').textContent = 'Completa los datos para crear una cuenta.';
    this.querySelector('[data-password-label]').textContent = 'Contraseña';
    this.querySelector('[data-submit]').textContent = 'Crear usuario';
    this.querySelector('[data-action="cancel"]').hidden = true;
    this.classList.remove('is-editing');
    const passwordInput = this.form.elements.password;
    passwordInput.type = 'password';
    if (wasEditing) this.dispatchEvent(new CustomEvent('user:editing', { bubbles: true, detail: { id: null } }));
  }

  togglePassword(button) {
    togglePasswordVisibility(this.form.elements.password, button);
  }

  clearFieldError(input) {
    clearFieldError(this.form, input, 'uf');
  }

  clearErrors() {
    clearFieldErrors(this.form);
  }

  showErrors(errors) {
    showFieldErrors(this.form, errors, 'uf');
  }

  async handleSubmit(event) {
    event.preventDefault();
    this.clearErrors();
    const data = formToObject(this.form);
    const submit = this.querySelector('[data-submit]');
    const label = submit.textContent;
    submit.disabled = true;
    submit.textContent = 'Guardando…';

    try {
      const mode = this.editingId ? 'update' : 'create';
      const user = mode === 'update'
        ? await updateUser(this.editingId, data)
        : await createUser(data);
      toast(mode === 'update' ? 'Usuario actualizado.' : 'Usuario creado correctamente.', 'success');
      this.reset();
      this.dispatchEvent(new CustomEvent('user:saved', { bubbles: true, detail: { user, mode } }));
    } catch (error) {
      if (error instanceof ValidationError) {
        this.showErrors(error.errors);
        toast(error.message, 'warning');
      } else {
        console.error(error);
        toast(error.message, 'error');
      }
    } finally {
      submit.disabled = false;
      if (submit.textContent === 'Guardando…') submit.textContent = label;
    }
  }
}

customElements.define('user-form', UserForm);
