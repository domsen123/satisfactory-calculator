<script setup lang="ts">
import IconImg from "@/components/IconImg.vue"
import type { ItemsRowView } from "@/lib/items-table"
import { useSpecStore } from "@/stores/spec"

// Renders one row of the Items table plus its (initially collapsed) breakdown
// row. The two must be siblings inside the same tbody: the breakdown's
// visibility and the arrow rotation are driven by a shared class.
defineOptions({ inheritAttrs: false })

const props = defineProps<{
    row: ItemsRowView
    totalCols: number
    open: boolean
}>()

const emit = defineEmits<{ toggle: [] }>()

const store = useSpecStore()

// Space + multiplication sign, as a constant so the template compiler's
// whitespace condensing cannot eat the leading space.
const TIMES = " ×"

function onOverclockInput(event: Event): void {
    if (props.row.recipe !== null) {
        store.setOverclock(props.row.recipe, (event.target as HTMLInputElement).value)
    }
}

function onSloopClick(event: MouseEvent): void {
    event.preventDefault()
    if (props.row.recipe !== null && props.row.building !== null) {
        store.cycleSomersloop(props.row.recipe, props.row.building)
    }
}
</script>

<template>
    <tr
        class="display-row"
        :class="{ nobuilding: row.nobuilding, noitem: row.noitem, nosloop: row.nosloop, 'breakdown-open': open }"
    >
        <td class="item" @click="emit('toggle')">
            <svg class="breakdown-arrow" viewBox="0 0 16 16" width="16" height="16">
                <use href="images/icons.svg#right"></use>
            </svg>
        </td>

        <td class="item item-icon">
            <IconImg
                v-if="row.item !== null"
                :icon="row.item.icon"
                :size="32"
                :class="{ ignore: row.ignored }"
                @click="store.toggleIgnore(row.item)"
            />
        </td>

        <td class="item right-align"><tt class="item-rate">{{ row.itemRate }}</tt></td>
        <td class="item surplus right-align"><tt class="surplus-rate">{{ row.surplusRate }}</tt></td>

        <td class="item pad belt-icon">
            <template v-if="row.transport !== null">
                <IconImg :icon="row.transport.icon" :size="32" />
                <span>{{ TIMES }}</span>
            </template>
        </td>
        <td class="item right-align">
            <tt class="belt-count">{{ row.transport === null ? "" : row.transport.count }}</tt>
        </td>

        <td class="pad building building-icon right-align">
            <template v-if="row.building !== null">
                <template v-if="!row.single && row.recipe !== null">
                    <IconImg :icon="row.recipe.icon" :size="32" />
                    <span>:</span>
                </template>
                <IconImg :icon="row.building.icon" :size="32" />
                <span>{{ TIMES }}</span>
            </template>
        </td>
        <td class="right-align building"><tt class="building-count">{{ row.buildingCount }}</tt></td>

        <td class="pad building">
            <input
                class="overclock"
                type="number"
                title=""
                min="1"
                max="250"
                :value="row.overclock"
                @input="onOverclockInput"
            >
            <span>%</span>
        </td>

        <td class="pad building sloopcell">
            <div class="sloop">
                <img src="images/Somersloop.png" width="32" height="32">
                <div class="meter" :style="{ height: row.sloop === null ? undefined : row.sloop.meterHeight }"></div>
                <div class="count">{{ row.sloop === null ? "" : row.sloop.count }}</div>
                <div class="sloopclick" @click="onSloopClick"></div>
            </div>
        </td>

        <td class="right-align pad building"><tt class="power">{{ row.power }}</tt></td>

        <td class="popout pad item">
            <a v-if="row.item !== null" :href="row.popoutHref" target="_blank" title="Open this item in separate window.">
                <svg class="popout" viewBox="0 0 24 24" width="24" height="24">
                    <use href="images/icons.svg#popout"></use>
                </svg>
            </a>
        </td>
    </tr>

    <tr v-if="row.breakdown !== null" class="breakdown" :class="{ 'breakdown-open': open }">
        <td></td>
        <td :colspan="totalCols - 1">
            <table>
                <tbody>
                    <tr
                        v-for="bd in row.breakdown"
                        :key="bd.key"
                        :class="{ 'breakdown-first-output': bd.divider }"
                    >
                        <td>
                            <IconImg :icon="bd.recipe.icon" :size="32" class="item-icon" />
                            <svg class="usage-arrow" viewBox="0 0 18 16" width="18" height="16">
                                <use href="images/icons.svg#rightarrow"></use>
                            </svg>
                            <IconImg :icon="bd.item.icon" :size="32" class="item-icon" />
                        </td>
                        <td class="right-align"><tt class="item-rate pad-right">{{ bd.rate }}</tt></td>
                        <td>
                            <template v-if="bd.transport !== null">
                                <IconImg :icon="bd.transport.icon" :size="32" />
                                <span>{{ TIMES }}</span>
                            </template>
                        </td>
                        <td class="right-align">
                            <tt class="belt-count pad-right">{{ bd.transport === null ? "" : bd.transport.count }}</tt>
                        </td>
                        <td :class="{ building: bd.buildingIcon !== null }">
                            <template v-if="bd.buildingIcon !== null">
                                <IconImg :icon="bd.buildingIcon" :size="32" />
                                <span>{{ TIMES }}</span>
                            </template>
                        </td>
                        <td :class="{ 'building pad-right': bd.buildingCount !== null }">
                            <tt v-if="bd.buildingCount !== null">{{ bd.buildingCount }}</tt>
                        </td>
                        <td :class="{ 'right-align': bd.percent !== null }">
                            <tt v-if="bd.percent !== null">{{ bd.percent }}</tt>
                        </td>
                    </tr>
                </tbody>
            </table>
        </td>
    </tr>
</template>
