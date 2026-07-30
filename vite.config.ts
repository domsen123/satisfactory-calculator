import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

// Relative base: the calculator resolves data/, images/ and third_party/ at
// runtime relative to the document, so the build must work from any subpath.
export default defineConfig({
    base: "./",
    plugins: [
        vue({
            // The legacy modules build "images/icons.svg#right" style hrefs at
            // runtime against public/, so template URLs must stay verbatim
            // rather than being rewritten into module imports.
            template: {
                transformAssetUrls: false,
                compilerOptions: {
                    // <tt> is obsolete, so it is absent from Vue's known-HTML
                    // tag list and every occurrence is otherwise reported as an
                    // unresolved component. The calculator relies on its
                    // default monospace rendering for aligned numbers.
                    isCustomElement: (tag) => tag === "tt",
                },
            },
        }),
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    build: {
        rollupOptions: {
            // calc.html is the canonical entry; every shared permalink points
            // at it. index.html only forwards to it, hash intact.
            input: {
                calc: fileURLToPath(new URL("./calc.html", import.meta.url)),
                index: fileURLToPath(new URL("./index.html", import.meta.url)),
            },
        },
    },
})
