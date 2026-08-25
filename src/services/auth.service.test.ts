import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { getAuthInstance } from '../config/firebase';
import { AppError } from '../utils/errors';
import { authService } from './auth.service';

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: class GoogleAuthProviderStub {},
}));

vi.mock('../config/firebase', () => ({
  getAuthInstance: vi.fn(),
}));

type AuthCallback = (user: User | null) => void;

const authInstanceMock = vi.mocked(getAuthInstance);

/** Usuario del SDK con la forma mínima que consume el servicio. */
function fakeUser(overrides: Partial<User> = {}): User {
  const base = {
    uid: 'uid-1',
    email: 'ana@example.com',
    displayName: 'Ana García',
    photoURL: null as string | null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null as string | null,
    providerId: 'firebase',
  };
  return { ...base, ...overrides } as unknown as User;
}

beforeEach(() => {
  vi.resetAllMocks();
  authInstanceMock.mockReturnValue({} as Auth);
});

describe('AuthService — registro y login con correo', () => {
  it('signUpWithEmail devuelve el usuario normalizado de dominio', async () => {
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
      user: fakeUser({ uid: 'nuevo-1' }),
    } as never);

    const user = await authService.signUpWithEmail('ana@example.com', 'secreto123');

    expect(user).toEqual({
      uid: 'nuevo-1',
      email: 'ana@example.com',
      displayName: 'Ana García',
      photoURL: null,
    });
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      {} as Auth,
      'ana@example.com',
      'secreto123',
    );
  });

  it('signInWithEmail devuelve el usuario normalizado', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({ user: fakeUser() } as never);

    const user = await authService.signInWithEmail('ana@example.com', 'secreto123');

    expect(user.uid).toBe('uid-1');
    expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
  });

  it('traduce errores conocidos a AppError con mensaje en español', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue({
      code: 'auth/wrong-password',
    });

    const error = await authService.signInWithEmail('a@b.c', 'mal').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('auth/wrong-password');
    expect((error as AppError).message).toContain('incorrecta');
  });
});

describe('AuthService — Google', () => {
  it('signInWithGoogle devuelve el usuario normalizado', async () => {
    vi.mocked(signInWithPopup).mockResolvedValue({ user: fakeUser({ uid: 'google-1' }) } as never);

    const user = await authService.signInWithGoogle();

    expect(user.uid).toBe('google-1');
    expect(signInWithPopup).toHaveBeenCalledWith({} as Auth, expect.anything());
  });
});

describe('AuthService — sesión', () => {
  it('signOut delega en el SDK', async () => {
    vi.mocked(signOut).mockResolvedValue(undefined);

    await authService.signOut();

    expect(signOut).toHaveBeenCalledOnce();
  });

  it('getCurrentUser devuelve null sin sesión abierta', () => {
    expect(authService.getCurrentUser()).toBeNull();
  });

  it('getCurrentUser mapea el usuario actual del SDK', () => {
    authInstanceMock.mockReturnValue({ currentUser: fakeUser() } as unknown as Auth);

    expect(authService.getCurrentUser()).toMatchObject({ uid: 'uid-1' });
  });

  it('observeAuthChanges notifica usuarios mapeados y permite desuscribirse', () => {
    const captured: { callback: AuthCallback | null } = { callback: null };
    const unsubscribeSdk = vi.fn();
    // El SDK invoca la implementación con (auth, callback): capturamos la posición 1.
    vi.mocked(onAuthStateChanged).mockImplementation(((...args: unknown[]) => {
      captured.callback = args[1] as AuthCallback;
      return unsubscribeSdk;
    }) as never);

    const listener = vi.fn();
    const unsubscribe = authService.observeAuthChanges(listener);

    captured.callback?.(fakeUser());
    captured.callback?.(null);

    expect(listener).toHaveBeenNthCalledWith(1, {
      uid: 'uid-1',
      email: 'ana@example.com',
      displayName: 'Ana García',
      photoURL: null,
    });
    expect(listener).toHaveBeenNthCalledWith(2, null);

    unsubscribe();
    expect(unsubscribeSdk).toHaveBeenCalledOnce();
  });
});
