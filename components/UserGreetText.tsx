"use client";
import { createClient } from "@/utils/supabase/client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

interface Profile {
  avatar_url: string | null;
  full_name: string | null;
}

const UserGreetText = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchUserAndProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        console.log('User data:', user);

        // Obtener el perfil de la base de datos
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('avatar_url, full_name, email')
          .eq('id', user.id)
          .single();

        console.log('Profile data:', profileData);
        console.log('Profile error:', error);

        if (profileData) {
          setProfile(profileData);
        }
      }

      setIsLoading(false);
    };

    fetchUserAndProfile();
  }, []);

  if (isLoading) {
    return null;
  }

  if (user !== null) {
    // Priorizar el nombre del perfil, luego metadata, luego email
    const displayName =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      "Usuario";

    const avatarUrl = profile?.avatar_url;

    console.log('Display name:', displayName);
    console.log('Avatar URL:', avatarUrl);

    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200">
        {avatarUrl ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-200">
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              sizes="32px"
              onError={(e) => {
                console.error('Error loading image:', e);
                console.error('Image URL was:', avatarUrl);
              }}
              unoptimized
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm flex-shrink-0">
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