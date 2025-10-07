"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/infrastructure/supabase/client";
import { LogOut, User } from "lucide-react";

const LoginButton = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    fetchUser();

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      setUser(session?.user ?? null);
      setIsLoading(false);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();

    // Inmediatamente actualizar el estado local
    setUser(null);

    // Hacer logout en background
    supabase.auth.signOut().then(() => {
      router.push("/");
      router.refresh();
    });
  };

  // Siempre mostrar algo, nunca el estado de carga después de la primera carga
  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-full sm:w-auto">
        <span className="hidden sm:inline">Cargando...</span>
        <span className="sm:hidden">...</span>
      </Button>
    );
  }

  if (user) {
    return (
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Cerrar sesión</span>
        <span className="sm:hidden">Salir</span>
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      onClick={() => {
        router.push("/login");
      }}
      className="w-full gap-2 bg-sky-600 hover:bg-sky-700 sm:w-auto"
    >
      <User className="h-4 w-4" />
      <span className="hidden sm:inline">Iniciar sesión</span>
      <span className="sm:hidden">Login</span>
    </Button>
  );
};

export default LoginButton;
