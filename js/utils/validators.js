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

export const QUESTION_LIMITS = Object.freeze({ minAnswers: 2, maxAnswers: 6 });

const isIntInRange = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

export function validateExam(data) {
  const errors = {};

  if (!/^[A-Z0-9-]{3,20}$/.test(data.codigo)) {
    errors.codigo = 'Usa de 3 a 20 caracteres: letras, números o guiones.';
  }
  if (data.titulo.length < 3 || data.titulo.length > 100) {
    errors.titulo = 'El título debe tener entre 3 y 100 caracteres.';
  }
  if (!isIntInRange(data.tiempo, 1, 300)) {
    errors.tiempo = 'Ingresa un número entero entre 1 y 300 minutos.';
  }
  if (!isIntInRange(data.porcentajeAprobacion, 1, 100)) {
    errors.porcentajeAprobacion = 'Ingresa un porcentaje entero entre 1 y 100.';
  }
  if (data.descripcion.length < 10 || data.descripcion.length > 500) {
    errors.descripcion = 'La descripción debe tener entre 10 y 500 caracteres.';
  }

  return errors;
}

export function validateQuestion(data) {
  const errors = {};
  const { minAnswers, maxAnswers } = QUESTION_LIMITS;

  if (data.enunciado.length < 5 || data.enunciado.length > 300) {
    errors.enunciado = 'El enunciado debe tener entre 5 y 300 caracteres.';
  }

  const respuestas = data.respuestas;
  if (respuestas.length < minAnswers || respuestas.length > maxAnswers) {
    errors.respuestas = `Agrega entre ${minAnswers} y ${maxAnswers} respuestas.`;
  } else if (respuestas.some((r) => r.descripcion.length === 0)) {
    errors.respuestas = 'Ninguna respuesta puede quedar vacía.';
  } else {
    const texts = respuestas.map((r) => r.descripcion.toLowerCase());
    if (new Set(texts).size !== texts.length) errors.respuestas = 'Hay respuestas repetidas.';
  }

  if (respuestas.filter((r) => r.correcta).length !== 1) {
    errors.correcta = 'Marca exactamente una respuesta como correcta.';
  }

  return errors;
}
