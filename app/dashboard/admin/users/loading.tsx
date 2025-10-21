import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function LoadingAdminUsers() {
  return (
    <FullscreenLoader
      title="Cargando gestion de usuarios"
      message="Obteniendo perfiles y roles en tiempo real..."
    />
  );
}
