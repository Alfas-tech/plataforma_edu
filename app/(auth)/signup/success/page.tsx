import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function SignupSuccessPage() {
  return (
    <div className="flex h-svh items-center justify-center px-4">
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">¡Registro Exitoso!</CardTitle>
          <CardDescription>
            Tu cuenta ha sido creada correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Hemos enviado un correo de confirmación a tu email.
            Por favor revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Si no ves el correo, revisa tu carpeta de spam.
          </p>
          <Link href="/login" className="block">
            <Button className="w-full">
              Ir al inicio de sesión
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}