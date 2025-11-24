import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/infrastructure/supabase/server";
import { HandleOAuthCallbackUseCase } from "@/src/application/use-cases/auth/HandleOAuthCallbackUseCase";
import { SupabaseAuthRepository } from "@/src/infrastructure/repositories/SupabaseAuthRepository";
import { buildRedirectUrl } from "@/src/lib/url-helpers";


export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const code = searchParams.get("code");

  const supabase = createClient();

  try {
    // Handle OAuth callback (Google, etc.) using Use Case
    if (code) {
      const authRepository = new SupabaseAuthRepository();
      const handleOAuthCallbackUseCase = new HandleOAuthCallbackUseCase(
        authRepository
      );

      const result = await handleOAuthCallbackUseCase.execute({
        code,
        next,
      });

      if (result.success) {
        const dashboardUrl = buildRedirectUrl(result.redirectTo || "/dashboard");
        return NextResponse.redirect(dashboardUrl);
      } else {
        const params = new URLSearchParams();
        params.set("error", "auth_failed");
        const errorUrl = buildRedirectUrl("/error", params);
        return NextResponse.redirect(errorUrl);
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
          const recoveryUrl = buildRedirectUrl("/auth/update-password");
          return NextResponse.redirect(recoveryUrl);
        }

        // For other types (signup, etc), use the next or home
        const successUrl = buildRedirectUrl(next);
        return NextResponse.redirect(successUrl);
      } else {
        const params = new URLSearchParams();
        params.set("error", "otp_verification_failed");
        const errorUrl = buildRedirectUrl("/error", params);
        return NextResponse.redirect(errorUrl);
      }
    }

    // If no code or tokenHash, check if user is already authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const userUrl = buildRedirectUrl(next);
      return NextResponse.redirect(userUrl);
    }

    // If we reach here without valid parameters, redirect to error
    const params = new URLSearchParams();
    params.set("error", "invalid_auth_params");
    const errorUrl = buildRedirectUrl("/error", params);
    return NextResponse.redirect(errorUrl);
  } catch (error) {
    const params = new URLSearchParams();
    params.set("error", "unexpected_error");
    const errorUrl = buildRedirectUrl("/error", params);
    return NextResponse.redirect(errorUrl);
  }
}

