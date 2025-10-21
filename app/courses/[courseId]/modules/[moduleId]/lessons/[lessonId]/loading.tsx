import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function LoadingLessonPage() {
  return (
    <FullscreenLoader
      title="Cargando leccion"
      message="Preparando contenido interactivo y progreso..."
      gradient="from-slate-50 via-amber-50 to-orange-100"
    />
  );
}
