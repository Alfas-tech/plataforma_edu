const placeholderCourses = Array.from({ length: 3 });

export default function LoadingAdminCourses() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
              <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-28 animate-pulse rounded bg-purple-100" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 py-6 sm:px-4 lg:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-52 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-10 w-40 animate-pulse rounded bg-purple-200" />
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-56 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {placeholderCourses.slice(0, 3).map((_, index) => (
            <div
              key={`metric-${index}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-8 w-24 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-3 w-full animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {placeholderCourses.map((_, index) => (
            <div
              key={`course-${index}`}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 bg-slate-50/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="h-8 w-36 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {[0, 1, 2].map((badge) => (
                    <div
                      key={`badge-${index}-${badge}`}
                      className="h-6 w-24 animate-pulse rounded-full bg-slate-100"
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-4 p-5 lg:grid-cols-[2fr,1fr]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[0, 1, 2].map((stat) => (
                      <div
                        key={`stat-${index}-${stat}`}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                        <div className="mt-2 h-6 w-16 animate-pulse rounded bg-slate-100" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3].map((pill) => (
                        <div
                          key={`pill-${index}-${pill}`}
                          className="h-7 w-28 animate-pulse rounded-full bg-slate-100"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                  <div className="space-y-3">
                    {[0, 1].map((action) => (
                      <div
                        key={`action-${index}-${action}`}
                        className="h-10 w-full animate-pulse rounded bg-slate-100"
                      />
                    ))}
                  </div>
                  <div className="h-px w-full bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                    <div className="space-y-2">
                      {[0, 1, 2].map((item) => (
                        <div
                          key={`mr-${index}-${item}`}
                          className="h-8 w-full animate-pulse rounded bg-slate-100"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
