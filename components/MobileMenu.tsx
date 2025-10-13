"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { createClient } from "@/src/infrastructure/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LoginButton from "./LoginLogoutButton";

interface Profile {
  avatar_url: string | null;
  full_name: string | null;
}

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const fetchUserAndProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, full_name, email")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      }
    };

    fetchUserAndProfile();

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, full_name, email")
          .eq("id", session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        router.refresh();
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    null;

  const avatarUrl = profile?.avatar_url;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMenu}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 h-full w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Menú</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {user && displayName && (
            <div className="border-b bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      fill
                      className="object-cover"
                      sizes="40px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto py-4">
            <a
              href="#curso"
              className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              onClick={closeMenu}
            >
              El Curso
            </a>
            <a
              href="#profesores"
              className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              onClick={closeMenu}
            >
              Para Profesores
            </a>
            <a
              href="#estudiantes"
              className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              onClick={closeMenu}
            >
              Para Estudiantes
            </a>
            <a
              href="#recursos"
              className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              onClick={closeMenu}
            >
              Recursos
            </a>
          </nav>

          <div className="border-t p-4">
            <LoginButton />
          </div>
        </div>
      </div>
    </>
  );
}
