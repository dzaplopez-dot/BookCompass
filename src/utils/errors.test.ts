import { describe, expect, it } from 'vitest';
import { AppError, normalizeError } from './errors';

describe('AppError', () => {
  it('expone código, mensaje y nombre', () => {
    const error = new AppError('test/code', 'Mensaje de prueba');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AppError');
    expect(error.code).toBe('test/code');
    expect(error.message).toBe('Mensaje de prueba');
  });

  it('conserva la causa original cuando se proporciona', () => {
    const cause = new Error('original');
    const error = new AppError('test/code', 'Mensaje', cause);

    expect(error.cause).toBe(cause);
  });
});

describe('normalizeError', () => {
  it('devuelve la misma instancia si ya es un AppError', () => {
    const original = new AppError('test/code', 'Ya normalizado');

    expect(normalizeError(original)).toBe(original);
  });

  it('mapea códigos conocidos de Firebase Auth a mensajes en español', () => {
    const result = normalizeError({ code: 'auth/email-already-in-use' });

    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe('auth/email-already-in-use');
    expect(result.message).toContain('ya está registrado');
  });

  it('usa mensaje genérico para códigos desconocidos', () => {
    const result = normalizeError({ code: 'auth/codigo-inexistente' });

    expect(result.code).toBe('auth/codigo-inexistente');
    expect(result.message).toContain('error inesperado');
  });

  it('acepta errores sin propiedad code', () => {
    const result = normalizeError(new Error('fallo genérico'));

    expect(result.code).toBe('app/unknown');
    expect(result.message).toContain('error inesperado');
  });

  it('acepta valores primitivos sin lanzar excepción', () => {
    const result = normalizeError('algo salió mal');

    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe('app/unknown');
  });
});
