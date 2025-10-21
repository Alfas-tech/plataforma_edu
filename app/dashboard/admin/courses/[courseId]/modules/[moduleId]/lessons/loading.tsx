import { FullscreenLoader } from "@/components/ui/fullscreen-loader";

export default function LoadingCourseModuleLessons() {
  return (
    <FullscreenLoader
      title="Preparando lecciones"
      message="Organizando secuencias y recursos del modulo..."
    />
  );
}
