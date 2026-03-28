"use server";

import { cookies } from "next/headers";
import { COOKIE_NAME, COOKIE_MAX_AGE, sign, verify } from "@/lib/auth";

export async function login(
  password: string
): Promise<{ success: boolean; error?: string }> {
  const parentPassword = process.env.AUTH_PASSWORD_PARENT;
  if (!parentPassword) {
    return { success: false, error: "服务器未配置密码" };
  }

  if (password !== parentPassword) {
    return { success: false, error: "密码错误" };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sign("parent"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return { success: true };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getRole(): Promise<"parent" | "student"> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return "student";
  const value = verify(cookie.value);
  return value === "parent" ? "parent" : "student";
}
