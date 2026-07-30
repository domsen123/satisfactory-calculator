<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from "vue"

// Chrome for the icon dropdowns, matching the structure dropdown.css styles: a
// .clicker overlay that catches outside clicks while open, the .dropdown itself,
// and a .spacer that reserves the closed dropdown's footprint once the .dropdown
// becomes absolutely positioned.
//
// legacy/dropdown.js toggled from both the .dropdown click handler and the
// radio's change event, which fired two or three times per interaction and
// depended on that count being odd. Here the background toggles and choosing an
// item closes, with clicks on controls excluded from the background handler so
// the two cannot race.
const emit = defineEmits<{ open: []; close: [] }>()

const open = ref(false)
const spacerStyle = ref<{ width?: string; height?: string }>({})
const wrapper = useTemplateRef<HTMLDivElement>("wrapper")

function close(): void {
    if (!open.value) {
        return
    }
    open.value = false
    emit("close")
}

function openDropdown(): void {
    // Measure the selected label before the .open class lands, because opening
    // scales the icons from 32px to 64px.
    const selected = wrapper.value?.querySelector("input:checked + label")
    if (selected) {
        const style = getComputedStyle(selected)
        spacerStyle.value = { width: style.width, height: style.height }
    }
    open.value = true
    // After the patch, not before: the contents are display:none while closed,
    // and a listener that focuses the search box cannot focus a hidden element.
    nextTick(() => emit("open"))
}

// Clicks that land on a control are that control's business: the radio's change
// handler closes after selecting, and clicking the search box must not close.
// Everything else in the dropdown toggles, which is how the closed dropdown
// opens (its one visible label has pointer-events: none, so the click lands
// here) and how a click on the open dropdown's background dismisses it.
function onBackgroundClick(event: MouseEvent): void {
    if ((event.target as Element | null)?.closest("label, input") !== null) {
        return
    }
    if (open.value) {
        close()
    } else {
        openDropdown()
    }
}

defineExpose({ close })
</script>

<template>
    <div ref="wrapper" class="dropdownWrapper" :class="{ open }">
        <div class="clicker" @click="close"></div>
        <div class="dropdown" @click="onBackgroundClick"><slot /></div>
        <div class="spacer" :style="spacerStyle"></div>
    </div>
</template>
