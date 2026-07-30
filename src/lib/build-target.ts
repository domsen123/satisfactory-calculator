import { Rational as RawRational, zero as rawZero, one as rawOne } from "@/legacy/rational.js"
import { spec as rawSpec } from "@/legacy/factory.js"

import type { FactorySpec, Item, Rational, Recipe } from "./types"

const zero = rawZero as Rational
const one = rawOne as Rational
const Rational = RawRational as { from_string(s: string): Rational }

// factory.js imports this module for BuildTarget while this module needs the
// spec singleton, so the read is deferred to call time: at module-init the
// export it comes from is still in its temporal dead zone.
const spec = (): FactorySpec => rawSpec as FactorySpec

let nextId = 0

// One row of the build-target list. Ported from legacy/target.js, which kept
// the buildings and rate values in the DOM inputs it owned; they are fields
// here, and the component renders them.
export class BuildTarget {
    // Stable across reindexing, so the row component keeps following its target
    // when an earlier row is removed. index shifts; this does not.
    readonly id = nextId++
    index: number
    itemKey: string
    item: Item
    // Set when the item has more than one usable recipe.
    recipe: Recipe | null = null
    defaultRecipe: Recipe | null = null
    // Which of the two inputs the user last committed. The other is derived.
    changedBuilding = true
    buildings: Rational = one
    rate: Rational = zero
    // Raw input text. buildingsText is what the URL fragment serialises, so it
    // has to survive round-trips exactly as typed.
    buildingsText = "1"
    rateText = ""
    // Usable recipes; the recipe dropdown only appears when there are several.
    recipes: Recipe[] = []

    constructor(index: number, itemKey: string, item: Item) {
        this.index = index
        this.itemKey = itemKey
        this.item = item
        this.updateRecipes()
    }

    setItem(item: Item): void {
        this.itemKey = item.key
        this.item = item
        this.updateRecipes()
    }

    // Recomputes which recipes can produce this item, dropping the selected one
    // if it is no longer usable.
    updateRecipes(): void {
        const recipes: Recipe[] = []
        let found = false
        for (const recipe of this.item.recipes) {
            if (spec().disable.has(recipe) || recipe.isNetProducer?.(this.item) !== true) {
                continue
            }
            if (recipe === this.recipe) {
                found = true
            }
            recipes.push(recipe)
        }
        this.recipes = recipes
        if (!found) {
            this.recipe = null
        }
        if (recipes.length > 0) {
            this.defaultRecipe = recipes[0]!
        }
        if (recipes.length === 0) {
            this.defaultRecipe = null
            return
        } else if (recipes.length === 1) {
            this.recipe = recipes[0]!
            return
        }
        if (this.recipe === null) {
            this.recipe = recipes[0]!
        }
    }

    setRecipe(recipe: Recipe): void {
        this.recipe = recipe
    }

    // Returns this target's item rate, refreshing whichever of the two input
    // texts is the derived one.
    getRate(): Rational {
        let rate = zero
        const recipe = this.recipe
        if ((recipe === null || recipe.category === null) && this.changedBuilding) {
            this.rateChanged()
        }
        let baseRate: Rational | null = null
        if (recipe !== null) {
            baseRate = spec().getRecipeRate(recipe)
            if (baseRate !== null) {
                baseRate = baseRate.mul(recipe.gives(this.item))
            }
        }
        if (this.changedBuilding) {
            rate = baseRate!.mul(this.buildings)
            this.rateText = spec().format.rate(rate)
        } else {
            rate = this.rate
            if (baseRate !== null) {
                this.buildingsText = spec().format.count(rate.div(baseRate))
            } else {
                this.buildingsText = "N/A"
            }
            this.rateText = spec().format.rate(rate)
        }
        return rate
    }

    buildingsChanged(): void {
        this.changedBuilding = true
        this.buildings = Rational.from_string(this.buildingsText)
        this.rate = zero
        this.rateText = ""
    }

    setBuildings(count: string, recipe: Recipe | null): void {
        this.buildingsText = count
        this.recipe = recipe
        this.buildingsChanged()
    }

    rateChanged(): void {
        this.changedBuilding = false
        this.buildings = zero
        this.rate = Rational.from_string(this.rateText).div(spec().format.rateFactor)
        this.buildingsText = ""
    }

    setRate(rate: string): void {
        this.rateText = rate
        this.rateChanged()
    }
}
