import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="flex h-svh items-center justify-center px-4">
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Revisa tu correo</CardTitle>
          <CardDescription>
            Te hemos enviado un enlace de confirmación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <strong>Importante:</strong> Para activar tu cuenta, haz clic en
              el enlace que te enviamos por correo electrónico.
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Una vez que confirmes tu correo, podrás iniciar sesión.</p>
            <p>
              Si no ves el correo, revisa tu carpeta de spam o correo no
              deseado.
            </p>
          </div>

          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Volver al inicio de sesión
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
