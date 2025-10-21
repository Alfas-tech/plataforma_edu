interface FullscreenLoaderProps {
  title?: string;
  message?: string;
  gradient?: string;
}

export function FullscreenLoader({
  title = "Cargando contenido",
  message = "Por favor espera un momento...",
  gradient = "from-slate-50 via-purple-50 to-pink-50",
}: FullscreenLoaderProps) {
  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-gradient-to-br ${gradient}`}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/60 bg-white/80 p-8 text-center shadow-xl backdrop-blur">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
          <div className="absolute inset-3 rounded-full bg-purple-100/70" />
        </div>
        {title ? (
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        ) : null}
        {message ? (
          <p className="text-sm text-slate-600">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
