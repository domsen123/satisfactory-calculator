<script setup lang="ts">
import IconImg from "@/components/IconImg.vue"
import type { PriorityLevel, PriorityResource } from "@/lib/priority"
import { useSpecStore } from "@/stores/spec"

const store = useSpecStore()

// HTML5 drag and drop, as in legacy/priority.js. The resource div is not itself
// draggable; its icon is, being an <img>, and the dragstart bubbles up from
// there. While a drag is in flight the .dragging class turns off pointer events
// on the resources so the tiers beneath them receive dragenter/dragleave.
function onDragEnter(event: DragEvent): void {
    ;(event.currentTarget as Element).classList.add("highlight")
}

function onDragLeave(event: DragEvent): void {
    // Only when the pointer left this element itself, not a descendant.
    if (event.target === event.currentTarget) {
        ;(event.currentTarget as Element).classList.remove("highlight")
    }
}

function onDrop(event: DragEvent, move: (dragged: PriorityResource) => void): void {
    if (!store.hasPriorityDragItem) {
        return
    }
    event.preventDefault()
    ;(event.currentTarget as Element).classList.remove("highlight")
    store.finishPriorityDrag(move)
}

function dropOnLevel(level: PriorityLevel) {
    return (dragged: PriorityResource) => store.dropOnLevel(level, dragged)
}

function dropBeforeLevel(level: PriorityLevel) {
    return (dragged: PriorityResource) => store.dropBeforeLevel(level, dragged)
}

function onWeightChange(resource: PriorityResource, event: Event): void {
    store.setResourceWeight(resource, (event.target as HTMLInputElement).value)
}
</script>

<template>
    <div id="resource_settings" :class="{ dragging: store.priorityDragging }">
        <div
            class="resource-tier bookend"
            @dragover.prevent
            @dragenter="onDragEnter"
            @dragleave="onDragLeave"
            @drop="onDrop($event, store.dropBeforeFirstLevel)"
        >
            <span>less valuable</span>
        </div>

        <template v-for="(level, i) in store.priorityLevels" :key="level.key">
            <div
                v-if="i > 0"
                class="middle"
                @dragover.prevent
                @dragenter="onDragEnter"
                @dragleave="onDragLeave"
                @drop="onDrop($event, dropBeforeLevel(level.level))"
            ></div>
            <div
                class="resource-tier"
                @dragover.prevent
                @dragenter="onDragEnter"
                @dragleave="onDragLeave"
                @drop="onDrop($event, dropOnLevel(level.level))"
            >
                <div
                    v-for="resource in level.resources"
                    :key="resource.key"
                    class="resource"
                    @dragstart="store.startPriorityDrag(resource.resource)"
                    @dragend="store.endPriorityDrag()"
                >
                    <IconImg :icon="resource.recipe.icon" :size="48" />
                    <input
                        type="text"
                        size="4"
                        :value="resource.weight"
                        @change="onWeightChange(resource.resource, $event)"
                    >
                </div>
            </div>
        </template>

        <div
            class="resource-tier bookend"
            @dragover.prevent
            @dragenter="onDragEnter"
            @dragleave="onDragLeave"
            @drop="onDrop($event, store.dropAfterLastLevel)"
        >
            <span>more valuable</span>
        </div>
    </div>
</template>
