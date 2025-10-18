export default function LoadingAdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
              <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden h-5 w-24 animate-pulse rounded bg-purple-100 sm:block" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
              <div className="hidden h-4 w-24 animate-pulse rounded bg-slate-200 md:block" />
              <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="mb-2 h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((card) => (
            <div
              key={card}
              className="rounded-lg border-2 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 h-6 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="mb-6 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="mb-4 flex gap-2">
                <div className="h-10 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-10 w-32 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((stat) => (
                  <div
                    key={stat}
                    className="h-16 animate-pulse rounded bg-slate-100"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
