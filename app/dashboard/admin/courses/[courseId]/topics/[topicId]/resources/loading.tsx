import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function LoadingTopicResources() {
  return (
    <FullscreenLoader
      title="Cargando recursos del tópico"
      message="Recopilando materiales y enlaces..."
    />
  );
}
