/**
 * Servicio de autenticación. La sesión se guarda en localStorage como
 * { userId, startedAt } y se valida contra la colección de usuarios.
 */
import { read, write, remove, KEYS } from '../data/storage.js';
import { hashPassword } from '../utils/crypto.js';
import { findUserRecordByEmail, findUserRecordById, toPublicUser } from './users.service.js';

const emitChange = () => window.dispatchEvent(new CustomEvent('auth:change'));

export async function login(email, password) {
  const record = findUserRecordByEmail(email);
  // Se calcula el hash aunque el usuario no exista para no revelar qué correos existen por tiempo de respuesta.
  const hash = await hashPassword(String(password ?? ''), record?.salt ?? 'no-user');
  if (!record || hash !== record.passwordHash) {
    throw new Error('Correo o contraseña incorrectos.');
  }
  write(KEYS.session, { userId: record.id, startedAt: new Date().toISOString() });
  emitChange();
  return toPublicUser(record);
}

export function logout() {
  remove(KEYS.session);
  emitChange();
}

export function getCurrentUser() {
  const session = read(KEYS.session, null);
  if (!session?.userId) return null;
  const record = findUserRecordById(session.userId);
  if (!record) {
    // La cuenta fue eliminada: la sesión deja de ser válida.
    remove(KEYS.session);
    return null;
  }
  return toPublicUser(record);
}

export const isAuthenticated = () => getCurrentUser() !== null;
