import { computed, ref, shallowRef } from "vue"
import { defineStore } from "pinia"

import { buildItemsTable, type ItemsTableView } from "@/lib/items-table"
import { one, Rational, spec, zero } from "@/lib/legacy"
import { onSolution } from "@/lib/solution-bus"
import type { Building, Item, Recipe, Totals } from "@/lib/types"

const hundred = Rational.from_float(100)
const maxOverclock = Rational.from_float(250)

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

    return { totals, revision, itemsTable, toggleIgnore, setOverclock, cycleSomersloop }
})
