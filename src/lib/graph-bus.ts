import type { Recipe } from "./types"

// One-way channel from the legacy graph renderers to the Vue layer, mirroring
// solution-bus: src/legacy publishes without importing Pinia, and the Vue side
// never reaches into the d3 selections.

export interface GraphNodeClick {
    recipe: Recipe
    // Viewport-space box of the clicked node, snapshotted at click time. Every
    // setting change re-renders the graph and discards the element it came
    // from, so it is only good until the next solve.
    anchor: DOMRect
}

type Listener = (click: GraphNodeClick) => void

const listeners = new Set<Listener>()

export function onGraphNodeClick(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function publishGraphNodeClick(recipe: Recipe, anchor: DOMRect): void {
    for (const listener of listeners) {
        listener({ recipe, anchor })
    }
}
