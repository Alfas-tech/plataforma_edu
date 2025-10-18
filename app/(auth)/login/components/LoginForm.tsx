"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { login } from "@/src/presentation/actions/auth.actions";
import SignInWithGoogleButton from "./SignInWithGoogleButton";

export function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch("/dashboard/admin");
    router.prefetch("/dashboard/teacher");
    router.prefetch("/dashboard/student");
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    if (redirect) {
      formData.append("redirect", redirect);
    }

    try {
      const result = await login(formData);

      if (result?.error) {
        setError(result.error || "Error al iniciar sesión");
        setIsSubmitting(false);
      } else {
        const redirectTo = result?.redirectTo || redirect || "/dashboard";
        void router.prefetch(redirectTo);
        router.replace(redirectTo);
      }
    } catch (err) {
      setError("Ocurrió un error. Por favor intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="relative mx-auto max-w-sm">
      {isSubmitting && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/80 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <p className="text-sm font-medium text-slate-700">
            Iniciando sesión...
          </p>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>
          Ingresa tu correo electrónico para iniciar sesión en tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        {redirect && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-900">
              Debes iniciar sesión para acceder a esa página
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              {...register("email")}
              error={errors.email?.message}
              disabled={isSubmitting}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-slate-600 underline hover:text-slate-900"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              {...register("password")}
              error={errors.password?.message}
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>

          {/* Google Sign In */}
          <SignInWithGoogleButton />
        </form>

        <div className="mt-4 text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link href="/signup" className="underline hover:text-purple-600">
            Regístrate
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
