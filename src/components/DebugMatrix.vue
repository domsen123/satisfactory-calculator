<script setup lang="ts">
import IconImg from "@/components/IconImg.vue"
import type { DebugMatrixView } from "@/stores/spec"

// One simplex tableau. Ported from renderMatrix in legacy/debug.js.
defineProps<{ matrix: DebugMatrixView }>()
</script>

<template>
    <table border="1">
        <tbody>
            <tr>
                <th></th>
                <th v-for="item in matrix.items" :key="item.key">
                    s<IconImg :icon="item.icon" :size="32" class="item-icon" />
                </th>
                <th v-for="(target, t) in matrix.targets" :key="t">
                    <IconImg :icon="target.item.icon" :size="32" />⇐<IconImg
                        :icon="target.recipe.icon"
                        :size="32"
                    />
                </th>
                <th>tax</th>
                <th v-for="recipe in matrix.recipes" :key="recipe.key">
                    <IconImg :icon="recipe.icon" :size="32" class="item-icon" />
                </th>
                <th>answer</th>
                <th>C</th>
            </tr>
            <tr v-for="(row, r) in matrix.rows" :key="r">
                <td>
                    <IconImg v-if="row.recipe !== null" :icon="row.recipe.icon" :size="32" class="item-icon" />
                    <template v-else>{{ row.label }}</template>
                </td>
                <td v-for="(cell, c) in row.cells" :key="c" class="right-align">
                    <tt>{{ cell }}</tt>
                </td>
            </tr>
        </tbody>
    </table>
</template>
