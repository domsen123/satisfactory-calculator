/*Copyright 2019-2021 Kirk McDonald

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
import { colorSchemes } from "./color.js"
import { DEFAULT_TAB, clickTab, DEFAULT_VISUALIZER, visualizerType, setVisualizerType, DEFAULT_RENDER, visualizerRender, setVisualizerRender } from "./events.js"
import { spec, resourcePurities } from "./factory.js"
import { Rational } from "./rational.js"

// There are several things going on with this control flow. Settings should
// work like this:
// 1) Settings are parsed from the URL fragment into the settings Map.
// 2) Each setting's `render` function is called.
// 3) If the setting is not present in the map, a default value is used.
// 4) The setting is applied.
// 5) The setting's GUI is placed into a consistent state.
// Remember to add the setting to fragment.js, too!
//
// The Settings, Items, Alt-Recipes and Miners tabs and the build-target list are
// Vue components now, so the renderers below only load state; the components
// derive what they show from the spec singleton. The Settings tab's own settings
// are loaded by stores/settings.ts, which init.js calls before renderSettings so
// that the display rate is in place when build targets parse their rates.

// tab

function renderTab(settings) {
    let tabName = DEFAULT_TAB
    if (settings.has("tab")) {
        tabName = settings.get("tab")
    }
    clickTab(tabName)
}

// build targets

function renderTargets(settings) {
    // The list itself is Vue-rendered from spec.buildTargets, so resetting the
    // model is enough; removing the <li>s here would corrupt Vue's vdom.
    spec.buildTargets = []

    let targetSetting = settings.get("items")
    if (targetSetting !== undefined && targetSetting !== "") {
        let targets = targetSetting.split(",")
        for (let targetString of targets) {
            let parts = targetString.split(":")
            let itemKey = parts[0]
            let target = spec.addTarget(itemKey)
            let type = parts[1]
            if (type === "f") {
                let recipe = null
                if (parts.length > 3) {
                    let recipeKey = parts[3]
                    recipe = spec.recipes.get(recipeKey)
                }
                target.setBuildings(parts[2], recipe)
                target.updateRecipes()
            } else if (type === "r") {
                target.setRate(parts[2])
            } else {
                throw new Error("unknown target type")
            }
        }
    } else {
        spec.addTarget()
    }
}

// ignore

function renderIgnore(settings) {
    spec.ignore.clear()
    // UI will be rendered later, as part of the solution.
    let ignoreSetting = settings.get("ignore")
    if (ignoreSetting !== undefined && ignoreSetting !== "") {
        let ignore = ignoreSetting.split(",")
        for (let itemKey of ignore) {
            let item = spec.items.get(itemKey)
            spec.ignore.add(item)
        }
    }
}

// overclock

function renderOverclock(settings) {
    spec.overclock.clear()
    // UI will be rendered later, as part of the solution.
    let overclockSetting = settings.get("overclock")
    if (overclockSetting !== undefined && overclockSetting !== "") {
        let overclock = overclockSetting.split(",")
        for (let pair of overclock) {
            let [recipeKey, percentString] = pair.split(":")
            let recipe = spec.recipes.get(recipeKey)
            let percent = Rational.from_string(percentString).div(Rational.from_float(100))
            spec.setOverclock(recipe, percent)
        }
    }
}

// somersloop

function renderSomersloop(settings) {
    spec.somersloop.clear()
    let sloopSetting = settings.get("sloop")
    if (sloopSetting !== undefined && sloopSetting !== "") {
        let sloop = sloopSetting.split(",")
        for (let pair of sloop) {
            let [recipeKey, countString] = pair.split(":")
            let recipe = spec.recipes.get(recipeKey)
            let count = Rational.from_string(countString)
            spec.setSomersloop(recipe, count)
        }
    }
}

// title

export const DEFAULT_TITLE = "Satisfactory Calculator"

export function setTitle(s) {
    if (s === "") {
        document.title = DEFAULT_TITLE
    } else {
        document.title = s
    }
}

// color scheme
export const DEFAULT_COLOR_SCHEME = "default"

export let colorScheme

export function setColorScheme(schemeKey) {
    for (let scheme of colorSchemes) {
        if (scheme.key === schemeKey) {
            colorScheme = scheme
            colorScheme.apply()
            return
        }
    }
}

// visualizer

function renderVisualizer(settings) {
    if (settings.has("vt")) {
        setVisualizerType(settings.get("vt"))
    } else {
        setVisualizerType(DEFAULT_VISUALIZER)
    }
    // See renderPrecisions: these radios are Vue-rendered, so set the property.
    d3.select(`#${visualizerType}_type`).property("checked", true)
    if (settings.has("vr")) {
        setVisualizerRender(settings.get("vr"))
    } else {
        setVisualizerRender(DEFAULT_RENDER)
    }
    d3.select(`#${visualizerRender}_render`).property("checked", true)
}

// recipe disabling

function renderRecipes(settings) {
    if (settings.has("disable")) {
        let keys = settings.get("disable").split(",")
        for (let k of keys) {
            let recipe = spec.recipes.get(k)
            if (recipe) {
                spec.setDisable(recipe)
            }
        }
    } else {
        spec.setDefaultDisable()
    }
}

// miners

function renderResources(settings) {
    spec.initMinerSettings()
    if (settings.has("miners")) {
        let miners = settings.get("miners").split(",")
        for (let minerString of miners) {
            let [recipeKey, minerKey, purityKey] = minerString.split(":")
            let recipe = spec.recipes.get(recipeKey)
            let miner = spec.miners.get(minerKey)
            let purity = resourcePurities[Number(purityKey)]
            spec.setMiner(recipe, miner, purity)
        }
    }
}

// resource priority

function renderResourcePriorities(settings) {
    spec.setDefaultPriority()
    if (settings.has("priority")) {
        let tiers = []
        let keys = settings.get("priority").split(";")
        outer: for (let tierStr of keys) {
            let tier = []
            for (let pair of tierStr.split(",")) {
                // Backward compatibility: If this is using the old format,
                // ignore the whole thing and bail.
                if (pair.indexOf("=") === -1) {
                    console.log("bailing:", pair)
                    tiers = null
                    break outer
                }
                let [key, weightStr] = pair.split("=")
                tier.push([key, Rational.from_string(weightStr)])
            }
            tiers.push(tier)
        }
        if (tiers !== null) {
            spec.setPriorities(tiers)
        }
    }
}

// debug

function renderDebugCheckbox(settings) {
    spec.debug = settings.has("debug")
    d3.select("#render_debug").property("checked", spec.debug)
}

export function renderSettings(settings) {
    renderIgnore(settings)
    renderOverclock(settings)
    renderSomersloop(settings)
    renderVisualizer(settings)
    renderResources(settings)
    renderResourcePriorities(settings)
    renderRecipes(settings)
    renderTargets(settings)
    renderDebugCheckbox(settings)
    renderTab(settings)
}
