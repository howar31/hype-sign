import { useSyncExternalStore } from 'react';

// Tracks whether a freshly activated service worker has taken over while the
// page is still running the previously cached bundle. We do NOT call any SW
// API here — the plugin's auto-injected registerSW.js owns registration and
// the generated sw.js owns skipWaiting/clientsClaim. This module only listens
// to the controllerchange event that the browser dispatches as a result.
let updateReady = false;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function initSwUpdateWatcher(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  // First-time install: there is no controller yet, and the controllerchange
  // that fires when the brand-new SW claims this client is NOT a user-facing
  // update — it's the initial takeover. Skip wiring the listener entirely so
  // we never falsely flag "new version" on a first visit.
  if (!navigator.serviceWorker.controller) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updateReady) return;
    updateReady = true;
    emit();
  });
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): boolean {
  return updateReady;
}

export function useUpdateReady(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
