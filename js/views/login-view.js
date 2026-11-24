/**
 * <login-view>: vista inicial de los módulos privados.
 */
import { login } from '../services/auth.service.js';
import { consumeRedirect, navigate } from '../router.js';
import { formToObject, toast } from '../utils/dom.js';
import { icons } from '../utils/icons.js';

const FEATURES = [
  'Gestión de usuarios administrativos y docentes',
  'Exámenes con preguntas de selección única',
  'Resolución pública con reloj en tiempo real',
];

class LoginView extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="auth">
        <div class="auth__brand">
          <p class="eyebrow">Acme School</p>
          <h1 class="auth__title">Evalúa, aprende y avanza.</h1>
          <p class="auth__lead">Crea exámenes, gestiona a tu equipo y deja que tus estudiantes los presenten desde cualquier dispositivo.</p>
          <ul class="auth__features">
            ${FEATURES.map((f) => `<li>${icons.check}<span>${f}</span></li>`).join('')}
          </ul>
        </div>

        <div class="auth__panel">
          <form class="card auth__card" novalidate>
            <h2>Iniciar sesión</h2>
            <p class="muted">Ingresa con tu correo y contraseña.</p>

            <div class="form-grid">
              <div class="field">
                <label for="login-email">Correo electrónico</label>
                <input id="login-email" name="email" type="email" autocomplete="username"
                  placeholder="nombre@acmeschool.edu" required>
              </div>

              <div class="field">
                <label for="login-password">Contraseña</label>
                <div class="input-group">
                  <input id="login-password" name="password" type="password"
                    autocomplete="current-password" required>
                  <button class="input-group__btn" type="button" data-action="toggle-password"
                    aria-pressed="false" aria-controls="login-password">Mostrar</button>
                </div>
              </div>

              <p class="form-error" role="alert" hidden></p>

              <button class="btn btn--primary btn--block" type="submit">Ingresar</button>
            </div>
            <p class="auth__hint">¿Primera vez? La cuenta inicial está en el README del proyecto.</p>
          </form>
        </div>
      </section>`;

    this.form = this.querySelector('form');
    this.errorBox = this.querySelector('.form-error');
    this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    this.querySelector('[data-action="toggle-password"]').addEventListener('click', (e) => this.togglePassword(e.currentTarget));
    this.form.addEventListener('input', () => { this.errorBox.hidden = true; });
    this.querySelector('#login-email').focus();
  }

  togglePassword(button) {
    const input = this.querySelector('#login-password');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.textContent = show ? 'Ocultar' : 'Mostrar';
    button.setAttribute('aria-pressed', String(show));
  }

  showError(message) {
    this.errorBox.textContent = message;
    this.errorBox.hidden = false;
    this.form.classList.remove('shake');
    void this.form.offsetWidth; // reinicia la animación
    this.form.classList.add('shake');
  }

  async handleSubmit(event) {
    event.preventDefault();
    const { email, password } = formToObject(this.form);
    if (!email.trim() || !password) {
      this.showError('Escribe tu correo y tu contraseña.');
      return;
    }

    const submit = this.form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Ingresando…';
    try {
      const user = await login(email, password);
      toast(`¡Hola, ${user.nombre}!`, 'success');
      navigate(consumeRedirect());
    } catch (error) {
      this.showError(error.message);
      const passwordInput = this.querySelector('#login-password');
      passwordInput.value = '';
      passwordInput.focus();
      submit.disabled = false;
      submit.textContent = 'Ingresar';
    }
  }
}

customElements.define('login-view', LoginView);
