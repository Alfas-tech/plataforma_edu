"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
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

  useEffect(() => {
    const supabase = createClient();

    const fetchUserAndProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        console.log('Mobile Menu - User data:', user);

        // Obtener el perfil de la base de datos
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('avatar_url, full_name, email')
          .eq('id', user.id)
          .single();

        console.log('Mobile Menu - Profile data:', profileData);
        console.log('Mobile Menu - Profile error:', error);

        if (profileData) {
          setProfile(profileData);
        }
      }
    };

    fetchUserAndProfile();
  }, []);

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
    user?.email?.split('@')[0] ||
    null;

  const avatarUrl = profile?.avatar_url;

  console.log('Mobile Menu - Display name:', displayName);
  console.log('Mobile Menu - Avatar URL:', avatarUrl);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-lg">Menú</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {user && displayName && (
            <div className="p-4 border-b bg-slate-50">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-200">
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      fill
                      className="object-cover"
                      sizes="40px"
                      onError={(e) => {
                        console.error('Mobile Menu - Error loading image:', e);
                        console.error('Mobile Menu - Image URL was:', avatarUrl);
                      }}
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto py-4">
            <a
              href="#curso"
              className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={closeMenu}
            >
              El Curso
            </a>
            <a
              href="#profesores"
              className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={closeMenu}
            >
              Para Profesores
            </a>
            <a
              href="#estudiantes"
              className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={closeMenu}
            >
              Para Estudiantes
            </a>
            <a
              href="#recursos"
              className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={closeMenu}
            >
              Recursos
            </a>
          </nav>

          <div className="p-4 border-t">
            <LoginButton />
          </div>
        </div>
      </div>
    </>
  );
}