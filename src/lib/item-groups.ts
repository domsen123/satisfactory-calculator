// Category layout for the item picker. The game data only carries a tech tier
// per item, which groups unrelated things together, so the picker's groups are
// spelled out here instead. Keys that the loaded data does not contain are
// skipped, and anything the data has that is not listed lands in a trailing
// "Other" group rather than disappearing from the picker.

import type { Item } from "./types"

export interface ItemGroup {
    name: string
    items: Item[]
}

const GROUP_KEYS: Array<{ name: string; keys: string[] }> = [
    {
        name: "Ores",
        keys: [
            "limestone",
            "iron-ore",
            "copper-ore",
            "caterium-ore",
            "coal",
            "raw-quartz",
            "sulfur",
            "bauxite",
            "sam",
            "uranium",
        ],
    },
    {
        name: "Ingots",
        keys: [
            "iron-ingot",
            "copper-ingot",
            "caterium-ingot",
            "steel-ingot",
            "aluminum-ingot",
            "ficsite-ingot",
        ],
    },
    {
        name: "Minerals",
        keys: [
            "concrete",
            "quartz-crystal",
            "silica",
            "copper-powder",
            "polymer-resin",
            "petroleum-coke",
            "aluminum-scrap",
        ],
    },
    {
        name: "Aliens",
        keys: [
            "hog-remains",
            "spitter-remains",
            "stinger-remains",
            "hatcher-remains",
            "alien-protein",
            "alien-dna-capsule",
        ],
    },
    {
        name: "Liquids",
        keys: [
            "water",
            "crude-oil",
            "heavy-oil-residue",
            "fuel",
            "liquid-biofuel",
            "turbofuel",
            "alumina-solution",
            "sulfuric-acid",
            "nitric-acid",
            "dissolved-silica",
        ],
    },
    {
        name: "Gas",
        keys: [
            "nitrogen-gas",
            "rocket-fuel",
            "ionized-fuel",
            "dark-matter-residue",
            "excited-photonic-matter",
        ],
    },
    {
        name: "Standard Parts",
        keys: [
            "iron-rod",
            "screw",
            "iron-plate",
            "reinforced-iron-plate",
            "copper-sheet",
            "alclad-aluminum-sheet",
            "aluminum-casing",
            "steel-pipe",
            "steel-beam",
            "encased-industrial-beam",
            "modular-frame",
            "heavy-modular-frame",
            "fused-modular-frame",
            "ficsite-trigon",
            "fabric",
            "plastic",
            "rubber",
        ],
    },
    {
        name: "Industrial Parts",
        keys: ["rotor", "stator", "battery", "motor", "heat-sink", "cooling-system", "turbo-motor"],
    },
    {
        name: "Electronics",
        keys: [
            "wire",
            "cable",
            "quickwire",
            "circuit-board",
            "ai-limiter",
            "high-speed-connector",
            "reanimated-sam",
            "sam-fluctuator",
        ],
    },
    {
        name: "Communications",
        keys: [
            "computer",
            "supercomputer",
            "radio-control-unit",
            "crystal-oscillator",
            "superposition-oscillator",
        ],
    },
    {
        name: "Quantum Technology",
        keys: [
            "diamonds",
            "time-crystal",
            "dark-matter-crystal",
            "singularity-cell",
            "neural-quantum-processor",
            "alien-power-matrix",
        ],
    },
    {
        name: "Containers",
        keys: [
            "empty-canister",
            "empty-fluid-tank",
            "pressure-conversion-cube",
            "packaged-water",
            "packaged-alumina-solution",
            "packaged-sulfuric-acid",
            "packaged-nitric-acid",
            "packaged-nitrogen-gas",
        ],
    },
    {
        name: "Fuels",
        keys: [
            "leaves",
            "mycelia",
            "flower-petals",
            "wood",
            "biomass",
            "compacted-coal",
            "packaged-oil",
            "packaged-heavy-oil-residue",
            "solid-biofuel",
            "packaged-fuel",
            "packaged-liquid-biofuel",
            "packaged-turbofuel",
            "packaged-rocket-fuel",
            "packaged-ionized-fuel",
            "uranium-fuel-rod",
            "plutonium-fuel-rod",
        ],
    },
    {
        name: "Consumed",
        keys: [
            "black-powder",
            "smokeless-powder",
            "filter",
            "color-cartridge",
            "beacon",
            "iodine-infused-filter",
        ],
    },
    {
        name: "Ammos",
        keys: [
            "iron-rebar",
            "stun-rebar",
            "shatter-rebar",
            "explosive-rebar",
            "rifle-ammo",
            "homing-rifle-ammo",
            "turbo-rifle-ammo",
            "nobelisk",
            "gas-nobelisk",
            "pulse-nobelisk",
            "cluster-nobelisk",
            "nuke-nobelisk",
        ],
    },
    {
        name: "Nuclear",
        keys: [
            "em-control-rod",
            "uranium-cell",
            "non-fissile-uranium",
            "plutonium-pellet",
            "encased-plutonium-cell",
            "ficsonium",
            "ficsonium-fuel-rod",
        ],
    },
    {
        name: "Waste",
        keys: ["uranium-waste", "plutonium-waste"],
    },
    {
        name: "Special",
        keys: [
            "blue-power-slug",
            "yellow-power-slug",
            "purple-power-slug",
            "power-shard",
            "ficsit-coupon",
            "smart-plating",
            "versatile-framework",
            "automated-wiring",
            "modular-engine",
            "adaptive-control-unit",
            "assembly-director-system",
            "magnetic-field-generator",
            "thermal-propulsion-rocket",
            "nuclear-pasta",
            "biochemical-sculptor",
            "ballistic-warp-drive",
            "ai-expansion-server",
        ],
    },
    {
        name: "Tools",
        keys: [
            "portable-miner",
            "zipline",
            "chainsaw",
            "object-scanner",
            "medicinal-inhaler",
            "blade-runners",
            "parachute",
            "jetpack",
            "hoverpack",
            "gas-mask",
            "hazmat-suit",
            "xeno-zapper",
            "rebar-gun",
            "rifle",
            "xeno-basher",
            "nobelisk-detonator",
            "factory-cart",
            "golden-factory-cart",
            "candy-cane-basher",
        ],
    },
]

export function buildItemGroups(items: Map<string, Item>): ItemGroup[] {
    const grouped = new Set<string>()
    const groups: ItemGroup[] = []
    for (const { name, keys } of GROUP_KEYS) {
        const groupItems: Item[] = []
        for (const key of keys) {
            const item = items.get(key)
            if (item !== undefined) {
                groupItems.push(item)
                grouped.add(key)
            }
        }
        if (groupItems.length > 0) {
            groups.push({ name, items: groupItems })
        }
    }
    const rest = Array.from(items.values()).filter((item) => !grouped.has(item.key))
    if (rest.length > 0) {
        groups.push({ name: "Other", items: rest })
    }
    return groups
}
