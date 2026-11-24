/**
 * <app-toast>: región de notificaciones accesible (aria-live).
 * Escucha el evento global "app:toast" que emite utils/dom.js → toast().
 */
const DURATION = 3500;

class AppToast extends HTMLElement {
  connectedCallback() {
    this.classList.add('toast-region');
    this.setAttribute('role', 'status');
    this.setAttribute('aria-live', 'polite');
    this.onToast = (event) => this.show(event.detail);
    window.addEventListener('app:toast', this.onToast);
  }

  disconnectedCallback() {
    window.removeEventListener('app:toast', this.onToast);
  }

  show({ message, type = 'info' }) {
    const item = document.createElement('div');
    item.className = `toast toast--${type}`;
    item.textContent = message;
    this.append(item);

    setTimeout(() => {
      item.classList.add('is-leaving');
      item.addEventListener('animationend', () => item.remove(), { once: true });
      setTimeout(() => item.remove(), 500); // respaldo si no hay animación
    }, DURATION);
  }
}

customElements.define('app-toast', AppToast);
