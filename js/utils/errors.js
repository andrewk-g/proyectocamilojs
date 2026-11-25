/**
 * Error de validación con los mensajes por campo: { campo: mensaje }.
 */
export class ValidationError extends Error {
  constructor(errors) {
    super('Revisa los campos marcados.');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/** Lanza ValidationError si el objeto de errores tiene algún campo. */
export function assertValid(errors) {
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
}
