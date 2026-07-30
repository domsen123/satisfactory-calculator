<script setup lang="ts">
import IconImg from "@/components/IconImg.vue"
import { spec } from "@/lib/legacy"
import type { Rational, Recipe } from "@/lib/types"

// Products, an arrow, then ingredients. Mirrors renderRecipe in legacy/recipe.js,
// which is still used to build the recipe tooltips and so stays there. Renders
// as a fragment so the caller's element keeps the .recipe class the CSS expects.
defineProps<{ recipe: Recipe }>()

function count(amount: Rational): string {
    return spec.format.count(amount)
}
</script>

<template>
    <span class="title">{{ recipe.name }}</span>
    <br>
    <span>
        <span
            v-for="ing in recipe.products"
            :key="ing.item.key"
            class="ingredient"
            :title="ing.item.name"
        >
            <IconImg :icon="ing.item.icon" :size="32" />
            <span class="count">{{ count(ing.amount) }}</span>
        </span>
    </span>
    <span class="arrow">⇐</span>
    <span>
        <span
            v-for="ing in recipe.ingredients"
            :key="ing.item.key"
            class="ingredient"
            :title="ing.item.name"
        >
            <IconImg :icon="ing.item.icon" :size="32" />
            <span class="count">{{ count(ing.amount) }}</span>
        </span>
    </span>
</template>
