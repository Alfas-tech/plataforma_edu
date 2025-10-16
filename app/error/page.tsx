import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  searchParams: {
    error?: string;
  };
}

interface ErrorInfo {
  readonly title: string;
  readonly description: string;
  readonly suggestion: string;
}

type ErrorType =
  | "auth_failed"
  | "otp_verification_failed"
  | "invalid_auth_params"
  | "unexpected_error";

export default function ErrorPage({
  searchParams,
}: ErrorPageProps): JSX.Element {
  const errorType: ErrorType | undefined = searchParams.error as
    | ErrorType
    | undefined;

  const getErrorInfo = (errorType?: ErrorType): ErrorInfo => {
    switch (errorType) {
      case "auth_failed":
        return {
          title: "Error de autenticación",
          description:
            "No se pudo completar el proceso de autenticación con Google. Por favor, intenta de nuevo.",
          suggestion:
            "Verifica que tu cuenta de Google esté configurada correctamente.",
        };
      case "otp_verification_failed":
        return {
          title: "Error de verificación",
          description: "No se pudo verificar el código de confirmación.",
          suggestion: "El enlace puede haber expirado. Solicita uno nuevo.",
        };
      case "invalid_auth_params":
        return {
          title: "Parámetros inválidos",
          description: "Los parámetros de autenticación no son válidos.",
          suggestion: "Intenta iniciar sesión nuevamente desde el principio.",
        };
      case "unexpected_error":
        return {
          title: "Error inesperado",
          description:
            "Ocurrió un error inesperado durante el proceso de autenticación.",
          suggestion:
            "Por favor, intenta de nuevo. Si el problema persiste, contacta con soporte.",
        };
      default:
        return {
          title: "Algo salió mal",
          description: "Ocurrió un error al procesar tu solicitud",
          suggestion:
            "Por favor, intenta de nuevo. Si el problema persiste, contacta con soporte.",
        };
    }
  };

  const errorInfo: ErrorInfo = getErrorInfo(errorType);

  return (
    <div className="flex h-svh items-center justify-center px-4">
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
          <CardDescription>{errorInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {errorInfo.suggestion}
          </p>

          <div className="flex flex-col gap-2">
            <Link href="/login">
              <Button className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Intentar de nuevo
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Volver al inicio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
