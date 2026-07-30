<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"

import { Tooltip, unregisterTooltip, type TooltipInstance } from "@/lib/legacy"
import type { Icon } from "@/lib/types"

// Vue equivalent of Icon.make in legacy/icon.js: an <img class="icon"> with a
// Popper tooltip when the underlying object can render one, and a plain title
// attribute when it cannot.
const props = withDefaults(
    defineProps<{
        icon: Icon
        size?: number | null
        suppressTooltip?: boolean
        // Node the tooltip is positioned against; defaults to the image.
        tooltipTarget?: Element | null
    }>(),
    { size: null, suppressTooltip: false, tooltipTarget: null },
)

const img = ref<HTMLImageElement | null>(null)
let tooltip: TooltipInstance | null = null

function teardown(): void {
    if (tooltip !== null) {
        // Unregister as well as remove: reapTooltips only collects tooltips
        // whose reference has already left the DOM, and it runs before Vue has
        // patched, so it would never see this one.
        unregisterTooltip(tooltip)
        tooltip.remove()
        tooltip = null
    }
}

function build(): void {
    teardown()
    if (props.suppressTooltip || img.value === null) {
        return
    }
    const content = props.icon.obj.renderTooltip?.()
    if (content === undefined) {
        return
    }
    tooltip = new Tooltip(img.value, content, props.tooltipTarget ?? undefined)
}

onMounted(build)
onBeforeUnmount(teardown)
watch(() => [props.icon, props.suppressTooltip, props.tooltipTarget], build)

const hasTooltip = (): boolean =>
    !props.suppressTooltip && props.icon.obj.renderTooltip !== undefined
</script>

<template>
    <img
        ref="img"
        class="icon"
        :src="icon.path()"
        :width="size ?? undefined"
        :height="size ?? undefined"
        :title="hasTooltip() ? undefined : icon.obj.name"
    >
</template>
