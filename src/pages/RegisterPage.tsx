/**
 * Página de registro de cuenta nueva.
 *
 * Valida los campos en cliente antes de llamar a `register()` del contexto;
 * los errores del servicio se muestran mediante el banner global de `error`.
 */
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner } from '../components/common/Spinner';
import { useAuth } from '../hooks/useAuth';
import {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  isValidPassword,
  passwordsMatch,
} from '../utils/validation';

/** Clases Stitch de los campos con icono a la izquierda. */
const inputClasses = (hasError: boolean): string =>
  `w-full rounded-[10px] border bg-surface-container-lowest py-3 pl-10 pr-3 text-on-surface outline-none transition placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container ${
    hasError ? 'border-error' : 'border-outline-variant'
  }`;

/** Mensajes de validación por campo. */
interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/** Página pública de creación de cuenta. */
export default function RegisterPage() {
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  /** Valida el formulario completo y devuelve los errores por campo. */
  function validateForm(): FieldErrors {
    const errors: FieldErrors = {};

    if (!isValidEmail(email)) {
      errors.email = 'Introduce un correo electrónico válido.';
    }
    if (!isValidPassword(password)) {
      errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (!passwordsMatch(password, confirmPassword)) {
      errors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    return errors;
  }

  /** Registra la cuenta si todas las validaciones pasan. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    clearError();

    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await register({
        displayName: displayName.trim() || undefined,
        email,
        password,
      });
      // Tras crear la cuenta se personaliza la app eligiendo géneros.
      navigate('/onboarding', { replace: true });
    } catch {
      // El mensaje amigable ya quedó en `error` (contexto).
    } finally {
      setSubmitting(false);
    }
  }

  /** Limpia el error del campo cuando el usuario vuelve a escribir. */
  function clearFieldError(field: keyof FieldErrors): void {
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-surface p-5 antialiased md:p-10">
      <section className="w-full max-w-[480px] rounded-[12px] bg-surface-container-lowest p-8 shadow-card md:p-12">
        <div className="mb-12 flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-container text-4xl text-white"
          >
            🧭
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-on-surface">
            Crea tu cuenta
          </h1>
          <p className="mt-2 text-base leading-relaxed text-on-surface-variant">
            Únete a la comunidad de lectores y descubre libros cerca de ti.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-[10px] border border-error bg-error-container px-4 py-3 text-sm text-on-error-container"
          >
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="relative">
            <label htmlFor="register-name" className="sr-only">
              Nombre completo
            </label>
            <span
              aria-hidden="true"
              className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center leading-none text-outline"
            >
              person
            </span>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Nombre completo"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={inputClasses(false)}
              disabled={submitting}
            />
          </div>

          <div>
            <div className="relative">
              <label htmlFor="register-email" className="sr-only">
                Correo electrónico
              </label>
              <span
                aria-hidden="true"
                className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center leading-none text-outline"
              >
                mail
              </span>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFieldError('email');
                }}
                className={inputClasses(Boolean(fieldErrors.email))}
                aria-invalid={Boolean(fieldErrors.email)}
                disabled={submitting}
              />
            </div>
            {fieldErrors.email ? (
              <p className="mt-1 text-sm text-error">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div>
            <div className="relative">
              <label htmlFor="register-password" className="sr-only">
                Contraseña
              </label>
              <span
                aria-hidden="true"
                className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center leading-none text-outline"
              >
                lock
              </span>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder="Contraseña"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearFieldError('password');
                }}
                className={inputClasses(Boolean(fieldErrors.password))}
                aria-invalid={Boolean(fieldErrors.password)}
                disabled={submitting}
              />
            </div>
            {fieldErrors.password ? (
              <p className="mt-1 text-sm text-error">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div>
            <div className="relative">
              <label htmlFor="register-confirm-password" className="sr-only">
                Confirmar contraseña
              </label>
              <span
                aria-hidden="true"
                className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center leading-none text-outline"
              >
                lock
              </span>
              <input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  clearFieldError('confirmPassword');
                }}
                className={inputClasses(Boolean(fieldErrors.confirmPassword))}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                disabled={submitting}
              />
            </div>
            {fieldErrors.confirmPassword ? (
              <p className="mt-1 text-sm text-error">{fieldErrors.confirmPassword}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[12px] bg-primary-container py-3 text-lg font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Spinner size="sm" /> : null}
            {submitting ? 'Creando cuenta…' : 'Registrarse'}
          </button>
        </form>

        <p className="mt-6 text-center text-base text-on-surface-variant">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-container transition hover:opacity-80"
          >
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  );
}
