import { computed, ref, shallowRef } from "vue"
import { defineStore } from "pinia"

import {
    colorSchemes,
    DEFAULT_BELT,
    DEFAULT_COLOR_SCHEME,
    DEFAULT_COUNT_PRECISION,
    DEFAULT_FORMAT,
    DEFAULT_PIPE,
    DEFAULT_RATE,
    DEFAULT_RATE_PRECISION,
    longRateNames,
    setColorScheme,
    setTitle,
    spec,
} from "@/lib/legacy"
import type { Belt } from "@/lib/types"

// URL fragment codes for the value format, mirroring fragment.js, which writes
// displayFormat[0].
const VALUE_FORMATS = new Map([
    ["d", "decimal"],
    ["r", "rational"],
])

export interface RateOption {
    rateName: string
    longRateName: string
}

// The display settings from the Settings tab. Each setter writes through to the
// FactorySpecification singleton and then triggers the same re-render the d3
// handlers did, so the URL fragment (which reads spec, document.title and
// colorScheme) stays authoritative.
export const useSettingsStore = defineStore("settings", () => {
    const title = ref("")
    const displayRate = ref(DEFAULT_RATE)
    const ratePrecision = ref(DEFAULT_RATE_PRECISION)
    const countPrecision = ref(DEFAULT_COUNT_PRECISION)
    const valueFormat = ref(DEFAULT_FORMAT)
    const colorSchemeKey = ref(DEFAULT_COLOR_SCHEME)
    const beltKey = ref(DEFAULT_BELT)
    const pipeKey = ref(DEFAULT_PIPE)

    // Belt and pipe definitions come from the game data and never change after
    // it loads, so they are captured once in load().
    const belts = shallowRef<Belt[]>([])
    const pipes = shallowRef<Belt[]>([])

    // "second" / "minute" / "hour", for the build-target rate labels.
    const longRate = computed(() => longRateNames.get(displayRate.value) ?? "")

    const rateOptions: RateOption[] = Array.from(longRateNames, ([rateName, longRateName]) => ({
        rateName,
        longRateName,
    }))
    const colorSchemeOptions = colorSchemes.map((scheme) => ({ key: scheme.key, name: scheme.name }))

    // Applies the settings parsed out of the URL fragment. Must run before the
    // first solve: build targets parse their rates against the display rate,
    // and the solution is formatted with the precisions set here.
    function load(settings: Map<string, string>): void {
        const titleSetting = settings.has("title") ? decodeURIComponent(settings.get("title")!) : ""
        title.value = titleSetting
        setTitle(titleSetting)

        displayRate.value = settings.get("rate") ?? DEFAULT_RATE
        spec.format.setDisplayRate(displayRate.value)

        ratePrecision.value = settings.has("rp")
            ? Number(settings.get("rp"))
            : DEFAULT_RATE_PRECISION
        spec.format.ratePrecision = ratePrecision.value
        countPrecision.value = settings.has("cp")
            ? Number(settings.get("cp"))
            : DEFAULT_COUNT_PRECISION
        spec.format.countPrecision = countPrecision.value

        // Unknown codes fall back to the default rather than leaving the format
        // undefined, which used to throw while looking up the radio button.
        valueFormat.value = VALUE_FORMATS.get(settings.get("vf") ?? "") ?? DEFAULT_FORMAT
        spec.format.displayFormat = valueFormat.value

        colorSchemeKey.value = settings.get("c") ?? DEFAULT_COLOR_SCHEME
        setColorScheme(colorSchemeKey.value)

        belts.value = Array.from(spec.belts.values())
        pipes.value = Array.from(spec.pipes.values())
        // Unknown keys fall back to the default belt, which is otherwise left
        // undefined and crashes the first render that needs its icon.
        beltKey.value = spec.belts.has(settings.get("belt") ?? "")
            ? settings.get("belt")!
            : DEFAULT_BELT
        spec.belt = spec.belts.get(beltKey.value)!
        pipeKey.value = spec.pipes.has(settings.get("pipe") ?? "")
            ? settings.get("pipe")!
            : DEFAULT_PIPE
        spec.pipe = spec.pipes.get(pipeKey.value)!
    }

    function setTitleSetting(value: string): void {
        title.value = value
        setTitle(value)
        spec.setHash()
    }

    function setDisplayRate(rateName: string): void {
        displayRate.value = rateName
        spec.format.setDisplayRate(rateName)
        spec.display()
    }

    function setRatePrecision(value: number): void {
        ratePrecision.value = value
        spec.format.ratePrecision = value
        spec.display()
    }

    function setCountPrecision(value: number): void {
        countPrecision.value = value
        spec.format.countPrecision = value
        spec.display()
    }

    function setValueFormat(format: string): void {
        valueFormat.value = format
        spec.format.displayFormat = format
        spec.display()
    }

    function setColorSchemeKey(key: string): void {
        colorSchemeKey.value = key
        setColorScheme(key)
        spec.display()
    }

    function setBelt(key: string): void {
        beltKey.value = key
        spec.belt = spec.belts.get(key)!
        spec.display()
    }

    function setPipe(key: string): void {
        pipeKey.value = key
        spec.pipe = spec.pipes.get(key)!
        spec.display()
    }

    return {
        title,
        displayRate,
        ratePrecision,
        countPrecision,
        valueFormat,
        colorSchemeKey,
        beltKey,
        pipeKey,
        belts,
        pipes,
        longRate,
        rateOptions,
        colorSchemeOptions,
        load,
        setTitleSetting,
        setDisplayRate,
        setRatePrecision,
        setCountPrecision,
        setValueFormat,
        setColorSchemeKey,
        setBelt,
        setPipe,
    }
})
