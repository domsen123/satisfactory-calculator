import { computed, ref, shallowRef } from "vue"
import { defineStore } from "pinia"

import { buildItemGroups, type ItemGroup } from "@/lib/item-groups"
import { buildItemsTable, type ItemsTableView } from "@/lib/items-table"
import { getRecipeGroups, one, Rational, resourcePurities, spec, zero } from "@/lib/legacy"
import type { PriorityLevel, PriorityResource } from "@/lib/priority"
import { onSolution } from "@/lib/solution-bus"
import type {
    Building,
    BuildTargetLike,
    DebugMatrix,
    Item,
    Recipe,
    ResourcePurity,
    Totals,
} from "@/lib/types"

const hundred = Rational.from_float(100)
const maxOverclock = Rational.from_float(250)

export interface RecipeToggle {
    recipe: Recipe
    selected: boolean
}

export interface DebugMatrixRow {
    // Set for the rows that correspond to a recipe; the last two are labelled.
    recipe: Recipe | null
    label: string
    cells: string[]
}

export interface DebugMatrixView {
    items: Item[]
    recipes: Recipe[]
    targets: Array<{ item: Item; recipe: Recipe }>
    rows: DebugMatrixRow[]
}

export interface PriorityResourceView {
    key: string
    resource: PriorityResource
    recipe: Recipe
    weight: string
}

export interface PriorityLevelView {
    key: number
    level: PriorityLevel
    resources: PriorityResourceView[]
}

export interface MinerCell {
    id: string
    minerDef: Building
    purity: ResourcePurity
    selected: boolean
}

export interface MinerPurityRow {
    purityKey: string
    purityName: string
    cells: MinerCell[]
}

export interface MinerResourceView {
    key: string
    recipe: Recipe
    minerDefs: Building[]
    purities: MinerPurityRow[]
}

// The recipe grouping depends only on the game data, which is loaded once, so it
// is memoised rather than recomputed for every solve.
let cachedRecipeGroups: Recipe[][] | null = null

// Likewise for the item picker's categories.
let cachedItemGroups: ItemGroup[] | null = null

function itemGroups(): ItemGroup[] {
    if (cachedItemGroups === null) {
        cachedItemGroups = buildItemGroups(spec.items)
    }
    return cachedItemGroups
}

