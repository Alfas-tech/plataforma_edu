import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function RootLoading() {
  return (
    <FullscreenLoader
      title="Iniciando plataforma"
      message="Preparando recursos principales..."
    />
  );
}
