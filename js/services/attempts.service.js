/**
 * Servicio de intentos: maneja el examen que un estudiante está presentando
 * y guarda el resultado cuando termina.
 *
 * - "acme:activeAttempt": el intento en curso (uno a la vez). Guarda la hora
 *   límite, así el reloj sigue siendo correcto aunque se recargue la página.
 * - "acme:attempts": historial de intentos terminados.
 *
 * El puntaje siempre se calcula aquí, comparando las respuestas elegidas con
 * las respuestas correctas guardadas en el examen; nunca se confía en un
 * puntaje calculado por la interfaz.
 */
import { read, write, remove, KEYS } from '../data/storage.js';
import { randomId } from '../utils/crypto.js';
import { assertValid } from '../utils/errors.js';
import { validateStudent } from '../utils/validators.js';
import { getExam } from './exams.service.js';

const MINUTE = 60_000;

/** Exámenes que se pueden presentar: los que tienen al menos una pregunta. */
export function listAvailableExams() {
  return read(KEYS.exams)
    .filter((exam) => exam.preguntas.length > 0)
    .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
}

export function getActiveAttempt() {
  const attempt = read(KEYS.activeAttempt, null);
  return attempt?.examId ? attempt : null;
}

export function discardActiveAttempt() {
  remove(KEYS.activeAttempt);
}

export function startAttempt(examId, input) {
  const exam = getExam(examId);
  if (!exam || exam.preguntas.length === 0) throw new Error('Este examen no está disponible.');

  const student = {
    identificacion: String(input.identificacion ?? '').trim(),
    nombre: String(input.nombre ?? '').trim().replace(/\s+/g, ' '),
  };
  assertValid(validateStudent(student));

  const startedAt = Date.now();
  const attempt = {
    id: randomId(),
    examId,
    ...student,
    startedAt,
    deadline: startedAt + exam.tiempo * MINUTE,
    respuestas: {}, // { [preguntaId]: respuestaId }
  };
  write(KEYS.activeAttempt, attempt);
  return attempt;
}

/** Guarda la respuesta elegida. Se ignora si ya se acabó el tiempo. */
export function saveAnswer(questionId, answerId) {
  const attempt = getActiveAttempt();
  if (!attempt || Date.now() >= attempt.deadline) return false;
  attempt.respuestas[questionId] = answerId;
  write(KEYS.activeAttempt, attempt);
  return true;
}

/**
 * Califica el intento en curso, lo guarda en el historial y lo cierra.
 * reason: "usuario" (pulsó Terminar) o "tiempo" (se agotó el reloj).
 */
export function finishAttempt({ reason = 'usuario' } = {}) {
  const active = getActiveAttempt();
  if (!active) throw new Error('No hay un examen en curso.');

  const exam = getExam(active.examId);
  if (!exam) {
    discardActiveAttempt();
    throw new Error('El examen ya no existe.');
  }

  const now = Date.now();
  const timedOut = now >= active.deadline;

  const detalle = exam.preguntas.map((question) => {
    const chosen = question.respuestas.find((r) => r.id === active.respuestas[question.id]) ?? null;
    return {
      preguntaId: question.id,
      enunciado: question.enunciado,
      respuestaId: chosen?.id ?? null,
      respuestaTexto: chosen?.descripcion ?? null,
      acertada: chosen?.correcta === true,
    };
  });

  const total = detalle.length;
  const correctas = detalle.filter((d) => d.acertada).length;
  const porcentaje = total ? Math.round((correctas / total) * 1000) / 10 : 0;

  const attempt = {
    id: active.id,
    examId: exam.id,
    examCodigo: exam.codigo,
    examTitulo: exam.titulo,
    identificacion: active.identificacion,
    nombre: active.nombre,
    tiempoLimite: exam.tiempo,
    porcentajeAprobacion: exam.porcentajeAprobacion,
    correctas,
    total,
    porcentaje,
    aprobado: porcentaje >= exam.porcentajeAprobacion,
    finalizadoPor: timedOut || reason === 'tiempo' ? 'tiempo' : 'usuario',
    startedAt: new Date(active.startedAt).toISOString(),
    finishedAt: new Date(Math.min(now, active.deadline)).toISOString(),
    detalle,
  };

  const attempts = read(KEYS.attempts);
  attempts.push(attempt);
  write(KEYS.attempts, attempts);
  discardActiveAttempt();
  return attempt;
}

export function getAttempt(id) {
  return read(KEYS.attempts).find((a) => a.id === id) ?? null;
}
