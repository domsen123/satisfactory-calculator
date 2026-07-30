<script setup lang="ts">
import { ref } from "vue"

import ItemsRow from "@/components/ItemsRow.vue"
import { useSpecStore } from "@/stores/spec"

const store = useSpecStore()

// Which breakdowns are expanded, keyed by row key so the state survives a
// re-solve. Previously this lived in the DOM as a class on reused <tr> nodes.
const openRows = ref(new Set<string>())

function toggle(key: string): void {
    if (openRows.value.has(key)) {
        openRows.value.delete(key)
    } else {
        openRows.value.add(key)
    }
}
</script>

<template>
    <table v-if="store.itemsTable !== null" id="totals" :class="{ nosurplus: store.itemsTable.nosurplus }">
        <thead>
            <tr>
                <th
                    v-for="(header, i) in store.itemsTable.headers"
                    :key="i"
                    :class="header.surplus ? 'surplus' : null"
                    :colspan="header.colspan"
                >{{ header.text }}</th>
            </tr>
        </thead>
        <tbody v-for="(group, i) in store.itemsTable.groups" :key="i">
            <ItemsRow
                v-for="row in group"
                :key="row.key"
                :row="row"
                :total-cols="store.itemsTable.totalCols"
                :open="openRows.has(row.key)"
                @toggle="toggle(row.key)"
            />
        </tbody>
        <tfoot>
            <tr>
                <td class="surplus"></td>
                <td class="right-align power-label" :colspan="store.itemsTable.powerLabelColspan">
                    <b>total average power: </b>
                </td>
                <td class="right-align pad"><tt>{{ store.itemsTable.totalAveragePower }}</tt></td>
            </tr>
            <tr>
                <td class="surplus"></td>
                <td class="right-align power-label" :colspan="store.itemsTable.powerLabelColspan">
                    <b>total peak power: </b>
                </td>
                <td class="right-align pad"><tt>{{ store.itemsTable.totalPeakPower }}</tt></td>
            </tr>
        </tfoot>
    </table>
</template>
