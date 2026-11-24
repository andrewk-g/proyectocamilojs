/**
 * Utilidades criptográficas basadas en la Web Crypto API.
 * Las contraseñas nunca se guardan en texto plano: se almacena SHA-256(salt:password).
 */
const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export function randomId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function hashPassword(password, salt) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Abre la aplicación desde http://localhost (por ejemplo con Live Server) para poder cifrar contraseñas.');
  }
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}
