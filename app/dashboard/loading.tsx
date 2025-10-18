export default function LoadingDashboard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-purple-100 bg-white/80 px-8 py-6 shadow-lg backdrop-blur">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
        <p className="text-sm font-medium text-slate-700">
          Preparando tu panel personalizado…
        </p>
      </div>
    </div>
  );
}
