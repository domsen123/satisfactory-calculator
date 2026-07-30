// Derives everything the Items tab renders from a solved Totals. Ported from
// the d3-selection code that used to live in legacy/display.js.
//
// Every Rational is formatted to a string here, so the components stay purely
// presentational and no reactive proxy ever touches the game model.

import { formatSettings, getRecipeGroups, one, Rational, spec, topoSort, zero } from "./legacy"
import type { Building, Icon, Item, Recipe, Totals } from "./types"

const hundred = Rational.from_float(100)

export interface ItemsHeader {
    text: string
    colspan: number
    surplus: boolean
}

export interface TransportView {
    icon: Icon
    count: string
}

export interface SloopView {
    count: string
    meterHeight: string
}

export interface BreakdownView {
    key: string
    recipe: Recipe
    item: Item
    rate: string
    transport: TransportView | null
    buildingIcon: Icon | null
    buildingCount: string | null
    percent: string | null
    divider: boolean
}

export interface ItemsRowView {
    key: string
    item: Item | null
    recipe: Recipe | null
    building: Building | null
    ignored: boolean
    // True when the item and the recipe share a name, in which case the recipe
    // icon is redundant and omitted from the building cell.
    single: boolean
    nobuilding: boolean
    noitem: boolean
    nosloop: boolean
    itemRate: string
    surplusRate: string
    transport: TransportView | null
    buildingCount: string
    overclock: string
    sloop: SloopView | null
    power: string
    popoutHref: string
    breakdown: BreakdownView[] | null
}

export interface ItemsTableView {
    headers: ItemsHeader[]
    totalCols: number
    powerLabelColspan: number
    nosurplus: boolean
    groups: ItemsRowView[][]
    totalAveragePower: string
    totalPeakPower: string
}

function transportFor(item: Item, rate: Rational): TransportView {
    if (item.phase === "fluid") {
        return { icon: spec.pipe.icon, count: spec.format.alignCount(spec.getPipeCount(rate)) }
    }
    return { icon: spec.belt.icon, count: spec.format.alignCount(spec.getBeltCount(rate)) }
}

function breakdownTransportFor(item: Item, rate: Rational): TransportView {
    const belt = item.phase === "fluid" ? spec.pipe : spec.belt
    return { icon: belt.icon, count: spec.format.alignCount(rate.div(belt.rate)) }
}

// The top half of the breakdown gives every ingredient used by every recipe
// that produced the given item. If a given ingredient is produced by a single
// recipe, then a building count for that recipe is given.
//
// The bottom half gives every recipe which consumes the given item. If the
// given item is produced by a single recipe, then the proportion of that
// recipe's building count is given.
function getBreakdown(item: Item, totals: Totals): BreakdownView[] {
    const rows: BreakdownView[] = []
    let found = false

    for (const recipe of item.recipes) {
        if (!totals.rates.has(recipe)) {
            continue
        }
        for (const ing of recipe.ingredients) {
            const rate = totals.consumers.get(ing.item)!.get(recipe)!
            let buildingIcon: Icon | null = null
            let buildingCount: string | null = null
            const producers = totals.producers.get(ing.item)!
            if (producers.size === 1) {
                const producer = Array.from(producers.keys())[0]!
                const recipeRate = rate.div(producer.gives(ing.item))
                const building = spec.getBuilding(producer)
                buildingIcon = building === null ? null : building.icon
                buildingCount = spec.format.alignCount(spec.getCount(producer, recipeRate))
            }
            rows.push({
                key: `p${rows.length}`,
                recipe,
                item: ing.item,
                rate: spec.format.alignRate(rate),
                transport: breakdownTransportFor(ing.item, rate),
                buildingIcon,
                buildingCount,
                percent: null,
                divider: false,
            })
            found = true
        }
    }

    let singleRecipe: Recipe | null = null
    let amount: Rational | null = null
    let building: Building | null = null
    const producers = totals.producers.get(item)!
    if (producers.size === 1) {
        singleRecipe = Array.from(producers.keys())[0]!
        amount = singleRecipe.gives(item)
        building = spec.getBuilding(singleRecipe)
    }
    for (const [recipe, rate] of totals.consumers.get(item)!) {
        if (!recipe.isReal()) {
            continue
        }
        let buildingCount: string | null = null
        if (singleRecipe !== null) {
            const recipeRate = rate.div(amount!)
            buildingCount = spec.format.alignCount(spec.getCount(singleRecipe, recipeRate))
        }
        const percent = rate.div(totals.items.get(item)!).mul(hundred)
        rows.push({
            key: `c${rows.length}`,
            recipe,
            item,
            rate: spec.format.alignRate(rate),
            transport: breakdownTransportFor(item, rate),
            buildingIcon: building === null ? null : building.icon,
            buildingCount,
            percent: percent.less(one) ? "<1%" : percent.toDecimal(0) + "%",
            // Only the first consumer row is divided off, and only when the
            // top half of the breakdown produced rows above it.
            divider: found,
        })
        found = false
    }
    return rows
}

