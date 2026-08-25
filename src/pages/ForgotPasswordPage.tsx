/**
 * Página de recuperación de contraseña.
 *
 * Solicita el correo y envía el email de restablecimiento mediante
 * `resetPassword()` del contexto; muestra una confirmación al enviarse.
 */
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../components/common/Spinner';
import { useAuth } from '../hooks/useAuth';
import { isValidEmail } from '../utils/validation';

/** Clases compartidas de los campos de formulario. */
const inputClasses = (hasError: boolean): string =>
  `w-full rounded-lg border px-4 py-2.5 text-ink outline-none transition focus:ring-2 focus:ring-brand-500 ${
    hasError ? 'border-red-500' : 'border-stone-300'
  }`;

/** Página pública de restablecimiento de contraseña. */
export default function ForgotPasswordPage() {
  const { resetPassword, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  /** Envía la solicitud de restablecimiento si el correo es válido. */
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
      await resetPassword(email);
      setSentTo(email);
    } catch {
      // El mensaje amigable ya quedó en `error` (contexto).
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-paper px-4 py-10">
        <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <span
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl"
          >
            ✉️
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Revisa tu correo</h1>
          <p className="mt-2 text-sm text-stone-600">
            Hemos enviado instrucciones para restablecer tu contraseña a{' '}
            <strong className="break-all">{sentTo}</strong>.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-brand-500 px-6 py-2.5 font-semibold text-white transition hover:bg-brand-700"
          >
            Volver a iniciar sesión
          </Link>
        </section>
      </main>
    );
  }

  const bannerMessage = validationMessage ?? error;

  return (
    <main className="flex min-h-svh items-center justify-center bg-paper px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl font-bold tracking-tight">Recupera tu contraseña</h1>
        <p className="mt-1 text-sm text-stone-500">
          Escribe tu correo y te enviaremos un enlace para crear una nueva.
        </p>

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
            <label htmlFor="forgot-email" className="mb-1 block text-sm font-medium">
              Correo electrónico
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClasses(Boolean(bannerMessage))}
              aria-invalid={Boolean(bannerMessage)}
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Spinner size="sm" /> : null}
            {submitting ? 'Enviando…' : 'Enviar instrucciones'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  );
}
