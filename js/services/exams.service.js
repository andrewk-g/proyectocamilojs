/**
 * Servicio de exámenes: CRUD de exámenes y de sus preguntas sobre la
 * colección "exams" de localStorage.
 *
 * Estructura JSON de un examen:
 * {
 *   id, codigo, titulo, tiempo, porcentajeAprobacion, descripcion,
 *   preguntas: [
 *     { id, enunciado, respuestas: [ { id, descripcion, correcta } ] }
 *   ],
 *   createdBy, createdAt, updatedAt
 * }
 */
import { read, write, KEYS } from '../data/storage.js';
import { randomId } from '../utils/crypto.js';
import { ValidationError, assertValid } from '../utils/errors.js';
import { validateExam, validateQuestion } from '../utils/validators.js';

const now = () => new Date().toISOString();
const clean = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
const toNumber = (value) => (String(value ?? '').trim() === '' ? NaN : Number(value));

function normalizeExam(input) {
  return {
    codigo: String(input.codigo ?? '').trim().toUpperCase(),
    titulo: clean(input.titulo),
    tiempo: toNumber(input.tiempo),
    porcentajeAprobacion: toNumber(input.porcentajeAprobacion),
    descripcion: String(input.descripcion ?? '').trim(),
  };
}

function normalizeQuestion(input) {
  const respuestas = Array.isArray(input.respuestas) ? input.respuestas : [];
  return {
    enunciado: clean(input.enunciado),
    respuestas: respuestas.map((r) => ({
      id: r.id || randomId(),
      descripcion: clean(r.descripcion),
      correcta: r.correcta === true,
    })),
  };
}

function assertUniqueCode(exams, codigo, ignoreId) {
  if (exams.some((e) => e.id !== ignoreId && e.codigo === codigo)) {
    throw new ValidationError({ codigo: 'Ya existe un examen con este código.' });
  }
}

/** Lee la colección, aplica el cambio sobre un examen y la guarda. */
function mutateExam(examId, change) {
  const exams = read(KEYS.exams);
  const exam = exams.find((e) => e.id === examId);
  if (!exam) throw new Error('El examen ya no existe.');
  const result = change(exam);
  exam.updatedAt = now();
  write(KEYS.exams, exams);
  return result;
}

// ---------- Exámenes ----------

export function listExams() {
  return read(KEYS.exams).sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
}

export function getExam(id) {
  return read(KEYS.exams).find((e) => e.id === id) ?? null;
}

export function createExam(input, { createdBy = null } = {}) {
  const data = normalizeExam(input);
  assertValid(validateExam(data));
  const exams = read(KEYS.exams);
  assertUniqueCode(exams, data.codigo, null);

  const timestamp = now();
  const exam = { id: randomId(), ...data, preguntas: [], createdBy, createdAt: timestamp, updatedAt: timestamp };
  exams.push(exam);
  write(KEYS.exams, exams);
  return exam;
}

export function updateExam(id, input) {
  const data = normalizeExam(input);
  assertValid(validateExam(data));
  assertUniqueCode(read(KEYS.exams), data.codigo, id);
  return mutateExam(id, (exam) => Object.assign(exam, data));
}

export function deleteExam(id) {
  const exams = read(KEYS.exams);
  if (!exams.some((e) => e.id === id)) throw new Error('El examen ya no existe.');
  write(KEYS.exams, exams.filter((e) => e.id !== id));
}

// ---------- Preguntas ----------

export function addQuestion(examId, input) {
  const data = normalizeQuestion(input);
  assertValid(validateQuestion(data));
  return mutateExam(examId, (exam) => {
    const question = { id: randomId(), ...data };
    exam.preguntas.push(question);
    return question;
  });
}

export function updateQuestion(examId, questionId, input) {
  const data = normalizeQuestion(input);
  assertValid(validateQuestion(data));
  return mutateExam(examId, (exam) => {
    const index = exam.preguntas.findIndex((q) => q.id === questionId);
    if (index === -1) throw new Error('La pregunta ya no existe.');
    exam.preguntas[index] = { id: questionId, ...data };
    return exam.preguntas[index];
  });
}

export function deleteQuestion(examId, questionId) {
  mutateExam(examId, (exam) => {
    if (!exam.preguntas.some((q) => q.id === questionId)) throw new Error('La pregunta ya no existe.');
    exam.preguntas = exam.preguntas.filter((q) => q.id !== questionId);
  });
}
