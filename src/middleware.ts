import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { readSessionToken, SESSION_COOKIE } from "@/server/auth";

// Negotiates the locale (cookie → Accept-Language → default) and rewrites to /[locale].
const intl = createMiddleware(routing);

// /[locale]/admin/* requires an ADMIN session. This is the broad edge gate;
// each admin route ALSO re-checks server-side via requireRole (defense in depth).
// Locales come from routing.locales so adding one can't silently leave a new
// /<locale>/admin path ungated at the edge.
const ADMIN_PATH = new RegExp(`^/(${routing.locales.join("|")})/admin(/|$)`);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ADMIN_PATH.test(pathname)) {
    const session = await readSessionToken(
      req.cookies.get(SESSION_COOKIE)?.value,
    );
    if (!session || session.role !== "ADMIN") {
      const locale = pathname.split("/")[1] || "en";
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return intl(req);
}

export const config = {
  // Skip API, Next internals, and anything with a file extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
