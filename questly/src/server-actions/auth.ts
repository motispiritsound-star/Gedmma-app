"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { rateLimiter } from "@/lib/rate-limit";
import { AppError, fail, type ActionResult } from "@/lib/errors";
import { LOCALE_COOKIE, parseLocale } from "@/modules/i18n";
import {
  authenticate,
  clientIp,
  createSession,
  destroySession,
  getSessionUser,
  issueVerificationToken,
  registerParent,
  registerSchema,
  signInSchema,
  verifyEmail,
} from "@/modules/auth";
import { AUDIT_ACTIONS, recordAudit } from "@/modules/audit";

type RegisterState = ActionResult<{ verificationToken: string | null }> | null;
type SignInState = ActionResult<undefined> | null;

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

async function guard(bucket: "auth", key: string): Promise<void> {
  const config = env();
  const result = rateLimiter.consume(
    `${bucket}:${key}`,
    config.RATE_LIMIT_AUTH_MAX,
    config.RATE_LIMIT_AUTH_WINDOW_SECONDS,
  );
  if (!result.allowed) {
    throw new AppError(
      `Too many attempts. Try again in ${result.retryAfterSeconds} seconds.`,
      "rate_limited",
      429,
    );
  }
}

export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const ip = await clientIp();

  try {
    await guard("auth", `register:${ip}`);
  } catch (error) {
    return fail(error instanceof AppError ? error.message : "Too many attempts.", "rate_limited");
  }

  const cookieStore = await cookies();
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    familyName: formData.get("familyName"),
    locale: parseLocale(cookieStore.get(LOCALE_COOKIE)?.value) ?? "nl",
    consent: formData.get("consent") ?? false,
  });

  if (!parsed.success) {
    return fail("Check the fields below.", "invalid", fieldErrors(parsed.error));
  }

  let verificationToken: string | null = null;
  try {
    const result = await registerParent(parsed.data, ip);
    verificationToken = result.verificationToken;
    await createSession(result.userId);
  } catch (error) {
    if (error instanceof AppError) return fail(error.message, error.code);
    logger.error("auth.register_failed", { error: String(error) });
    return fail("Something went wrong. Please try again.", "internal");
  }

  redirect(verificationToken ? `/verify?token=${encodeURIComponent(verificationToken)}&new=1` : "/verify");
}

export async function signInAction(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const ip = await clientIp();
  const emailRaw = String(formData.get("email") ?? "").toLowerCase();

  try {
    // Limit per address as well as per IP, so one shared IP cannot be used to
    // spray a single account, and one client cannot spray many accounts.
    await guard("auth", `signin:${ip}`);
    await guard("auth", `signin-account:${emailRaw}`);
  } catch (error) {
    return fail(error instanceof AppError ? error.message : "Too many attempts.", "rate_limited");
  }

  const parsed = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    return fail("Check the fields below.", "invalid", fieldErrors(parsed.error));
  }

  const result = await authenticate(parsed.data, ip);
  if (!result) return fail("That email address and password do not match.", "invalid_credentials");

  await createSession(result.userId);
  redirect("/home");
}

export async function signOutAction(): Promise<void> {
  const user = await getSessionUser();
  await destroySession();
  if (user) {
    await recordAudit({
      action: AUDIT_ACTIONS.userSignedOut,
      targetType: "user",
      targetId: user.id,
      actorUserId: user.id,
      familyId: user.familyId,
    });
  }
  redirect("/");
}

export async function verifyEmailAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const ip = await clientIp();
  const verified = await verifyEmail(token, ip);
  redirect(verified ? "/onboarding" : "/verify?error=1");
}

export async function resendVerificationAction(): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  const token = await issueVerificationToken(user.id);
  redirect(env().AUTH_SHOW_VERIFICATION_LINK ? `/verify?token=${encodeURIComponent(token)}` : "/verify?sent=1");
}
