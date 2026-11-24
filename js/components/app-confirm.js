/**
 * <app-confirm>: diálogo modal de confirmación basado en <dialog>.
 * open({ title, message, confirmText, variant }) → Promise<boolean>
 */
class AppConfirm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <dialog class="modal" aria-labelledby="confirm-title" aria-describedby="confirm-text">
        <form method="dialog" class="modal__body">
          <h2 class="modal__title" id="confirm-title"></h2>
          <p class="modal__text" id="confirm-text"></p>
          <div class="modal__actions">
            <button class="btn btn--ghost" value="cancel">Cancelar</button>
            <button class="btn" value="ok" data-confirm></button>
          </div>
        </form>
      </dialog>`;
    this.dialog = this.querySelector('dialog');
    this.resolver = null;

    // "submit" se dispara de forma síncrona al pulsar un botón, a diferencia de "close",
    // que el navegador puede retrasar; así cada apertura se resuelve una sola vez.
    this.querySelector('form').addEventListener('submit', (event) => {
      this.settle(event.submitter?.value === 'ok');
    });
    this.dialog.addEventListener('cancel', () => this.settle(false)); // tecla Escape
    this.dialog.addEventListener('close', () => this.settle(this.dialog.returnValue === 'ok'));
  }

  settle(result) {
    const resolve = this.resolver;
    this.resolver = null;
    resolve?.(result);
  }

  open({ title = '¿Estás seguro?', message = '', confirmText = 'Confirmar', variant = 'danger' } = {}) {
    this.querySelector('.modal__title').textContent = title;
    this.querySelector('.modal__text').textContent = message;
    const confirmBtn = this.querySelector('[data-confirm]');
    confirmBtn.textContent = confirmText;
    confirmBtn.className = `btn btn--${variant}`;

    this.settle(false); // descarta cualquier confirmación anterior que siguiera pendiente
    return new Promise((resolve) => {
      this.resolver = resolve;
      this.dialog.returnValue = '';
      if (!this.dialog.open) this.dialog.showModal(); // el foco inicial queda en "Cancelar"
    });
  }
}

customElements.define('app-confirm', AppConfirm);
