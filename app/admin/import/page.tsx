import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import ImportClient from "./ImportClient";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  return <ImportClient />;
}
