import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function LoadingStudentDashboard() {
  return (
    <FullscreenLoader
      title="Cargando panel estudiantil"
      message="Buscando cursos, progreso y recomendaciones..."
      gradient="from-slate-50 via-blue-50 to-indigo-100"
    />
  );
}
