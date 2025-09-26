"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { signout } from "@/lib/auth-actions";
import { LogOut, LogIn } from "lucide-react";

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
  }, []);

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
        onClick={() => {
          signout();
          setUser(null);
        }}
        variant="outline"
        className="w-full sm:w-auto gap-2"
      >
        <LogOut className="w-4 h-4" />
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
      className="w-full sm:w-auto gap-2"
    >
      <LogIn className="w-4 h-4" />
      <span className="hidden sm:inline">Iniciar sesión</span>
      <span className="sm:hidden">Login</span>
    </Button>
  );
};

export default LoginButton;