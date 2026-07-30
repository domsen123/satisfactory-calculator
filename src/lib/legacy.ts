// Typed facade over the untyped legacy modules. Every cast from JS into the
// interfaces in types.ts lives here, so the rest of the ported code is free of
// `any` and there is one place to audit when a legacy module is itself ported.

import {
    DEFAULT_RATE as rawDefaultRate,
    DEFAULT_RATE_PRECISION as rawDefaultRatePrecision,
    DEFAULT_COUNT_PRECISION as rawDefaultCountPrecision,
    DEFAULT_FORMAT as rawDefaultFormat,
    longRateNames as rawLongRateNames,
} from "@/legacy/align.js"
import { colorSchemes as rawColorSchemes } from "@/legacy/color.js"
import {
    spec as rawSpec,
    DEFAULT_BELT as rawDefaultBelt,
    DEFAULT_PIPE as rawDefaultPipe,
    resourcePurities as rawResourcePurities,
} from "@/legacy/factory.js"
import { Rational as RawRational, zero as rawZero, one as rawOne } from "@/legacy/rational.js"
import { formatSettings as rawFormatSettings } from "@/legacy/fragment.js"
import { getRecipeGroups as rawGetRecipeGroups, topoSort as rawTopoSort } from "@/legacy/groups.js"
import {
    DEFAULT_TITLE as rawDefaultTitle,
    DEFAULT_COLOR_SCHEME as rawDefaultColorScheme,
    setColorScheme as rawSetColorScheme,
    setTitle as rawSetTitle,
} from "@/legacy/settings.js"
import { Tooltip as RawTooltip, unregisterTooltip as rawUnregisterTooltip } from "@/legacy/tooltip.js"

import type {
    ColorScheme,
    FactorySpec,
    Item,
    Rational as RationalValue,
    Recipe,
    ResourcePurity,
} from "./types"

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

// Display-setting defaults and option lists. The defaults must stay in sync
// with fragment.js, which omits a setting from the URL when it matches.
export const DEFAULT_RATE = rawDefaultRate as string
export const DEFAULT_RATE_PRECISION = rawDefaultRatePrecision as number
export const DEFAULT_COUNT_PRECISION = rawDefaultCountPrecision as number
export const DEFAULT_FORMAT = rawDefaultFormat as string
export const DEFAULT_TITLE = rawDefaultTitle as string
export const DEFAULT_COLOR_SCHEME = rawDefaultColorScheme as string
export const DEFAULT_BELT = rawDefaultBelt as string
export const DEFAULT_PIPE = rawDefaultPipe as string

export const longRateNames = rawLongRateNames as Map<string, string>
export const colorSchemes = rawColorSchemes as ColorScheme[]
// Impure / Normal / Pure, in the order the miner tables list them.
export const resourcePurities = rawResourcePurities as ResourcePurity[]

export const setColorScheme = rawSetColorScheme as (schemeKey: string) => void
export const setTitle = rawSetTitle as (title: string) => void
