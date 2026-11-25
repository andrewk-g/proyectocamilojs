/**
 * Datos iniciales:
 * - Si no hay usuarios se crea la cuenta de administrador.
 * - La primera vez se crea un examen de ejemplo. Se marca en "acme:meta" para
 *   no volver a crearlo si después se elimina.
 */
import { read, write, KEYS } from './storage.js';
import { createUser } from '../services/users.service.js';
import { addQuestion, createExam } from '../services/exams.service.js';

export const DEFAULT_ADMIN = Object.freeze({
  identificacion: '1000000001',
  nombre: 'Administrador Acme',
  email: 'admin@acmeschool.edu',
  telefono: '3001234567',
  cargo: 'Administrativo',
  password: 'Admin1234',
});

const SAMPLE_EXAM = {
  codigo: 'JS-101',
  titulo: 'Fundamentos de JavaScript',
  tiempo: 10,
  porcentajeAprobacion: 60,
  descripcion: 'Evalúa los conceptos básicos de JavaScript: variables, tipos de datos, arreglos y funciones.',
};

const answers = (correctIndex, ...texts) =>
  texts.map((descripcion, i) => ({ descripcion, correcta: i === correctIndex }));

const SAMPLE_QUESTIONS = [
  { enunciado: '¿Qué palabra clave declara una variable que no se puede reasignar?', respuestas: answers(2, 'var', 'let', 'const') },
  { enunciado: '¿Qué devuelve typeof [] en JavaScript?', respuestas: answers(1, '"array"', '"object"', '"list"', '"undefined"') },
  { enunciado: '¿Qué método agrega un elemento al final de un arreglo?', respuestas: answers(0, 'push()', 'shift()', 'pop()', 'unshift()') },
  { enunciado: '¿Cuál es el resultado de 2 + "2"?', respuestas: answers(2, '4', 'NaN', '"22"') },
  { enunciado: '¿Qué operador compara valor y tipo al mismo tiempo?', respuestas: answers(1, '==', '===', '=') },
];

async function seedUsers() {
  if (read(KEYS.users).length > 0) return;
  await createUser(DEFAULT_ADMIN);
}

function seedExams() {
  const meta = read(KEYS.meta, {});
  if (meta.examsSeeded) return;
  if (read(KEYS.exams).length === 0) {
    const exam = createExam(SAMPLE_EXAM);
    SAMPLE_QUESTIONS.forEach((question) => addQuestion(exam.id, question));
  }
  write(KEYS.meta, { ...meta, examsSeeded: true });
}

export async function ensureSeed() {
  await seedUsers();
  seedExams();
}
