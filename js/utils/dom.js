/**
 * Helpers de DOM compartidos por los Web Components.
 */

/** Escapa texto antes de interpolarlo en plantillas HTML (evita XSS). */
export function escapeHtml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (char) => map[char]);
}

/** Convierte un <form> en un objeto plano { name: value }. */
export function formToObject(form) {
  return Object.fromEntries(new FormData(form));
}

/** Muestra una notificación usando el componente <app-toast>. */
export function toast(message, type = 'info') {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
}

/** Abre el diálogo de confirmación <app-confirm>; resuelve true si el usuario acepta. */
export function confirmDialog(options) {
  const dialog = document.querySelector('app-confirm');
  if (!dialog) return Promise.resolve(window.confirm(options.message));
  return dialog.open(options);
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Iniciales para avatares: "Ana María Pérez" -> "AP". */
export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}
