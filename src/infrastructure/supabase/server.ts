import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  // `cookies()` throws when called outside a request scope (e.g. in Jest tests).
  // Provide a safe fallback cookie store so server helpers can run in tests.
  let cookieStore: any;
  try {
    cookieStore = cookies();
  } catch (err) {
    // Fallback minimal cookie store: get returns undefined, set/remove are no-ops
    cookieStore = {
      get: (_name: string) => undefined,
      set: (_cookie: any) => {},
      // some environments may expect `delete` instead of `set` for removal
      delete: (_name: string) => {},
    };
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const v = cookieStore.get?.(name);
            return v?.value;
          } catch (e) {
            return undefined;
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // original implementation uses cookieStore.set when available
            if (typeof cookieStore.set === "function") {
              cookieStore.set({ name, value, ...options });
            } else if (typeof cookieStore.delete === "function") {
              // fallback: some stores expose different APIs; ignore for tests
              // no-op
            }
          } catch (error) {
            // ignore errors when setting cookies from server components or tests
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            if (typeof cookieStore.set === "function") {
              // emulate removal by setting empty value
              cookieStore.set({ name, value: "", ...options });
            } else if (typeof cookieStore.delete === "function") {
              cookieStore.delete(name);
            }
          } catch (error) {
            // ignore errors when removing cookies from server components or tests
          }
        },
      },
    }
  );
}
