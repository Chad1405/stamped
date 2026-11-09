// The approval page asks for a password with the browser's own prompt. With no ADMIN_PASSWORD set, nobody gets in.
import { NextResponse, type NextRequest } from "next/server";

const sha = async (s: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))).join();

function passwordFrom(req: NextRequest) {
  const [scheme, encoded] = (req.headers.get("authorization") ?? "").split(" ");
  if (scheme !== "Basic" || !encoded) return "";
  try { return new TextDecoder().decode(Uint8Array.from(atob(encoded), c => c.charCodeAt(0))).split(":").slice(1).join(":"); } catch { return ""; }
}

export async function middleware(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD, given = passwordFrom(req);
  if (expected && given && await sha(given) === await sha(expected)) return NextResponse.next();
  return new NextResponse("Password required.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Stamped admin", charset="UTF-8"' } });
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
