import { markRaw } from "vue"

import type { Totals } from "./types"

// One-way channel from the legacy solver to the Vue layer.
//
// This module deliberately imports nothing from src/legacy and nothing from the
// store, so legacy/factory.js can publish without an import cycle and without
// knowing that Pinia exists.

type Listener = (totals: Totals) => void

const listeners = new Set<Listener>()
let lastTotals: Totals | null = null

// Subscribes to solutions. Replays the most recent one immediately, so a
// subscriber created after the first solve still gets it.
export function onSolution(listener: Listener): () => void {
    listeners.add(listener)
    if (lastTotals !== null) {
        listener(lastTotals)
    }
    return () => listeners.delete(listener)
}

export function publishSolution(totals: Totals): void {
    // The solution graph is keyed by Item and Recipe object identity. markRaw
    // keeps it out of any reactive proxy: a proxy-wrapped key would make
    // totals.items.get(item) miss, since the proxy is not the object the map
    // was keyed with.
    lastTotals = markRaw(totals)
    for (const listener of listeners) {
        listener(lastTotals)
    }
}
