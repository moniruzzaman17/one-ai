import "server-only";
import { redirect } from "next/navigation";
import { getVerifiedAdmin, verifyCsrf } from "./session";
import { jsonError, validateSameOrigin } from "./request-security";

export async function requireAdmin() {
  const admin = await getVerifiedAdmin();
  if (!admin) redirect("/login");
  return admin;
}

export async function authorizeAdminApi(request: Request, mutation = false) {
  const admin = await getVerifiedAdmin();
  if (!admin) return { error: jsonError("Authentication required", 401), admin: null };
  if (mutation && (!validateSameOrigin(request) || !(await verifyCsrf(request)))) {
    return { error: jsonError("Invalid request token", 403), admin: null };
  }
  return { error: null, admin };
}
