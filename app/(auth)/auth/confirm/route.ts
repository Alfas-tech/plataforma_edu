import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/infrastructure/supabase/server";
import { HandleOAuthCallbackUseCase } from "@/src/application/use-cases/auth/HandleOAuthCallbackUseCase";
import { SupabaseAuthRepository } from "@/src/infrastructure/repositories/SupabaseAuthRepository";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const code = searchParams.get("code");

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");
  redirectTo.searchParams.delete("code");

  const supabase = createClient();

  try {
    // Handle OAuth callback (Google, etc.) using Use Case
    if (code) {
      const authRepository = new SupabaseAuthRepository();
      const handleOAuthCallbackUseCase = new HandleOAuthCallbackUseCase(authRepository);
      
      const result = await handleOAuthCallbackUseCase.execute({
        code,
        next,
      });

      if (result.success) {
        redirectTo.pathname = result.redirectTo || "/dashboard";
        return NextResponse.redirect(redirectTo);
      } else {
        redirectTo.pathname = "/error";
        redirectTo.searchParams.set("error", "auth_failed");
        return NextResponse.redirect(redirectTo);
      }
    }

    // Handle OTP verification (email confirmations, password reset, etc.)
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

      if (!error) {
        // If it's recovery, ALWAYS redirect to update password
        if (type === "recovery") {
          redirectTo.pathname = "/auth/update-password";
          return NextResponse.redirect(redirectTo);
        }

        // For other types (signup, etc), use the next or home
        return NextResponse.redirect(redirectTo);
      } else {
        redirectTo.pathname = "/error";
        redirectTo.searchParams.set("error", "otp_verification_failed");
        return NextResponse.redirect(redirectTo);
      }
    }

    // If no code or tokenHash, check if user is already authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.redirect(redirectTo);
    }

    // If we reach here without valid parameters, redirect to error
    redirectTo.pathname = "/error";
    redirectTo.searchParams.set("error", "invalid_auth_params");
    return NextResponse.redirect(redirectTo);

  } catch (error) {
    redirectTo.pathname = "/error";
    redirectTo.searchParams.set("error", "unexpected_error");
    return NextResponse.redirect(redirectTo);
  }
}
