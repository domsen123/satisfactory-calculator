// Structural types for the legacy game model in src/legacy. Those modules are
// still plain JS, so this file is the single place that describes their shapes
// to TypeScript. Only the members the ported code actually touches are listed;
// extend as further tabs are ported.

export interface Rational {
    add(other: Rational): Rational
    sub(other: Rational): Rational
    mul(other: Rational): Rational
    div(other: Rational): Rational
    less(other: Rational): boolean
    equal(other: Rational): boolean
    isZero(): boolean
    isInteger(): boolean
    floor(): Rational
    ceil(): Rational
    reciprocate(): Rational
    toFloat(): number
    toString(): string
    toMixed(): string
    toDecimal(places?: number): string
    toUpDecimal(places?: number): string
}

// Anything an Icon can represent. Objects without renderTooltip fall back to a
// plain title attribute, matching Icon.make in legacy/icon.js.
export interface IconSource {
    name: string
    renderTooltip?(): Node
}

export interface Icon {
    name: string
    obj: IconSource
    path(): string
    make(size?: number | null, suppressTooltip?: boolean, target?: Element): HTMLImageElement
}

export type Phase = "solid" | "fluid"

export interface Item {
    key: string
    name: string
    tier: number
    phase: Phase
    recipes: Recipe[]
    uses: Recipe[]
    icon: Icon
    disableRecipe: Recipe
    allRecipes(): Recipe[]
    renderTooltip(): Node
}

export interface Ingredient {
    item: Item
    amount: Rational
}

export interface Recipe {
    key: string
    name: string
    category: string | null
    time?: Rational
    ingredients: Ingredient[]
    products: Ingredient[]
    icon: Icon
    gives(item: Item): Rational
    uses?(item: Item): Rational
    isResource(): boolean
    isReal(): boolean
    isDisable(): boolean
    renderTooltip?(): Node
}

export interface Building {
    key: string
    name: string
    category: string
    power: Rational
    // null for miners, which cannot take somersloops.
    maxSomersloop: Rational | null
    icon: Icon
}

export interface Belt {
    key: string
    name: string
    rate: Rational
    icon: Icon
}

export interface Totals {
    rates: Map<Recipe, Rational>
    surplus: Map<Item, Rational>
    items: Map<Item, Rational>
    producers: Map<Item, Map<Recipe, Rational>>
    consumers: Map<Item, Map<Recipe, Rational>>
}

export interface ColorScheme {
    name: string
    key: string
    apply(): void
}

export interface Formatter {
    rateName: string
    longRate: string
    rateFactor: Rational
    displayFormat: string
    ratePrecision: number
    countPrecision: number
    setDisplayRate(rate: string): void
    rate(rate: Rational): string
    alignRate(rate: Rational): string
    count(count: Rational): string
    alignCount(count: Rational): string
}

export interface FactorySpec {
    items: Map<string, Item>
    recipes: Map<string, Recipe>
    belts: Map<string, Belt>
    pipes: Map<string, Belt>
    belt: Belt
    pipe: Belt
    ignore: Set<Item>
    overclock: Map<Recipe, Rational>
    somersloop: Map<Recipe, Rational>
    format: Formatter
    lastTotals: Totals | null
    getBuilding(recipe: Recipe): Building | null
    getCount(recipe: Recipe, rate: Rational): Rational
    getOverclock(recipe: Recipe): Rational
    setOverclock(recipe: Recipe, overclock: Rational): void
    setSomersloop(recipe: Recipe, count: Rational): void
    getBeltCount(rate: Rational): Rational
    getPipeCount(rate: Rational): Rational
    getPowerUsage(recipe: Recipe, rate: Rational): { average: Rational; peak: Rational }
    getRecipes(item: Item): Recipe[]
    toggleIgnore(item: Item): void
    setHash(): void
    display(): void
    updateSolution(): void
}
