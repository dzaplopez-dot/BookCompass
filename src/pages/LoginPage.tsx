/**
 * Página de inicio de sesión.
 *
 * Permite entrar con correo/contraseña o con Google. Los errores del
 * servicio llegan traducidos al español vía `useAuth().error`.
 */
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner } from '../components/common/Spinner';
import { useAuth } from '../hooks/useAuth';
import { isValidEmail } from '../utils/validation';

/** Clases compartidas de los campos de formulario. */
const inputClasses = (hasError: boolean): string =>
  `w-full rounded-lg border px-4 py-2.5 text-ink outline-none transition focus:ring-2 focus:ring-brand-500 ${
    hasError ? 'border-red-500' : 'border-stone-300'
  }`;

/** Página pública de autenticación con correo y Google. */
export default function LoginPage() {
  const { login, loginWithGoogle, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  /** Envía el formulario tras validar el formato del correo. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    clearError();

    if (!isValidEmail(email)) {
      setValidationMessage('Introduce un correo electrónico válido.');
      return;
    }
    setValidationMessage(null);

    setSubmitting(true);
    try {
      await login({ email, password });
      navigate('/home', { replace: true });
    } catch {
      // El mensaje amigable ya quedó en `error` (contexto).
    } finally {
      setSubmitting(false);
    }
  }

  /** Inicia sesión con Google mediante popup. */
  async function handleGoogle(): Promise<void> {
    clearError();
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/home', { replace: true });
    } catch {
      // Mensaje gestionado por el contexto.
    } finally {
      setGoogleLoading(false);
    }
  }

  const bannerMessage = validationMessage ?? error;

  return (
    <main className="flex min-h-svh items-center justify-center bg-paper px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl font-bold tracking-tight">Inicia sesión</h1>
        <p className="mt-1 text-sm text-stone-500">Tu brújula hacia tu próxima lectura favorita.</p>

        {bannerMessage ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {bannerMessage}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm font-medium">
              Correo electrónico
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClasses(Boolean(bannerMessage))}
              aria-invalid={Boolean(bannerMessage)}
              disabled={submitting || googleLoading}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClasses(Boolean(bannerMessage))}
              aria-invalid={Boolean(bannerMessage)}
              disabled={submitting || googleLoading}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || googleLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Spinner size="sm" /> : null}
            {submitting ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting || googleLoading}
          className="mt-3 flex w-full items-center justify-center gap-3 rounded-lg border border-stone-300 bg-white px-4 py-2.5 font-medium text-ink transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleLoading ? (
            <Spinner size="sm" />
          ) : (
            <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.27-3.16.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19Z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
              />
            </svg>
          )}
          Iniciar con Google
        </button>

        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          <Link to="/forgot-password" className="text-brand-700 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          <p className="text-stone-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
