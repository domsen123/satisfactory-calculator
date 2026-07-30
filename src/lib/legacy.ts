// Typed facade over the untyped legacy modules. Every cast from JS into the
// interfaces in types.ts lives here, so the rest of the ported code is free of
// `any` and there is one place to audit when a legacy module is itself ported.

import { spec as rawSpec } from "@/legacy/factory.js"
import { Rational as RawRational, zero as rawZero, one as rawOne } from "@/legacy/rational.js"
import { formatSettings as rawFormatSettings } from "@/legacy/fragment.js"
import { getRecipeGroups as rawGetRecipeGroups, topoSort as rawTopoSort } from "@/legacy/groups.js"
import { Tooltip as RawTooltip, unregisterTooltip as rawUnregisterTooltip } from "@/legacy/tooltip.js"

import type { FactorySpec, Item, Rational as RationalValue, Recipe } from "./types"

// Re-exported so callers can use `Rational` as both the factory and the type,
// the way the legacy code reads.
export type Rational = RationalValue

export const spec = rawSpec as FactorySpec

export const zero = rawZero as RationalValue
export const one = rawOne as RationalValue

export const Rational = RawRational as {
    from_float(x: number): RationalValue
    from_string(s: string): RationalValue
}

export const formatSettings = rawFormatSettings as (
    overrideTab?: string,
    targets?: Iterable<[Item, RationalValue]>,
) => string

export const getRecipeGroups = rawGetRecipeGroups as (recipes: Set<Recipe>) => Set<Set<Recipe>>
// topoSort reassigns its Set accumulator to an Array before returning, which
// JS inference cannot follow.
export const topoSort = rawTopoSort as unknown as (groups: Set<Set<Recipe>>) => Array<Set<Recipe>>

export const Tooltip = RawTooltip as new (
    reference: Element,
    content: Node,
    target?: Element,
) => { remove(): void }

export type TooltipInstance = InstanceType<typeof Tooltip>

export const unregisterTooltip = rawUnregisterTooltip as (tooltip: TooltipInstance) => void
