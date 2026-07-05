/** Keep parent layouts mounted when switching nested tabs (case stations, etc.). */

export function routeTransitionKey(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'cases' && parts[1]) return `/cases/${parts[1]}`;
  if (parts[0] === 'share' && parts[1]) return `/share/${parts[1]}`;
  return pathname;
}

export function isCaseTabSwitch(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  return parts[0] === 'cases' && parts.length >= 3;
}

export function shouldScrollOnNavigate(prevPath: string, nextPath: string): boolean {
  if (routeTransitionKey(prevPath) === routeTransitionKey(nextPath)) return false;
  return prevPath !== nextPath;
}