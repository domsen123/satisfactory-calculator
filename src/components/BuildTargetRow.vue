<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from "vue"

import DropdownWrapper from "@/components/DropdownWrapper.vue"
import type { ItemGroup } from "@/lib/item-groups"
import type { Item, Recipe } from "@/lib/types"
import { useSettingsStore } from "@/stores/settings"
import { useSpecStore, type BuildTargetView } from "@/stores/spec"

const props = defineProps<{ view: BuildTargetView }>()

const store = useSpecStore()
const settings = useSettingsStore()

// Radio groups and label targets must be unique per row.
const uid = useId()
const itemGroup = `${uid}item`
const recipeGroup = `${uid}recipe`

const search = ref("")
const searchInput = useTemplateRef<HTMLInputElement>("searchInput")
const itemDropdown = useTemplateRef<InstanceType<typeof DropdownWrapper>>("itemDropdown")
const recipeDropdown = useTemplateRef<InstanceType<typeof DropdownWrapper>>("recipeDropdown")

// Mirrors legacy/target.js searchTargets: the query drops everything that is not
// alphanumeric, while item names only lose their hyphens.
const query = computed(() => search.value.toLowerCase().replace(/[^a-z0-9]+/g, ""))

function matches(item: Item): boolean {
    if (query.value === "") {
        return true
    }
    return item.name.toLowerCase().replace(/-/g, "").indexOf(query.value) !== -1
}

const visibleItems = computed(() =>
    query.value === "" ? [] : store.pickerGroups.flatMap((group) => group.items).filter(matches),
)

// A group whose every icon is filtered out drops its heading too, so the search
// results do not sit under a wall of empty categories.
function groupMatches(group: ItemGroup): boolean {
    return group.items.some(matches)
}

function onSearchKeyup(event: KeyboardEvent): void {
    if (query.value === "") {
        return
    }
    // Enter commits the search once it has narrowed to a single item.
    if (event.key === "Enter" && visibleItems.value.length === 1) {
        chooseItem(visibleItems.value[0]!)
    }
}

function chooseItem(item: Item): void {
    itemDropdown.value?.close()
    store.setTargetItem(props.view.target, item)
}

function chooseRecipe(recipe: Recipe): void {
    recipeDropdown.value?.close()
    store.setTargetRecipe(props.view.target, recipe)
}

function onBuildingsChange(event: Event): void {
    store.setTargetBuildings(props.view.target, (event.target as HTMLInputElement).value)
}

function onRateChange(event: Event): void {
    store.setTargetRate(props.view.target, (event.target as HTMLInputElement).value)
}
</script>

<template>
    <li class="target">
        <button
            class="targetButton ui"
            title="Remove this item."
            @click="store.removeTarget(view.target)"
        >x</button>

        <DropdownWrapper
            ref="itemDropdown"
            class="itemPicker"
            @open="searchInput?.focus()"
            @close="search = ''"
        >
            <input
                ref="searchInput"
                v-model="search"
                class="search"
                placeholder="Search"
                @keyup="onSearchKeyup"
            >
            <div v-for="group in store.pickerGroups" :key="group.name" class="itemGroup">
                <div v-show="groupMatches(group)" class="groupLabel">{{ group.name }}</div>
                <span v-for="item in group.items" :key="item.key">
                    <input
                        :id="`${itemGroup}-${item.key}`"
                        :name="itemGroup"
                        type="radio"
                        :checked="item === view.item"
                        @change="chooseItem(item)"
                    ><label
                        v-show="matches(item)"
                        :for="`${itemGroup}-${item.key}`"
                    ><img class="icon" :src="item.icon.path()" :title="item.name"></label>
                </span>
            </div>
        </DropdownWrapper>

        <label :class="{ selected: view.changedBuilding }"> Buildings: </label>

        <span>
            <template v-if="view.recipes.length > 1">
                <DropdownWrapper ref="recipeDropdown">
                    <div v-for="recipe in view.recipes" :key="recipe.key">
                        <input
                            :id="`${recipeGroup}-${recipe.key}`"
                            :name="recipeGroup"
                            type="radio"
                            :checked="recipe === view.recipe"
                            @change="chooseRecipe(recipe)"
                        ><label :for="`${recipeGroup}-${recipe.key}`">{{ recipe.name }}</label>
                    </div>
                </DropdownWrapper>
                <span> × </span>
            </template>
        </span>

        <input
            type="text"
            size="3"
            title="Enter a value to specify the number of buildings. The rate will be determined based on the number of items a single building can make."
            :value="view.buildingsText"
            @change="onBuildingsChange"
        >

        <label :class="{ selected: !view.changedBuilding }"> Items/{{ settings.longRate }}: </label>

        <input
            type="text"
            size="5"
            title="Enter a value to specify the rate. The number of buildings will be determined based on the rate."
            :value="view.rateText"
            @change="onRateChange"
        >
    </li>
</template>
