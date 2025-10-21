import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function LoadingAdminDashboard() {
  return (
    <FullscreenLoader
      title="Sincronizando panel administrador"
      message="Preparando estadisticas y accesos prioritarios..."
    />
  );
}
