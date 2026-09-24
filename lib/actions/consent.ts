"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { POLICY_VERSION } from "@/lib/legal";

/**
 * 152-ФЗ: без записи факта согласия его нельзя подтвердить при проверке.
 * Пишем версию текста, время, IP и user-agent — этого достаточно.
 * Ошибка записи не должна ломать сайт: выбор пользователя уже сохранён
 * у него в localStorage, а баннер не должен всплывать снова из-за сбоя базы.
 */
export async function recordConsent(analytics: boolean, marketing: boolean) {
  if (!prisma) return { ok: false, reason: "no-db" as const };
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;
    await prisma.consent.create({
      data: {
        kind: "cookie",
        analytics,
        marketing,
        policyVersion: POLICY_VERSION,
        ip,
        userAgent: h.get("user-agent")?.slice(0, 500) ?? null,
      },
    });
    return { ok: true as const };
  } catch {
    return { ok: false, reason: "error" as const };
  }
}
