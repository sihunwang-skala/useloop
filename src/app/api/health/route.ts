import { isDemoMode } from "@/lib/config";

export function GET() {
  return Response.json({ ok: true, mode: isDemoMode() ? "demo" : "production" });
}
