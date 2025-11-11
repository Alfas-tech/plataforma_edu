import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signout } from "@/src/presentation/actions/auth.actions";

export type AdminHeaderProps = {
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  roleLabel?: string | null;
  title?: string;
  subtitle?: string;
  homeHref?: string;
};

export function AdminHeader({
  displayName,
  initials,
  avatarUrl,
  roleLabel,
  title,
  subtitle,
  homeHref,
}: AdminHeaderProps) {
  const headingTitle = title?.trim() || "Aprende Code";
  const headingSubtitle = subtitle?.trim() || null;
  const destination = homeHref || "/dashboard";
  const resolvedInitials = initials || headingTitle.charAt(0).toUpperCase() || "A";
  const resolvedDisplayName = displayName || headingTitle;
  const resolvedRole = roleLabel?.trim();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <Link
            href={destination}
            className="flex items-center gap-2 transition-opacity hover:opacity-80 sm:gap-3"
          >
            <div className="relative h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10">
              <Image src="/logo.png" alt="Aprende Code Logo" fill className="object-contain" priority />
            </div>
            {headingSubtitle ? (
              <div className="hidden flex-col sm:flex">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {headingSubtitle}
                </span>
                <span className="text-base font-semibold text-slate-900">{headingTitle}</span>
              </div>
            ) : (
              <h1 className="hidden truncate text-lg font-bold text-slate-800 sm:block md:text-xl">
                {headingTitle}
              </h1>
            )}
            <span className="text-sm font-semibold text-slate-900 sm:hidden">{headingTitle}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {resolvedRole ? (
              <span className="hidden text-xs font-medium text-purple-600 sm:inline sm:text-sm">
                {resolvedRole}
              </span>
            ) : null}
            {avatarUrl ? (
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full sm:h-10 sm:w-10">
                <Image src={avatarUrl} alt={resolvedDisplayName} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm">
                {resolvedInitials}
              </div>
            )}
            <span className="hidden max-w-[120px] truncate text-xs font-medium text-slate-700 sm:text-sm md:inline lg:max-w-none">
              {resolvedDisplayName}
            </span>
            <form action={signout}>
              <Button variant="outline" size="sm" type="submit" className="bg-transparent text-xs sm:text-sm">
                <LogOut className="h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
