import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFirebaseEnv, REQUIRED_ENV_VARS } from './env';

afterEach(() => {
  vi.unstubAllEnvs();
});

function stubAllEnvVars(value = 'valor-de-prueba'): void {
  for (const name of REQUIRED_ENV_VARS) {
    vi.stubEnv(name, value);
  }
}

describe('readFirebaseEnv', () => {
  it('devuelve la configuración completa cuando todas las variables están definidas', () => {
    stubAllEnvVars();

    const config = readFirebaseEnv();

    expect(config.apiKey).toBe('valor-de-prueba');
    expect(config.authDomain).toBe('valor-de-prueba');
    expect(config.projectId).toBe('valor-de-prueba');
    expect(config.storageBucket).toBe('valor-de-prueba');
    expect(config.messagingSenderId).toBe('valor-de-prueba');
    expect(config.appId).toBe('valor-de-prueba');
    expect(config.vapidKey).toBe('valor-de-prueba');
  });

  it('lanza error descriptivo cuando falta una variable obligatoria', () => {
    for (const name of REQUIRED_ENV_VARS) {
      if (name !== 'VITE_FIREBASE_PROJECT_ID') {
        vi.stubEnv(name, 'valor-de-prueba');
      }
    }

    expect(() => readFirebaseEnv()).toThrow(/VITE_FIREBASE_PROJECT_ID/);
  });

  it('trata como faltantes las variables vacías o con espacios', () => {
    stubAllEnvVars();
    vi.stubEnv('VITE_FIREBASE_API_KEY', '   ');

    expect(() => readFirebaseEnv()).toThrow(/VITE_FIREBASE_API_KEY/);
  });
});
