<script setup lang="ts">
import BuildTargetRow from "@/components/BuildTargetRow.vue"
import { useSpecStore } from "@/stores/spec"

const store = useSpecStore()
</script>

<template>
    <ul id="targets">
        <BuildTargetRow
            v-for="view in store.targets"
            :key="view.id"
            :view="view"
        />
        <li id="plusButton">
            <button class="targetButton ui" title="Add new item." @click="store.addTarget()">+</button>
        </li>
    </ul>
</template>
