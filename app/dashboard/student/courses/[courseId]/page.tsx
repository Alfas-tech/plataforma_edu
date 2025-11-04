import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { getCourseContent } from "@/src/presentation/actions/student.actions";
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

  // Get course with topics and resources
  const courseDataResult = await getCourseContent(courseId);

  if ("error" in courseDataResult) {
    redirect("/dashboard/student");
  }

  const { course, topics, version } = courseDataResult;

  return (
    <StudentCourseView
      course={{
        id: course.id,
        title: course.name,
        description: course.description,
        activeVersionId: course.activeVersionId,
      }}
      topics={topics}
      studentId={profile.id}
      profile={{
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      }}
    />
  );
}
