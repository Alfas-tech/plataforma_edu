/**
 * Builds a redirect URL using the configured site URL from environment variables.
 * This is needed for Cloud Run where request.nextUrl.clone() returns localhost.
 *
 * @param pathname - The path to redirect to (e.g., "/dashboard", "/auth/update-password")
 * @param searchParams - Optional URL search parameters to include in the redirect
 * @returns A fully qualified URL using the NEXT_PUBLIC_SITE_URL
 */
export function buildRedirectUrl(
  pathname: string,
  searchParams?: URLSearchParams
): URL {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = new URL(pathname, siteUrl);

  if (searchParams) {
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  return url;
}
