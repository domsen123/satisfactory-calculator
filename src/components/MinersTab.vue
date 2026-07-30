<script setup lang="ts">
import MinerGrid from "@/components/MinerGrid.vue"
import { useSpecStore } from "@/stores/spec"

const store = useSpecStore()
</script>

<template>
    <div id="miner_settings">
        <MinerGrid v-for="resource in store.minerSettings" :key="resource.key" :setting="resource" />
    </div>
</template>
