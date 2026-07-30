<script setup lang="ts">
import IconImg from "@/components/IconImg.vue"
import type { Building, ResourcePurity } from "@/lib/types"
import { useSpecStore, type MinerResourceView } from "@/stores/spec"

// One resource's miner grid: purity down the rows, miner tier across the
// columns. Rendered both as a row of the Miners tab and inside the picker the
// visualizer opens on a node, so ids take a prefix — both grids for the same
// resource can be in the document at once, and a shared radio group name would
// merge them.
const props = withDefaults(
    defineProps<{
        setting: MinerResourceView
        idPrefix?: string
        // The Miners tab labels each grid with the resource icon in the corner
        // cell; the picker has its own heading instead.
        showResourceIcon?: boolean
    }>(),
    { idPrefix: "", showResourceIcon: true },
)

const emit = defineEmits<{ select: [] }>()

const store = useSpecStore()

function select(miner: Building, purity: ResourcePurity): void {
    store.setMiner(props.setting.recipe, miner, purity)
    emit("select")
}
</script>

<template>
    <table class="resource">
        <tbody>
            <tr>
                <th>
                    <IconImg v-if="showResourceIcon" :icon="setting.recipe.icon" :size="32" />
                </th>
                <th v-for="minerDef in setting.minerDefs" :key="minerDef.key">
                    <IconImg :icon="minerDef.icon" :size="32" />
                </th>
            </tr>
            <tr v-for="purity in setting.purities" :key="purity.purityKey">
                <td>{{ purity.purityName }}</td>
                <td v-for="cell in purity.cells" :key="cell.id">
                    <input
                        :id="`${idPrefix}${cell.id}`"
                        type="radio"
                        :name="`${idPrefix}${setting.recipe.key}`"
                        :checked="cell.selected"
                        @change="select(cell.minerDef, cell.purity)"
                    ><label :for="`${idPrefix}${cell.id}`">
                        <!-- The width/height here are unitless on purpose: the d3 version
                             set them the same way, the browser drops both declarations,
                             and the svg falls back to its intrinsic size. -->
                        <svg viewBox="0,0,32,32" style="width: 32; height: 32">
                            <rect x="0" y="0" width="32" height="32" rx="4" ry="4"></rect>
                        </svg>
                    </label>
                </td>
            </tr>
        </tbody>
    </table>
</template>
