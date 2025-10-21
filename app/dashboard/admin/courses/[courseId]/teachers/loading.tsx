import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function LoadingCourseTeachers() {
  return (
    <FullscreenLoader
      title="Sincronizando equipo docente"
      message="Consultando ediciones y asignaciones activas..."
    />
  );
}
