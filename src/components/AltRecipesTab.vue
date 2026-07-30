<script setup lang="ts">
import RecipeCard from "@/components/RecipeCard.vue"
import { useSpecStore } from "@/stores/spec"

const store = useSpecStore()
</script>

<template>
    <div id="recipe_toggles">
        <div v-for="(group, g) in store.recipeToggles" :key="g" class="toggle-row">
            <div
                v-for="entry in group"
                :key="entry.recipe.key"
                class="toggle recipe"
                :class="{ selected: entry.selected }"
                :title="entry.recipe.name"
                @click="store.toggleRecipe(entry.recipe)"
            >
                <RecipeCard :recipe="entry.recipe" />
            </div>
        </div>
    </div>
</template>
