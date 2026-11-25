/**
 * Servicio de usuarios: CRUD sobre la colección "users" de localStorage.
 *
 * Estructura JSON de un usuario:
 * {
 *   id, identificacion, nombre, email, telefono,
 *   cargo: "Administrativo" | "Docente",
 *   salt, passwordHash, createdAt, updatedAt
 * }
 */
import { read, write, KEYS } from '../data/storage.js';
import { createSalt, hashPassword, randomId } from '../utils/crypto.js';
import { validateUser } from '../utils/validators.js';
import { ValidationError, assertValid } from '../utils/errors.js';

export { ValidationError };

/** Quita los datos sensibles antes de entregar un usuario a la UI. */
export const toPublicUser = ({ salt, passwordHash, ...user }) => user;

function normalize(input) {
  return {
    identificacion: String(input.identificacion ?? '').trim(),
    nombre: String(input.nombre ?? '').trim().replace(/\s+/g, ' '),
    email: String(input.email ?? '').trim().toLowerCase(),
    telefono: String(input.telefono ?? '').trim(),
    cargo: String(input.cargo ?? ''),
    password: String(input.password ?? ''),
  };
}

function assertUnique(users, data, ignoreId) {
  const errors = {};
  const others = users.filter((u) => u.id !== ignoreId);
  if (others.some((u) => u.identificacion === data.identificacion)) {
    errors.identificacion = 'Ya existe un usuario con este número de identificación.';
  }
  if (others.some((u) => u.email === data.email)) {
    errors.email = 'Este correo ya está registrado.';
  }
  assertValid(errors);
}

/** Uso interno (autenticación): devuelve el registro completo. */
export function findUserRecordByEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase();
  return read(KEYS.users).find((u) => u.email === normalized) ?? null;
}

export function findUserRecordById(id) {
  return read(KEYS.users).find((u) => u.id === id) ?? null;
}

export function listUsers() {
  return read(KEYS.users)
    .map(toPublicUser)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function getUser(id) {
  const record = findUserRecordById(id);
  return record ? toPublicUser(record) : null;
}

export async function createUser(input) {
  const data = normalize(input);
  assertValid(validateUser(data, { requirePassword: true }));
  assertUnique(read(KEYS.users), data, null);

  const salt = createSalt();
  const passwordHash = await hashPassword(data.password, salt);

  // Se vuelve a leer después del await para no pisar cambios concurrentes.
  const users = read(KEYS.users);
  assertUnique(users, data, null);

  const now = new Date().toISOString();
  const { password, ...fields } = data;
  const user = { id: randomId(), ...fields, salt, passwordHash, createdAt: now, updatedAt: now };
  users.push(user);
  write(KEYS.users, users);
  return toPublicUser(user);
}

export async function updateUser(id, input) {
  const data = normalize(input);
  assertValid(validateUser(data, { requirePassword: false }));
  if (!findUserRecordById(id)) throw new Error('El usuario ya no existe.');
  assertUnique(read(KEYS.users), data, id);

  let credentials = null;
  if (data.password) {
    const salt = createSalt();
    credentials = { salt, passwordHash: await hashPassword(data.password, salt) };
  }

  const users = read(KEYS.users);
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) throw new Error('El usuario ya no existe.');
  assertUnique(users, data, id);

  const { password, ...fields } = data;
  users[index] = { ...users[index], ...fields, ...credentials, updatedAt: new Date().toISOString() };
  write(KEYS.users, users);
  return toPublicUser(users[index]);
}

export function deleteUser(id, { currentUserId } = {}) {
  if (id === currentUserId) {
    throw new Error('No puedes eliminar la cuenta con la que iniciaste sesión.');
  }
  const users = read(KEYS.users);
  if (!users.some((u) => u.id === id)) throw new Error('El usuario ya no existe.');
  if (users.length <= 1) throw new Error('Debe existir al menos un usuario en la plataforma.');
  write(KEYS.users, users.filter((u) => u.id !== id));
}
