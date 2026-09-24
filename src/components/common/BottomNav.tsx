/**
 * Barra de navegación inferior estilo Stitch.
 *
 * Tres destinos fijos (Mapa / Buscar / Perfil) con iconos Material Symbols.
 * El destino activo se pinta en `primary`; los inactivos en
 * `on-surface-variant`. Solo cambia clases visuales, la navegación la
 * resuelve `react-router-dom`.
 */
import { NavLink } from 'react-router-dom';

/** Destino de la barra inferior. */
interface BottomNavItem {
  /** Ruta a la que navega. */
  to: string;
  /** Etiqueta visible en español. */
  label: string;
  /** Nombre del icono Material Symbols. */
  icon: string;
  /** Prefijo de ruta para marcar activo (permite subrutas). */
  matchPrefix: string;
}

/** Los tres destinos principales de la app. */
const ITEMS: BottomNavItem[] = [
  { to: '/map', label: 'Mapa', icon: 'map', matchPrefix: '/map' },
  { to: '/home', label: 'Buscar', icon: 'search', matchPrefix: '/home' },
  { to: '/perfil', label: 'Perfil', icon: 'person', matchPrefix: '/perfil' },
];

/**
 * Clases del enlace según su estado activo.
 * @param isActive Si la ruta actual coincide con el destino.
 * @returns Clases Tailwind del ítem.
 */
function linkClasses(isActive: boolean): string {
  const base =
    'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold transition active:scale-95';
  return isActive ? `${base} text-primary` : `${base} text-on-surface-variant`;
}

/** Barra inferior fija de 64 px con borde superior sutil. */
export function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant bg-surface-container-lowest pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-5xl items-stretch justify-around px-4">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => linkClasses(isActive)}
            aria-label={item.label}
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-2xl leading-none"
                  style={{
                    fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
