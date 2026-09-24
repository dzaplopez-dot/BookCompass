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

/** Clases Stitch de los campos con icono a la izquierda. */
const inputClasses = (hasError: boolean): string =>
  `w-full rounded-[10px] border bg-surface-container-lowest py-3 pl-10 pr-3 text-on-surface outline-none transition placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container ${
    hasError ? 'border-error' : 'border-outline-variant'
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
      <main className="flex min-h-svh items-center justify-center bg-surface p-5 antialiased">
        <section className="w-full max-w-[480px] rounded-[12px] bg-surface-container-lowest p-8 text-center shadow-card md:p-12">
          <span
            aria-hidden="true"
            className="material-symbols-outlined mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-2xl text-primary"
          >
            mail
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-on-surface">
            Revisa tu correo
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            Hemos enviado instrucciones para restablecer tu contraseña a{' '}
            <strong className="break-all text-on-surface">{sentTo}</strong>.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block min-h-[48px] rounded-[12px] bg-primary-container px-6 py-3 font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            Volver a iniciar sesión
          </Link>
        </section>
      </main>
    );
  }

  const bannerMessage = validationMessage ?? error;

  return (
    <main className="flex min-h-svh items-center justify-center bg-surface p-5 antialiased md:p-10">
      <section className="w-full max-w-[480px] rounded-[12px] bg-surface-container-lowest p-8 shadow-card md:p-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-container text-4xl text-white"
          >
            🧭
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-on-surface">
            Recupera tu contraseña
          </h1>
          <p className="mt-2 text-base leading-relaxed text-on-surface-variant">
            Escribe tu correo y te enviaremos un enlace para crear una nueva.
          </p>
        </div>

        {bannerMessage ? (
          <p
            role="alert"
            className="mb-4 rounded-[10px] border border-error bg-error-container px-4 py-3 text-sm text-on-error-container"
          >
            {bannerMessage}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="relative">
            <label htmlFor="forgot-email" className="sr-only">
              Correo electrónico
            </label>
            <span
              aria-hidden="true"
              className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline"
            >
              mail
            </span>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="Correo electrónico"
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
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[12px] bg-primary-container py-3 text-lg font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Spinner size="sm" /> : null}
            {submitting ? 'Enviando…' : 'Enviar instrucciones'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link
            to="/login"
            className="font-semibold text-primary-container transition hover:opacity-80"
          >
            Volver a iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  );
}
