/**
 * <app-navbar>: barra de navegación. Muestra los módulos privados solo si
 * hay sesión iniciada y se actualiza al cambiar la sesión o la ruta.
 */
import { getCurrentUser, logout } from '../services/auth.service.js';
import { navigate } from '../router.js';
import { escapeHtml, initials, toast } from '../utils/dom.js';
import { icons } from '../utils/icons.js';

const PRIVATE_LINKS = [
  { path: '/examenes', label: 'Exámenes' },
  { path: '/usuarios', label: 'Usuarios' },
];

class AppNavbar extends HTMLElement {
  connectedCallback() {
    this.onAuthChange = () => this.render();
    this.onRouteChange = (event) => this.highlight(event.detail.path);
    window.addEventListener('auth:change', this.onAuthChange);
    window.addEventListener('route:change', this.onRouteChange);
    this.addEventListener('click', (event) => this.handleClick(event));
    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.toggleMenu(false);
    });
    this.render();
  }

  disconnectedCallback() {
    window.removeEventListener('auth:change', this.onAuthChange);
    window.removeEventListener('route:change', this.onRouteChange);
  }

  render() {
    const user = getCurrentUser();
    const menu = user
      ? `
        <button class="icon-btn navbar__toggle" type="button" data-action="toggle"
          aria-expanded="false" aria-controls="nav-menu" aria-label="Abrir menú">${icons.menu}</button>
        <nav class="navbar__menu" id="nav-menu" aria-label="Principal">
          <ul class="navbar__links">
            ${PRIVATE_LINKS.map((l) => `<li><a href="#${l.path}" data-path="${l.path}">${l.label}</a></li>`).join('')}
          </ul>
          <div class="navbar__user">
            <span class="avatar" aria-hidden="true">${escapeHtml(initials(user.nombre))}</span>
            <span class="navbar__user-info">
              <span class="navbar__user-name">${escapeHtml(user.nombre)}</span>
              <span class="navbar__user-role">${escapeHtml(user.cargo)}</span>
            </span>
            <button class="btn btn--ghost btn--sm" type="button" data-action="logout">Cerrar sesión</button>
          </div>
        </nav>`
      : '';

    this.innerHTML = `
      <header class="navbar">
        <div class="navbar__inner container">
          <a class="brand" href="#/" aria-label="Acme School, inicio">
            ${icons.logo}<span>Acme<strong>School</strong></span>
          </a>
          ${menu}
        </div>
      </header>`;
    this.highlight(location.hash.slice(1));
  }

  highlight(path) {
    this.querySelectorAll('[data-path]').forEach((link) => {
      const active = path.startsWith(link.dataset.path);
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    this.toggleMenu(false);
  }

  toggleMenu(force) {
    const toggle = this.querySelector('[data-action="toggle"]');
    const menu = this.querySelector('.navbar__menu');
    if (!toggle || !menu) return;
    const open = force ?? toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    toggle.innerHTML = open ? icons.close : icons.menu;
    menu.classList.toggle('is-open', open);
  }

  handleClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'toggle') this.toggleMenu();
    if (action === 'logout') {
      logout();
      toast('Sesión cerrada correctamente.', 'success');
      navigate('/login');
    }
  }
}

customElements.define('app-navbar', AppNavbar);
