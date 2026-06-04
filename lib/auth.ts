import { cookies } from "next/headers";

const SESSION_COOKIE = "rec_admin";
const USERNAME = process.env.ADMIN_USERNAME ?? "redfield";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "redfield2025";

// The cookie value is a token derived from username+password so a credentials
// change invalidates old sessions.
const SESSION_TOKEN = `${USERNAME}:${PASSWORD}`;

export async function isAdminLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_TOKEN;
}

export function checkCredentials(username: string, password: string): boolean {
  return username === USERNAME && password === PASSWORD;
}

export { SESSION_COOKIE, SESSION_TOKEN, USERNAME };
