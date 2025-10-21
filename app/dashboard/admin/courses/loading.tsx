import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function LoadingAdminCourses() {
  return (
    <FullscreenLoader
      title="Organizando catalogo de cursos"
      message="Sincronizando ediciones, docentes y metricas..."
    />
  );
}
