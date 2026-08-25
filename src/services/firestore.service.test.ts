import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addDoc, deleteDoc, getDoc, getDocs, orderBy, setDoc, where } from 'firebase/firestore';
import type { UserProfile } from '../types';
import { firestoreService } from './firestore.service';

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn(() => ({ __ref: 'collection' })),
  deleteDoc: vi.fn(),
  doc: vi.fn(() => ({ __ref: 'document' })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  setDoc: vi.fn(),
  where: vi.fn(),
}));

vi.mock('../config/firebase', () => ({
  getDbInstance: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FirestoreService — CRUD genérico', () => {
  it('create devuelve el identificador autogenerado', async () => {
    vi.mocked(addDoc).mockResolvedValue({ id: 'doc-1' } as never);

    const id = await firestoreService.create('books', { title: 'Dune' });

    expect(id).toBe('doc-1');
  });

  it('update hace merge del parche sobre el documento', async () => {
    await firestoreService.update('books', 'doc-1', { title: 'Dune Messiah' });

    expect(setDoc).toHaveBeenCalledWith(
      { __ref: 'document' },
      { title: 'Dune Messiah' },
      { merge: true },
    );
  });

  it('remove delega en deleteDoc', async () => {
    await firestoreService.remove('books', 'doc-1');

    expect(deleteDoc).toHaveBeenCalledOnce();
  });

  it('getById devuelve null cuando el documento no existe', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never);

    const result = await firestoreService.getById('books', 'inexistente');

    expect(result).toBeNull();
  });

  it('getById inyecta el identificador junto a los datos', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      id: 'doc-9',
      data: () => ({ title: 'Fahrenheit 451' }),
    } as never);

    const result = await firestoreService.getById<{ title: string }>('books', 'doc-9');

    expect(result).toEqual({ title: 'Fahrenheit 451', id: 'doc-9' });
  });
});

describe('FirestoreService — list con restricciones nativas', () => {
  it('pasa las restricciones nativas del SDK a la consulta', async () => {
    vi.mocked(getDocs).mockResolvedValue({ docs: [] } as never);
    const filter = where('uid', '==', 'uid-1');
    const order = orderBy('createdAt', 'desc');

    await firestoreService.list('books', [filter, order]);

    expect(where).toHaveBeenCalledWith('uid', '==', 'uid-1');
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(getDocs).toHaveBeenCalledOnce();
  });

  it('funciona sin restricciones y mapea los documentos añadiendo su identificador', async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        { id: 'a', data: () => ({ title: 'X' }) },
        { id: 'b', data: () => ({ title: 'Y' }) },
      ],
    } as never);

    const result = await firestoreService.list<{ title: string }>('books');

    expect(result).toEqual([
      { title: 'X', id: 'a' },
      { title: 'Y', id: 'b' },
    ]);
  });
});

describe('FirestoreService — perfil de usuario', () => {
  const appUser = {
    uid: 'uid-1',
    email: 'ana@example.com',
    displayName: 'Ana García',
    photoURL: null,
  };

  it('ensureUserProfile crea el perfil con marcas de tiempo si no existe', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never);
    vi.spyOn(Date, 'now').mockReturnValue(1_000);

    const profile = await firestoreService.ensureUserProfile(appUser);

    expect(profile).toMatchObject({ uid: 'uid-1', createdAt: 1_000, updatedAt: 1_000 });
    expect(setDoc).toHaveBeenCalledWith({ __ref: 'document' }, profile, { merge: true });
  });

  it('ensureUserProfile conserva createdAt y actualiza updatedAt si existe', async () => {
    const existing: UserProfile = {
      uid: 'uid-1',
      email: 'vieja@example.com',
      displayName: 'Ana',
      photoURL: null,
      createdAt: 500,
      updatedAt: 500,
    };
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => existing } as never);
    vi.spyOn(Date, 'now').mockReturnValue(2_000);

    const profile = await firestoreService.ensureUserProfile(appUser);

    expect(profile.createdAt).toBe(500);
    expect(profile.updatedAt).toBe(2_000);
    expect(profile.email).toBe('ana@example.com');
  });

  it('getUserProfile devuelve null si no existe el documento', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never);

    expect(await firestoreService.getUserProfile('nadie')).toBeNull();
  });
});
