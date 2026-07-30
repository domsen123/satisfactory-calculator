import { computed, ref, shallowRef } from "vue"
import { defineStore } from "pinia"

import { buildItemsTable, type ItemsTableView } from "@/lib/items-table"
import { one, Rational, spec, zero } from "@/lib/legacy"
import { onSolution } from "@/lib/solution-bus"
import type { Building, BuildTargetLike, Item, Recipe, Totals } from "@/lib/types"

const hundred = Rational.from_float(100)
const maxOverclock = Rational.from_float(250)

// Per-revision snapshot of a build target. The raw instance rides along so the
// actions can mutate it.
export interface BuildTargetView {
    target: BuildTargetLike
    id: number
    item: Item
    recipe: Recipe | null
    recipes: Recipe[]
    changedBuilding: boolean
    buildingsText: string
    rateText: string
}

export const useSpecStore = defineStore("spec", () => {
    // shallowRef, never ref/reactive: the solution graph is keyed by Item and
    // Recipe object identity, and a deep reactive proxy would break every
    // map lookup that uses those objects as keys.
    const totals = shallowRef<Totals | null>(null)

    // FactorySpecification is a mutable singleton that stays outside Vue's
    // reactivity entirely. Settings changes mutate it in place and then call
    // spec.display(), which publishes; this counter is what tells derived state
    // that the singleton moved, so anything reading spec directly must read it.
    const revision = ref(0)

    onSolution((next) => {
        totals.value = next
        revision.value++
    })

    const itemsTable = computed<ItemsTableView | null>(() => {
        void revision.value
        return totals.value === null ? null : buildItemsTable(totals.value)
    })

    // spec.buildTargets is a plain array the legacy loaders also push to, and the
    // BuildTarget instances are not reactive, so a fresh snapshot object per
    // target per revision is what makes the row components re-render. Handing the
    // instances straight through would leave their props reference-equal and
    // Vue would skip the update.
    const targets = computed<BuildTargetView[]>(() => {
        void revision.value
        return spec.buildTargets.map((target) => ({
            target,
            id: target.id,
            item: target.item,
            recipe: target.recipe,
            recipes: target.recipes.slice(),
            changedBuilding: target.changedBuilding,
            buildingsText: target.buildingsText,
            rateText: target.rateText,
        }))
    })

    function addTarget(): void {
        spec.addTarget()
        spec.updateSolution()
    }

    function removeTarget(target: BuildTargetLike): void {
        spec.removeTarget(target)
        spec.updateSolution()
    }

    function setTargetItem(target: BuildTargetLike, item: Item): void {
        target.setItem(item)
        spec.updateSolution()
    }

    function setTargetRecipe(target: BuildTargetLike, recipe: Recipe): void {
        target.setRecipe(recipe)
        spec.updateSolution()
    }

    function setTargetBuildings(target: BuildTargetLike, text: string): void {
        target.buildingsText = text
        target.buildingsChanged()
        spec.updateSolution()
    }

    function setTargetRate(target: BuildTargetLike, text: string): void {
        target.rateText = text
        target.rateChanged()
        spec.updateSolution()
    }

    function toggleIgnore(item: Item): void {
        spec.toggleIgnore(item)
        spec.updateSolution()
    }

    // Mirrors the clamp the legacy overclock input applied: whole percentages
    // in [1, 250].
    function setOverclock(recipe: Recipe, value: string): void {
        let x = Rational.from_string(value).floor()
        if (x.less(one)) {
            x = one
        }
        if (maxOverclock.less(x)) {
            x = maxOverclock
        }
        spec.setOverclock(recipe, x.div(hundred))
        spec.display()
    }

    // Clicking the somersloop meter steps the count down, wrapping to the
    // building's maximum once it hits zero.
    function cycleSomersloop(recipe: Recipe, building: Building): void {
        const max = building.maxSomersloop
        if (max === null) {
            return
        }
        const count = spec.somersloop.get(recipe) ?? zero
        spec.setSomersloop(recipe, count.equal(zero) ? max : count.sub(one))
        spec.updateSolution()
    }

    return {
        totals,
        revision,
        itemsTable,
        targets,
        toggleIgnore,
        setOverclock,
        cycleSomersloop,
        addTarget,
        removeTarget,
        setTargetItem,
        setTargetRecipe,
        setTargetBuildings,
        setTargetRate,
    }
})
