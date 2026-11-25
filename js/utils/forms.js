/**
 * Helpers para mostrar y limpiar errores de validación en formularios.
 * Convención: el mensaje de un campo vive en el elemento #<prefijo>-<campo>-error.
 */

export function clearFieldErrors(form) {
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  form.querySelectorAll('.field__error').forEach((el) => { el.textContent = ''; });
}

export function clearFieldError(form, input, prefix) {
  if (!input?.name) return;
  input.removeAttribute('aria-invalid');
  const box = form.querySelector(`#${prefix}-${input.name}-error`);
  if (box) box.textContent = '';
}

/** Pinta los mensajes, marca los campos como inválidos y enfoca el primero. */
export function showFieldErrors(form, errors, prefix) {
  let first = null;
  for (const [name, message] of Object.entries(errors)) {
    const box = form.querySelector(`#${prefix}-${name}-error`);
    if (box) box.textContent = message;
    const input = form.elements[name];
    if (input instanceof Element) {
      input.setAttribute('aria-invalid', 'true');
      first ??= input;
    }
  }
  first?.focus();
  return first;
}

/** Alterna la visibilidad de un campo de contraseña y actualiza su botón. */
export function togglePasswordVisibility(input, button) {
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  button.textContent = show ? 'Ocultar' : 'Mostrar';
  button.setAttribute('aria-pressed', String(show));
}
