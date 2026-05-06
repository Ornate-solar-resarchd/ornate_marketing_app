import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = /^\/(dashboard|admin)(\/.*)?$/;
const TOKEN_COOKIE = "marketing_token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only gate dashboard + admin routes
  if (!PROTECTED.test(pathname)) return NextResponse.next();

  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // We deliberately don't verify the JWT here — middleware runs on the edge
  // and the API does full verification on every request. Cookie presence is
  // enough to redirect unauthenticated users to /sign-in. Admin role check
  // also happens in the API for the relevant routes.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