// Groups recipes that jointly produce the same items, so mutually dependent
// recipes end up in one tbody, then orders the groups by dependency.
function getDisplayGroups(totals: Totals): Array<{ items: Item[]; recipes: Recipe[] }> {
    const groups = topoSort(getRecipeGroups(new Set(totals.rates.keys())))
    const result: Array<{ items: Item[]; recipes: Recipe[] }> = []
    for (const group of groups) {
        const items = new Set<Item>()
        for (const recipe of group) {
            for (const ing of recipe.products) {
                if (totals.items.has(ing.item)) {
                    items.add(ing.item)
                }
            }
        }
        result.push({ items: [...items], recipes: [...group] })
    }
    return result
}

export function buildItemsTable(totals: Totals): ItemsTableView {
    const headers: ItemsHeader[] = [
        { text: "", colspan: 1, surplus: false },
        { text: "items/" + spec.format.rateName, colspan: 2, surplus: false },
        { text: "surplus/" + spec.format.rateName, colspan: 1, surplus: true },
        { text: "belts", colspan: 2, surplus: false },
        { text: "buildings", colspan: 2, surplus: false },
        { text: "overclock", colspan: 1, surplus: false },
        { text: "somersloop", colspan: 1, surplus: false },
        { text: "power", colspan: 1, surplus: false },
        // Pop-out links.
        { text: "", colspan: 1, surplus: false },
    ]
    let totalCols = 0
    for (const header of headers) {
        totalCols += header.colspan
    }

    let totalAveragePower = zero
    let totalPeakPower = zero
    const groups: ItemsRowView[][] = []

    for (const group of getDisplayGroups(totals)) {
        const rows: ItemsRowView[] = []
        // A group pairs its items against its recipes positionally; either list
        // can be the longer one, so the shorter side contributes nulls.
        const len = group.items.length === 0 ? 0 : Math.max(group.items.length, group.recipes.length)
        for (let i = 0; i < len; i++) {
            const item = group.items[i] ?? null
            const recipe = group.recipes[i] ?? null

            let building: Building | null = null
            let overclock = ""
            let sloop: SloopView | null = null
            let buildingCount = ""
            let power = ""
            if (recipe !== null) {
                building = spec.getBuilding(recipe)
                overclock = spec.getOverclock(recipe).mul(hundred).toString()
            }
            if (recipe !== null && building !== null) {
                const rate = totals.rates.get(recipe)!
                buildingCount = spec.format.alignCount(spec.getCount(recipe, rate))
                const usage = spec.getPowerUsage(recipe, rate)
                totalAveragePower = totalAveragePower.add(usage.average)
                totalPeakPower = totalPeakPower.add(usage.peak)
                power = spec.format.alignCount(usage.average) + " MW"
                if (building.maxSomersloop !== null) {
                    const count = spec.somersloop.get(recipe) ?? zero
                    sloop = {
                        count: `${count.toString()}/${building.maxSomersloop.toString()}`,
                        meterHeight:
                            one.sub(count.div(building.maxSomersloop)).mul(hundred).floor().toString() + "%",
                    }
                }
            }

            let itemRate = ""
            let surplusRate = ""
            let transport: TransportView | null = null
            let popoutHref = ""
            let breakdown: BreakdownView[] | null = null
            if (item !== null) {
                const total = totals.items.get(item)!
                const surplus = totals.surplus.get(item)
                itemRate = spec.format.alignRate(surplus === undefined ? total : total.sub(surplus))
                surplusRate = spec.format.alignRate(surplus ?? zero)
                transport = transportFor(item, total)
                popoutHref = "#" + formatSettings("totals", [[item, total]])
                breakdown = getBreakdown(item, totals)
            }

            rows.push({
                key: `${item === null ? "_" : item.key}|${recipe === null ? "_" : recipe.key}`,
                item,
                recipe,
                building,
                ignored: item !== null && spec.ignore.has(item),
                single: item !== null && recipe !== null && item.name === recipe.name,
                nobuilding: building === null,
                noitem: item === null,
                nosloop: building !== null && sloop === null,
                itemRate,
                surplusRate,
                transport,
                buildingCount,
                overclock,
                sloop,
                power,
                popoutHref,
                breakdown,
            })
        }
        groups.push(rows)
    }

    return {
        headers,
        totalCols,
        powerLabelColspan: totalCols - 3,
        nosurplus: totals.surplus.size === 0,
        groups,
        totalAveragePower: spec.format.alignCount(totalAveragePower) + " MW",
        totalPeakPower: spec.format.alignCount(totalPeakPower) + " MW",
    }
}
