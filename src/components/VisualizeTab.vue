<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from "vue"

import MinerPicker from "@/components/MinerPicker.vue"
import { onGraphNodeClick } from "@/lib/graph-bus"
import type { Recipe } from "@/lib/types"
import { useSettingsStore } from "@/stores/settings"
import { useSpecStore } from "@/stores/spec"

const settings = useSettingsStore()
const store = useSpecStore()

const SVG_NS = "http://www.w3.org/2000/svg"
const container = useTemplateRef<HTMLDivElement>("container")

// Gap in pixels between the anchoring node and the picker, and from the
// viewport edge when the picker has to be nudged back inside.
const PICKER_GAP = 6

// The clicked node's recipe. shallowRef, never ref: the spec's maps are keyed by
// Recipe identity, and a deep reactive proxy would miss every lookup made with
// the object it wraps.
const pickerRecipe = shallowRef<Recipe | null>(null)
const pickerPos = ref({ left: 0, top: 0 })
const picker = useTemplateRef<HTMLDivElement>("picker")

// null for a node with nothing to configure, which the legacy side already
// filters out, and between the click and the first solve.
const pickerSetting = computed(() =>
    pickerRecipe.value === null ? null : store.minerSettingFor(pickerRecipe.value),
)

let anchor: DOMRect | null = null

function closePicker(): void {
    pickerRecipe.value = null
    anchor = null
}

// Places the picker under its node, flipping above it when the bottom of the
// window is in the way, then clamps it into the viewport. Runs after the panel
// is in the DOM, since it needs the rendered size.
function placePicker(): void {
    const el = picker.value
    if (el === null || anchor === null) {
        return
    }
    const { width, height } = el.getBoundingClientRect()
    let top = anchor.bottom + PICKER_GAP
    if (top + height + PICKER_GAP > window.innerHeight) {
        top = anchor.top - PICKER_GAP - height
    }
    pickerPos.value = {
        left: Math.max(PICKER_GAP, Math.min(anchor.left, window.innerWidth - width - PICKER_GAP)),
        top: Math.max(PICKER_GAP, Math.min(top, window.innerHeight - height - PICKER_GAP)),
    }
}

function onKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
        closePicker()
    }
}

// Every solve rebuilds the graph from scratch, so the element the picker is
// anchored to is gone by then: choosing a miner, or any other setting change,
// closes it.
watch(() => store.revision, closePicker)

// Everything inside #graph_container belongs to the legacy renderers, so Vue
// renders it empty and seeds the initial svg imperatively. It cannot be part of
// the template: sankey.js renders into this svg and clears its groups, while
// boxline.js empties the container outright and hands it to graphviz, whose svg
// it then relabels #graph. A template-owned element would leave Vue patching
// nodes that d3 had already replaced.
//
// Child mounted hooks run before the parent's, so this is in place before
// App.vue's onMounted(init) reaches the first solve.
let unsubscribe: (() => void) | null = null

onMounted(() => {
    const svg = document.createElementNS(SVG_NS, "svg")
    svg.id = "graph"
    svg.appendChild(document.createElementNS(SVG_NS, "g"))
    container.value?.appendChild(svg)

    unsubscribe = onGraphNodeClick((click) => {
        anchor = click.anchor
        pickerRecipe.value = click.recipe
        nextTick(placePicker)
    })
    window.addEventListener("keydown", onKeydown)
})

onBeforeUnmount(() => {
    unsubscribe?.()
    window.removeEventListener("keydown", onKeydown)
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

    <!-- Outside the container on purpose: boxline.js empties #graph_container
         before handing it to graphviz, so anything Vue owns has to live next to
         it rather than inside. The backdrop catches the click that dismisses the
         picker, and keeps a pan or a wheel-zoom from moving the graph out from
         under it. -->
    <template v-if="pickerSetting !== null">
        <div class="graphPickerClicker" @click="closePicker"></div>
        <div
            ref="picker"
            class="graphPicker"
            :style="{ left: `${pickerPos.left}px`, top: `${pickerPos.top}px` }"
        >
            <MinerPicker :setting="pickerSetting" @select="closePicker" />
        </div>
    </template>
</template>
