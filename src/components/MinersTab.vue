<script setup lang="ts">
import IconImg from "@/components/IconImg.vue"
import { useSpecStore } from "@/stores/spec"

const store = useSpecStore()
</script>

<template>
    <div id="miner_settings">
        <table v-for="resource in store.minerSettings" :key="resource.key" class="resource">
            <tbody>
                <tr>
                    <th><IconImg :icon="resource.recipe.icon" :size="32" /></th>
                    <th v-for="minerDef in resource.minerDefs" :key="minerDef.key">
                        <IconImg :icon="minerDef.icon" :size="32" />
                    </th>
                </tr>
                <tr v-for="purity in resource.purities" :key="purity.purityKey">
                    <td>{{ purity.purityName }}</td>
                    <td v-for="cell in purity.cells" :key="cell.id">
                        <input
                            :id="cell.id"
                            type="radio"
                            :name="resource.recipe.key"
                            :checked="cell.selected"
                            @change="store.setMiner(resource.recipe, cell.minerDef, cell.purity)"
                        ><label :for="cell.id">
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
    </div>
</template>
