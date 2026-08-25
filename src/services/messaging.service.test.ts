import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getToken, onMessage, type Messaging } from 'firebase/messaging';
import { readFirebaseEnv, type FirebaseEnvConfig } from '../config/env';
import { getMessagingInstance } from '../config/firebase';
import { messagingService } from './messaging.service';

vi.mock('firebase/messaging', () => ({
  getToken: vi.fn(),
  onMessage: vi.fn(),
}));

vi.mock('../config/firebase', () => ({
  getMessagingInstance: vi.fn(),
}));

vi.mock('../config/env', () => ({
  readFirebaseEnv: vi.fn(),
}));

/** Configuración de entorno mínima para las pruebas. */
const ENV_FIXTURE: FirebaseEnvConfig = {
  apiKey: 'clave-api',
  authDomain: 'bookcompass.firebaseapp.com',
  projectId: 'bookcompass',
  storageBucket: 'bookcompass.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abcdef',
  vapidKey: 'clave-vapid',
};

/** Estado y stub del global `Notification` (no existe en entorno Node). */
const notificationState = {
  permission: 'default' as NotificationPermission,
  requestResult: 'granted' as NotificationPermission,
};

const fakeNotification = {
  get permission(): NotificationPermission {
    return notificationState.permission;
  },
  requestPermission: vi.fn(async (): Promise<NotificationPermission> => {
    notificationState.permission = notificationState.requestResult;
    return notificationState.requestResult;
  }),
};

const messagingInstanceMock = vi.mocked(getMessagingInstance);
const envMock = vi.mocked(readFirebaseEnv);

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  vi.resetAllMocks();
  envMock.mockReturnValue(ENV_FIXTURE);
  notificationState.permission = 'default';
  notificationState.requestResult = 'granted';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MessagingService — soporte y token', () => {
  it('isSupported refleja la disponibilidad de mensajería', async () => {
    messagingInstanceMock.mockResolvedValueOnce({} as Messaging);
    expect(await messagingService.isSupported()).toBe(true);

    messagingInstanceMock.mockResolvedValueOnce(null);
    expect(await messagingService.isSupported()).toBe(false);
  });

  it('devuelve null sin pedir permiso si el navegador no soporta push', async () => {
    vi.stubGlobal('Notification', fakeNotification);
    messagingInstanceMock.mockResolvedValue(null);

    const token = await messagingService.requestPermissionAndGetToken();

    expect(token).toBeNull();
    expect(fakeNotification.requestPermission).not.toHaveBeenCalled();
  });

  it('devuelve null directamente si el permiso está denegado', async () => {
    vi.stubGlobal('Notification', fakeNotification);
    messagingInstanceMock.mockResolvedValue({} as Messaging);
    notificationState.permission = 'denied';

    const token = await messagingService.requestPermissionAndGetToken();

    expect(token).toBeNull();
    expect(fakeNotification.requestPermission).not.toHaveBeenCalled();
  });

  it('solicita permiso cuando es necesario y devuelve el token con la clave VAPID', async () => {
    vi.stubGlobal('Notification', fakeNotification);
    messagingInstanceMock.mockResolvedValue({} as Messaging);
    vi.mocked(getToken).mockResolvedValue('token-123');

    const token = await messagingService.requestPermissionAndGetToken();

    expect(fakeNotification.requestPermission).toHaveBeenCalledOnce();
    expect(token).toBe('token-123');
    expect(getToken).toHaveBeenCalledWith(expect.anything(), { vapidKey: 'clave-vapid' });
  });

  it('devuelve null si el usuario rechaza el permiso solicitado', async () => {
    vi.stubGlobal('Notification', fakeNotification);
    messagingInstanceMock.mockResolvedValue({} as Messaging);
    notificationState.requestResult = 'denied';

    const token = await messagingService.requestPermissionAndGetToken();

    expect(token).toBeNull();
    expect(getToken).not.toHaveBeenCalled();
  });

  it('no vuelve a pedir permiso si ya está concedido', async () => {
    vi.stubGlobal('Notification', fakeNotification);
    messagingInstanceMock.mockResolvedValue({} as Messaging);
    notificationState.permission = 'granted';
    vi.mocked(getToken).mockResolvedValue('token-456');

    const token = await messagingService.requestPermissionAndGetToken();

    expect(fakeNotification.requestPermission).not.toHaveBeenCalled();
    expect(token).toBe('token-456');
  });

  it('normaliza los errores al obtener el token', async () => {
    vi.stubGlobal('Notification', fakeNotification);
    messagingInstanceMock.mockResolvedValue({} as Messaging);
    notificationState.permission = 'granted';
    vi.mocked(getToken).mockRejectedValue({ code: 'messaging/token-subscribe-failed' });

    const error = await messagingService.requestPermissionAndGetToken().catch((e: unknown) => e);

    expect((error as Error).message).toContain('error inesperado');
  });
});

describe('MessagingService — mensajes en primer plano', () => {
  type ForegroundCallback = (payload: {
    notification?: { title?: string; body?: string };
    data?: Record<string, string>;
  }) => void;

  const capture: { callback: ForegroundCallback | null } = { callback: null };
  let unsubscribeSdk: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    capture.callback = null;
    unsubscribeSdk = vi.fn();
    vi.mocked(onMessage).mockImplementation(((...args: unknown[]) => {
      // El SDK invoca la implementación con (messaging, callback): posición 1.
      capture.callback = args[1] as ForegroundCallback;
      return unsubscribeSdk;
    }) as never);
  });

  it('entrega el payload normalizado al listener', async () => {
    vi.stubGlobal('Notification', fakeNotification);
    messagingInstanceMock.mockResolvedValue({} as Messaging);
    const listener = vi.fn();

    const unsubscribe = messagingService.onForegroundMessage(listener);
    await flushMicrotasks();

    capture.callback?.({
      notification: { title: 'Nuevo libro', body: 'Mira esta recomendación' },
      data: { url: '/works/OL123W' },
    });

    expect(listener).toHaveBeenCalledWith({
      title: 'Nuevo libro',
      body: 'Mira esta recomendación',
      data: { url: '/works/OL123W' },
    });

    unsubscribe();
    expect(unsubscribeSdk).toHaveBeenCalledOnce();
  });

  it('no se suscribe si se cancela antes de obtener la instancia', async () => {
    vi.stubGlobal('Notification', fakeNotification);
    messagingInstanceMock.mockResolvedValue({} as Messaging);
    const listener = vi.fn();

    const unsubscribe = messagingService.onForegroundMessage(listener);
    unsubscribe(); // se cancela antes del flush
    await flushMicrotasks();

    expect(capture.callback).toBeNull();
    expect(listener).not.toHaveBeenCalled();
  });
});
