"use client";
import { createClient } from "@/src/infrastructure/supabase/client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Profile {
  avatar_url: string | null;
  full_name: string | null;
}

const UserGreetText = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

      setIsLoading(false);
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

  if (isLoading) {
    return null;
  }

  if (user !== null) {
    const displayName =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Usuario";

    const avatarUrl = profile?.avatar_url;

    return (
      <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 md:flex">
        {avatarUrl ? (
          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              sizes="32px"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700">
          {displayName}
        </span>
      </div>
    );
  }

  return null;
};

export default UserGreetText;
