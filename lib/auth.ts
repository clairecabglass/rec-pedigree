import { cookies } from "next/headers";

const SESSION_COOKIE = "rec_admin";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "redfield2025";

export async function isAdminLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === PASSWORD;
}

export function checkPassword(pw: string): boolean {
  return pw === PASSWORD;
}

export { SESSION_COOKIE, PASSWORD };
