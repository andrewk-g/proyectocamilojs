/**
 * Capa de persistencia sobre localStorage.
 * Todas las colecciones se guardan como JSON bajo el prefijo "acme:".
 */
const PREFIX = 'acme:';

export const KEYS = Object.freeze({
  users: 'users',
  exams: 'exams',
  attempts: 'attempts',
  session: 'session',
  meta: 'meta',
});

export function read(key, fallback = []) {
  const raw = localStorage.getItem(PREFIX + key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`[storage] El valor de "${key}" no es JSON válido.`, error);
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (error) {
    // Normalmente QuotaExceededError: se propaga para que la vista lo informe.
    throw new Error('No se pudo guardar la información en el navegador.', { cause: error });
  }
}

export function remove(key) {
  localStorage.removeItem(PREFIX + key);
}
