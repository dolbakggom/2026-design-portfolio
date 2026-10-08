import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

type AccessConfiguration = { teamDomain: string; audience: string };
const keySets = new Map<string, JWTVerifyGetKey>();

export const isAdminPath = (pathname: string) =>
  pathname === "/admin" || pathname.startsWith("/admin/") ||
  pathname === "/api/admin" || pathname.startsWith("/api/admin/");

export const verifyCloudflareAccess = async (
  request: Request,
  configuration: AccessConfiguration,
  keys?: JWTVerifyGetKey
) => {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || token.length > 16384 || !configuration.audience ||
      !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(configuration.teamDomain)) return false;

  try {
    const issuer = `https://${configuration.teamDomain}`;
    if (!keys) {
      // Cache only public signing keys, never user tokens or authentication decisions.
      keys = keySets.get(issuer);
      if (!keys) {
        keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`), { timeoutDuration: 5000 });
        keySets.set(issuer, keys);
      }
    }
    await jwtVerify(token, keys, {
      issuer,
      audience: configuration.audience,
      algorithms: ["RS256"],
      requiredClaims: ["exp", "iat", "sub"],
      clockTolerance: 5
    });
    return true;
  } catch {
    return false;
  }
};