function recipeGroups(): Recipe[][] {
    if (cachedRecipeGroups === null) {
        cachedRecipeGroups = Array.from(getRecipeGroups(new Set(spec.recipes.values())))
            .filter((group) => group.size > 1)
            .map((group) => Array.from(group))
    }
    return cachedRecipeGroups
}

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

    // Item picker: the game's items in category order. Same "first solve means
    // the data is loaded" gate as recipeToggles below.
    const pickerGroups = computed<ItemGroup[]>(() => {
        void revision.value
        return totals.value === null ? [] : itemGroups()
    })

    // Alt-Recipes: groups of interchangeable recipes, with the enabled ones
    // flagged.
    const recipeToggles = computed<RecipeToggle[][]>(() => {
        void revision.value
        // The components mount before init() loads the game data, and the spec's
        // maps are null until then. The first solve is what publishes a revision,
        // so that doubles as the "data is ready" signal.
        if (totals.value === null) {
            return []
        }
        return recipeGroups().map((group) =>
            group.map((recipe) => ({ recipe, selected: !spec.disable.has(recipe) })),
        )
    })

    function toggleRecipe(recipe: Recipe): void {
        if (spec.disable.has(recipe)) {
            spec.setEnable(recipe)
        } else {
            spec.setDisable(recipe)
        }
        spec.updateSolution()
    }

    // Miners: one table per resource recipe, a row per purity and a column per
    // miner tier.
    const minerSettings = computed<MinerResourceView[]>(() => {
        void revision.value
        if (totals.value === null) {
            return []
        }
        const result: MinerResourceView[] = []
        for (const [recipe, { miner, purity }] of spec.minerSettings) {
            const minerDefs = spec.buildings.get(recipe.category!) ?? []
            result.push({
                key: recipe.key,
                recipe,
                minerDefs,
                purities: resourcePurities.map((purityDef) => ({
                    purityKey: purityDef.key,
                    purityName: purityDef.name,
                    cells: minerDefs.map((minerDef) => ({
                        id: `miner.${recipe.key}.${purityDef.key}.${minerDef.key}`,
                        minerDef,
                        purity: purityDef,
                        selected: miner === minerDef && purity === purityDef,
                    })),
                })),
            })
        }
        return result
    })

    // Same rows, looked up by the recipe a clicked graph node carries. Keyed by
    // recipe.key rather than the object so the caller cannot miss on identity.
    const minerSettingsByRecipe = computed<Map<string, MinerResourceView>>(
        () => new Map(minerSettings.value.map((view) => [view.recipe.key, view])),
    )

    function minerSettingFor(recipe: Recipe): MinerResourceView | null {
        return minerSettingsByRecipe.value.get(recipe.key) ?? null
    }

    function setMiner(recipe: Recipe, miner: Building, purity: ResourcePurity): void {
        spec.setMiner(recipe, miner, purity)
        spec.display()
    }

    // Resources: priority levels, least valuable first.
    const priorityLevels = computed<PriorityLevelView[]>(() => {
        void revision.value
        if (totals.value === null || spec.priority === null) {
            return []
        }
        return spec.priority.priorities.map((level) => ({
            key: level.id,
            level,
            resources: level.resources.map((resource) => ({
                key: resource.recipe.key,
                resource,
                recipe: resource.recipe,
                weight: resource.weight.toString(),
            })),
        }))
    })

    // The resource being dragged, and whether a drag is in flight. These are
    // separate because the original cleared the drag item on drop but only
    // dropped the .dragging class on dragend, which fires afterwards.
    const priorityDragItem = shallowRef<PriorityResource | null>(null)
    const priorityDragging = ref(false)
    const hasPriorityDragItem = computed(() => priorityDragItem.value !== null)

    function startPriorityDrag(resource: PriorityResource): void {
        priorityDragItem.value = resource
        priorityDragging.value = true
    }

    function endPriorityDrag(): void {
        priorityDragging.value = false
    }

    // Runs a drop, which moves the dragged resource, then re-solves.
    function finishPriorityDrag(move: (dragged: PriorityResource) => void): void {
        const dragged = priorityDragItem.value
        if (dragged === null) {
            return
        }
        move(dragged)
        priorityDragItem.value = null
        spec.updateSolution()
    }

    function dropOnLevel(level: PriorityLevel, dragged: PriorityResource): void {
        if (dragged.level !== level) {
            level.insertSorted(dragged)
        }
    }

    function dropBeforeLevel(level: PriorityLevel, dragged: PriorityResource): void {
        spec.priority!.addPriorityBefore(level).insertSorted(dragged)
    }

    function dropBeforeFirstLevel(dragged: PriorityResource): void {
        spec.priority!.addPriorityBefore(spec.priority!.getFirstLevel()).insertSorted(dragged)
    }

    function dropAfterLastLevel(dragged: PriorityResource): void {
        spec.priority!.addPriorityBefore(null).insertSorted(dragged)
    }

    // Debug: the simplex tableau from the last solve, rendered only while the
    // checkbox is on, matching the original's `if (this.debug) renderDebug()`.
    const debug = ref(spec.debug)

    function buildDebugMatrix(matrix: DebugMatrix | null): DebugMatrixView | null {
        const meta = spec.lastMetadata
        if (matrix === null || meta === null) {
            return null
        }
        const rows: DebugMatrixRow[] = []
        for (let r = 0; r < matrix.rows; r++) {
            const cells: string[] = []
            for (let c = 0; c < matrix.cols; c++) {
                cells.push(matrix.index(r, c).toString())
            }
            rows.push({
                recipe: r < meta.recipes.length ? meta.recipes[r]! : null,
                label: r === matrix.rows - 2 ? "tax" : "answer",
                cells,
            })
        }
        return { items: meta.items, recipes: meta.recipes, targets: meta.targets, rows }
    }

    const debugTableau = computed<DebugMatrixView | null>(() => {
        void revision.value
        return debug.value ? buildDebugMatrix(spec.lastTableau) : null
    })

    const debugSolution = computed<DebugMatrixView | null>(() => {
        void revision.value
        return debug.value ? buildDebugMatrix(spec.lastSolution) : null
    })

    const debugMessage = computed(() => {
        void revision.value
        if (!debug.value) {
            return ""
        }
        return spec.lastTableau === null
            ? "No tableau required."
            : "Displaying previous tableau."
    })

    function setDebug(value: boolean): void {
        debug.value = value
        spec.debug = value
        spec.display()
    }

    // Applies the `debug` URL fragment setting.
    function loadDebug(enabled: boolean): void {
        debug.value = enabled
        spec.debug = enabled
    }

    function setResourceWeight(resource: PriorityResource, text: string): void {
        resource.weight = Rational.from_string(text)
        resource.level?.insertSorted(resource)
        spec.updateSolution()
    }

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

    // The input texts are whatever the user typed or the formatter produced, so
    // they can be a fraction ("1+1/2") or the "N/A" the buildings field shows
    // for a recipe without a rate. Anything unparsable steps from zero, and no
    // input goes negative.
    function stepText(text: string, delta: number): Rational {
        let value: Rational
        try {
            value = Rational.from_string(text.trim())
        } catch {
            value = zero
        }
        value = value.add(Rational.from_float(delta))
        return value.less(zero) ? zero : value
    }

    function stepTargetBuildings(target: BuildTargetLike, delta: number): void {
        setTargetBuildings(target, spec.format.count(stepText(target.buildingsText, delta)))
    }

    function stepTargetRate(target: BuildTargetLike, delta: number): void {
        // rateText is in display-rate units, while format.rate scales into them,
        // so the stepped value has to be divided back out first.
        const rate = stepText(target.rateText, delta).div(spec.format.rateFactor)
        setTargetRate(target, spec.format.rate(rate))
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
        pickerGroups,
        recipeToggles,
        minerSettings,
        minerSettingFor,
        priorityLevels,
        debug,
        debugTableau,
        debugSolution,
        debugMessage,
        setDebug,
        loadDebug,
        priorityDragging,
        hasPriorityDragItem,
        toggleRecipe,
        setMiner,
        startPriorityDrag,
        endPriorityDrag,
        finishPriorityDrag,
        dropOnLevel,
        dropBeforeLevel,
        dropBeforeFirstLevel,
        dropAfterLastLevel,
        setResourceWeight,
        toggleIgnore,
        setOverclock,
        cycleSomersloop,
        addTarget,
        removeTarget,
        setTargetItem,
        setTargetRecipe,
        setTargetBuildings,
        setTargetRate,
        stepTargetBuildings,
        stepTargetRate,
    }
})
