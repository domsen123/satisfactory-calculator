/// <reference types="vite/client" />

declare module "*.vue" {
    import type { DefineComponent } from "vue"
    const component: DefineComponent<{}, {}, any>
    export default component
}

// Vendored third-party libraries are loaded as classic scripts from
// public/third_party and expose themselves as globals. They stay that way on
// purpose:
//
//   - graphvizlib/index.min.js locates graphvizlib.wasm via
//     document.currentScript.src, so it must be a real <script src>.
//   - d3-graphviz.js monkey-patches d3.selection.prototype.graphviz on the
//     single global d3 bundle, so d3 cannot become an npm import until
//     the visualizer is ported.
declare global {
    const d3: any
    const bigInt: any
    const pako: any
    const Popper: any
}

export {}
