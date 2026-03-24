export function getLiveRouteRefreshIntervalMs(pollerIntervalMs: number) {
  return Math.min(Math.max(Math.floor(pollerIntervalMs / 2), 10_000), 30_000);
}
