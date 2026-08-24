/**
 * Componente raíz provisional de Book Compass.
 *
 * TODO: se sustituirá por el enrutador y las páginas definitivas cuando
 * se implemente la funcionalidad de descubrimiento literario.
 */
function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-5xl font-bold tracking-tight">Book Compass</h1>
      <p className="max-w-md text-lg text-stone-600">
        Configuración inicial completada: React + Vite + TypeScript + TailwindCSS + PWA listas.
      </p>
      <small className="text-sm text-stone-400">v0.0.0</small>
    </main>
  );
}

export default App;
