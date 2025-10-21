import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function LoadingTeacherDashboard() {
  return (
    <FullscreenLoader
      title="Actualizando panel docente"
      message="Sincronizando cursos, versiones y estudiantes..."
      gradient="from-slate-50 via-emerald-50 to-teal-100"
    />
  );
}
