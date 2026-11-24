/**
 * Datos iniciales: si no hay usuarios registrados se crea la cuenta de
 * administrador para poder entrar a los módulos privados la primera vez.
 */
import { read, KEYS } from './storage.js';
import { createUser } from '../services/users.service.js';

export const DEFAULT_ADMIN = Object.freeze({
  identificacion: '1000000001',
  nombre: 'Administrador Acme',
  email: 'admin@acmeschool.edu',
  telefono: '3001234567',
  cargo: 'Administrativo',
  password: 'Admin1234',
});

export async function ensureSeed() {
  if (read(KEYS.users).length > 0) return;
  await createUser(DEFAULT_ADMIN);
}
