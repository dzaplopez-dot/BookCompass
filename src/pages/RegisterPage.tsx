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

/** Clases compartidas de los campos de formulario. */
const inputClasses = (hasError: boolean): string =>
  `w-full rounded-lg border px-4 py-2.5 text-ink outline-none transition focus:ring-2 focus:ring-brand-500 ${
    hasError ? 'border-red-500' : 'border-stone-300'
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
    <main className="flex min-h-svh items-center justify-center bg-paper px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl font-bold tracking-tight">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-stone-500">
          Empieza a explorar el mundo de los libros con Book Compass.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="register-name" className="mb-1 block text-sm font-medium">
              Nombre <span className="font-normal text-stone-400">(opcional)</span>
            </label>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={inputClasses(false)}
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="register-email" className="mb-1 block text-sm font-medium">
              Correo electrónico
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearFieldError('email');
              }}
              className={inputClasses(Boolean(fieldErrors.email))}
              aria-invalid={Boolean(fieldErrors.email)}
              disabled={submitting}
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="register-password" className="mb-1 block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearFieldError('password');
              }}
              className={inputClasses(Boolean(fieldErrors.password))}
              aria-invalid={Boolean(fieldErrors.password)}
              disabled={submitting}
            />
            {fieldErrors.password ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="register-confirm-password" className="mb-1 block text-sm font-medium">
              Confirmar contraseña
            </label>
            <input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                clearFieldError('confirmPassword');
              }}
              className={inputClasses(Boolean(fieldErrors.confirmPassword))}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              disabled={submitting}
            />
            {fieldErrors.confirmPassword ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Spinner size="sm" /> : null}
            {submitting ? 'Creando cuenta…' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  );
}
