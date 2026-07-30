<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue"

import { useSettingsStore } from "@/stores/settings"

const settings = useSettingsStore()

const SVG_NS = "http://www.w3.org/2000/svg"
const container = useTemplateRef<HTMLDivElement>("container")

// Everything inside #graph_container belongs to the legacy renderers, so Vue
// renders it empty and seeds the initial svg imperatively. It cannot be part of
// the template: sankey.js renders into this svg and clears its groups, while
// boxline.js empties the container outright and hands it to graphviz, whose svg
// it then relabels #graph. A template-owned element would leave Vue patching
// nodes that d3 had already replaced.
//
// Child mounted hooks run before the parent's, so this is in place before
// App.vue's onMounted(init) reaches the first solve.
onMounted(() => {
    const svg = document.createElementNS(SVG_NS, "svg")
    svg.id = "graph"
    svg.appendChild(document.createElementNS(SVG_NS, "g"))
    container.value?.appendChild(svg)
})
</script>

<template>
    <div class="graph_setting">
        <form id="graph_type">
            <input
                id="sankey_type"
                type="radio"
                name="type"
                value="sankey"
                autocomplete="off"
                :checked="settings.visualizerType === 'sankey'"
                @change="settings.setVisualizer('sankey')"
            >
            <label for="sankey_type">
                <svg viewBox="0 0 64 64" width="64" height="64">
                    <use href="images/icons.svg#sankey"></use>
                </svg>
            </label>

            <input
                id="boxline_type"
                type="radio"
                name="type"
                value="boxline"
                autocomplete="off"
                :checked="settings.visualizerType === 'boxline'"
                @change="settings.setVisualizer('boxline')"
            >
            <label for="boxline_type">
                <svg viewBox="0 0 64 64" width="64" height="64">
                    <use href="images/icons.svg#boxline"></use>
                </svg>
            </label>
        </form>
    </div>
    <div class="graph_setting">
        Render mode:<br>
        <form id="graph_render">
            <input
                id="zoom_render"
                type="radio"
                name="render"
                value="zoom"
                autocomplete="off"
                :checked="settings.visualizerRender === 'zoom'"
                @change="settings.setRenderMode('zoom')"
            >
            <label for="zoom_render">Zoom &amp; pan</label>

            <input
                id="fix_render"
                type="radio"
                name="render"
                value="fix"
                autocomplete="off"
                :checked="settings.visualizerRender === 'fix'"
                @change="settings.setRenderMode('fix')"
            >
            <label for="fix_render">Fixed</label>
        </form>
    </div>
    <div id="graph_container" ref="container"></div>
</template>
