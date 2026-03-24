export function isAuthenticated(request: Request): boolean {
  const authHeader = request.headers.get('cookie');
  return authHeader?.includes('auth=true') ?? false;
}