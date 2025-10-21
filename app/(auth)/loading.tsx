import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function AuthGroupLoading() {
  return (
    <FullscreenLoader
      title="Preparando acceso"
      message="Validando credenciales y seguridad..."
      gradient="from-slate-50 via-blue-50 to-indigo-50"
    />
  );
}
