<script setup lang="ts">
import DebugMatrix from "@/components/DebugMatrix.vue"
import { useSpecStore } from "@/stores/spec"

const store = useSpecStore()
</script>

<template>
    <div id="debug_tab" class="tab">
        <div id="debug_message">{{ store.debugMessage }}</div>

        <label for="render_debug">Render debug tab:</label>
        <input
            id="render_debug"
            type="checkbox"
            :checked="store.debug"
            @change="store.setDebug(($event.target as HTMLInputElement).checked)"
        ><br>
        Last tableau:
        <div id="debug_tableau">
            <DebugMatrix v-if="store.debugTableau !== null" :matrix="store.debugTableau" />
        </div>
        Last solution:
        <div id="debug_solution">
            <DebugMatrix v-if="store.debugSolution !== null" :matrix="store.debugSolution" />
        </div>
    </div>
</template>
