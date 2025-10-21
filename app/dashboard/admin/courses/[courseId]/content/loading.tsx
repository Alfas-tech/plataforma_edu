import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function LoadingCourseContent() {
  return (
    <FullscreenLoader
      title="Cargando contenido del curso"
      message="Recopilando modulos, lecciones y configuraciones..."
    />
  );
}
