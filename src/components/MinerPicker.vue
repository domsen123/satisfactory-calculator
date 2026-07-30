<script setup lang="ts">
import IconImg from "@/components/IconImg.vue"
import MinerGrid from "@/components/MinerGrid.vue"
import type { MinerResourceView } from "@/stores/spec"

// The Miners-tab grid with a heading, shown next to a clicked graph node.
// Picking a cell re-renders the graph, which invalidates the node this was
// anchored to, so the host closes on select.
defineProps<{ setting: MinerResourceView }>()

const emit = defineEmits<{ select: [] }>()
</script>

<template>
    <div class="minerPickerTitle">
        <IconImg :icon="setting.recipe.icon" :size="32" />
        <span>{{ setting.recipe.name }}</span>
    </div>
    <MinerGrid
        :setting="setting"
        id-prefix="graph-"
        :show-resource-icon="false"
        @select="emit('select')"
    />
</template>
