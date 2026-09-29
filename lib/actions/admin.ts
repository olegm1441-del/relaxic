"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE } from "@/lib/admin";

/**
 * Вход в сводку. Пароль — тот же ADMIN_TOKEN, что и у служебных маршрутов:
 * заводить вторую тайну ради одной страницы незачем.
 *
 * Токен кладём в httpOnly-куку: в адресной строке он попал бы в историю
 * браузера, в логи сервера и в заголовок Referer при переходе наружу.
 */
export async function adminSignIn(formData: FormData) {
  const expected = process.env.ADMIN_TOKEN;
  const given = String(formData.get("token") ?? "");
  if (!expected || given !== expected) redirect("/admin?e=1");

  (await cookies()).set(ADMIN_COOKIE, given, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 12,
  });
  redirect("/admin");
}

export async function adminSignOut() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin");
}
