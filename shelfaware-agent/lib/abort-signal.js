// Combines a timeout with an optional parent AbortSignal (Node 18-safe;
// AbortSignal.any is Node 20+). Used so a winning race slot can cancel the rest.

export function abortSignalFor(timeoutMs, parentSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  const onParentAbort = () => {
    clearTimeout(timer);
    controller.abort();
  };
  if (parentSignal) {
    if (parentSignal.aborted) onParentAbort();
    else parentSignal.addEventListener('abort', onParentAbort, { once: true });
  }
  return controller.signal;
}
