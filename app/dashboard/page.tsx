import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";

export default async function DashboardPage() {
  // Get current user profile with role
  const result = await getCurrentProfile();

  // If no user, redirect to login
  if ('error' in result) {
    redirect("/login");
  }

  const { profile } = result;

  // Redirect based on role
  if (profile.isAdmin) {
    redirect("/dashboard/admin");
  } else if (profile.isTeacher) {
    redirect("/dashboard/teacher");
  } else {
    redirect("/dashboard/student");
  }
}
