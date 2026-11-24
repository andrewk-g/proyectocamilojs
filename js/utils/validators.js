/**
 * Reglas de validación de formularios. Devuelven un objeto { campo: mensaje }
 * vacío cuando todo es válido.
 */
export const CARGOS = Object.freeze(['Administrativo', 'Docente']);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateUser(data, { requirePassword }) {
  const errors = {};

  if (!/^\d{5,15}$/.test(data.identificacion)) {
    errors.identificacion = 'Ingresa entre 5 y 15 dígitos, sin puntos ni espacios.';
  }
  if (data.nombre.length < 3) {
    errors.nombre = 'Escribe el nombre completo (mínimo 3 caracteres).';
  }
  if (!EMAIL_RE.test(data.email)) {
    errors.email = 'Escribe un correo válido, por ejemplo nombre@acmeschool.edu.';
  }
  if (!/^\+?\d{7,15}$/.test(data.telefono.replace(/[\s-]/g, ''))) {
    errors.telefono = 'Ingresa un teléfono de 7 a 15 dígitos.';
  }
  if (!CARGOS.includes(data.cargo)) {
    errors.cargo = 'Selecciona un cargo.';
  }
  if (requirePassword || data.password) {
    if (data.password.length < 8 || !/[A-Za-z]/.test(data.password) || !/\d/.test(data.password)) {
      errors.password = 'Mínimo 8 caracteres, con al menos una letra y un número.';
    }
  }

  return errors;
}
