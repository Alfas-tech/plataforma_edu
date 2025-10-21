import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function LoadingDashboard() {
  return (
    <FullscreenLoader
      title="Preparando tu panel"
      message="Cargando tu experiencia personalizada..."
    />
  );
}
