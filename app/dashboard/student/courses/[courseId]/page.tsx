import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { getCourseWithModulesAndLessons } from "@/src/presentation/actions/student.actions";
import { StudentCourseView } from "./components/StudentCourseView";

interface PageProps {
  params: {
    courseId: string;
  };
}

export default async function StudentCoursePage({ params }: PageProps) {
  const { courseId } = params;

  const profileResult = await getCurrentProfile();

  if ("error" in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  if (!profile.isStudent) {
    redirect("/dashboard");
  }

  // Obtener curso con módulos y lecciones
  const courseDataResult = await getCourseWithModulesAndLessons(courseId);

  if ("error" in courseDataResult) {
    redirect("/dashboard/student");
  }

  const { course, modules } = courseDataResult;

  return (
    <StudentCourseView
      course={course}
      modules={modules}
      studentId={profile.id}
      profile={{
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      }}
    />
  );
}
