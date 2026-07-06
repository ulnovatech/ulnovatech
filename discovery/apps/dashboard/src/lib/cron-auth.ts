/** Shared cron secret check for middleware and route handlers. */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  return request.headers.get('x-cron-secret') === secret;
}
