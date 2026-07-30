<!--Copyright 2019-2021 Kirk McDonald

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.-->
<script setup lang="ts">
import { onMounted } from "vue"

import AltRecipesTab from "@/components/AltRecipesTab.vue"
import ItemsTab from "@/components/ItemsTab.vue"
import MinersTab from "@/components/MinersTab.vue"
import ResourcesTab from "@/components/ResourcesTab.vue"
import SettingsTab from "@/components/SettingsTab.vue"
import TargetList from "@/components/TargetList.vue"
import { clickTab, changeVisType, changeVisRender, toggleDebug } from "@/legacy/events.js"
import { init } from "@/legacy/init.js"

// Shell stage of the Vue migration: this component owns the static skeleton
// that the legacy d3-selection modules still render into, so every container
// below must keep its id and stay free of reactive bindings until its tab is
// ported. Tabs are ported one at a time; see the tab components under
// src/components as they land.
onMounted(init)

const TABS: Array<{ id: string; label: string }> = [
    { id: "graph", label: "Visualize" },
    { id: "totals", label: "Items" },
    { id: "recipes", label: "Alt-Recipes" },
    { id: "miners", label: "Miners" },
    { id: "resources", label: "Resources" },
    { id: "settings", label: "Settings" },
    { id: "about", label: "About" },
    { id: "debug", label: "Debug" },
]
</script>

<template>
    <TargetList />

    <div class="tabs">
        <button
            v-for="tab in TABS"
            :key="tab.id"
            :id="`${tab.id}_button`"
            class="tab_button"
            @click="clickTab(tab.id)"
        >{{ tab.label }}</button>
    </div>

    <div id="graph_tab" class="tab graph">
        <div class="graph_setting">
            <form id="graph_type">
                <input id="sankey_type" type="radio" name="type" value="sankey" checked autocomplete="off" @change="changeVisType($event)">
                <label for="sankey_type">
                    <svg viewBox="0 0 64 64" width="64" height="64">
                        <use href="images/icons.svg#sankey"></use>
                    </svg>
                </label>

                <input id="boxline_type" type="radio" name="type" value="boxline" autocomplete="off" @change="changeVisType($event)">
                <label for="boxline_type">
                    <svg viewBox="0 0 64 64" width="64" height="64">
                        <use href="images/icons.svg#boxline"></use>
                    </svg>
                </label>
            </form>
        </div>
        <div class="graph_setting">
            Render mode:<br>
            <form id="graph_render">
                <input id="zoom_render" type="radio" name="render" value="zoom" checked autocomplete="off" @change="changeVisRender($event)">
                <label for="zoom_render">Zoom &amp; pan</label>

                <input id="fix_render" type="radio" name="render" value="fix" autocomplete="off" @change="changeVisRender($event)">
                <label for="fix_render">Fixed</label>
            </form>
        </div>
        <div id="graph_container">
        <svg id="graph"><g /></svg>
        </div>
    </div>

    <div id="totals_tab" class="tab">
        <ItemsTab />
    </div>

    <div id="settings_tab" class="tab">
        <SettingsTab />
    </div>

    <div id="recipes_tab" class="tab">
        <p>Click to toggle recipe.</p>
        <AltRecipesTab />
    </div>

    <div id="resources_tab" class="tab">
        <p>Click and drag items to configure resource priority.<br />
        Higher numbers = more common</p>
        <ResourcesTab />
    </div>

    <div id="miners_tab" class="tab">
        <MinersTab />
    </div>

    <div id="about_tab" class="tab">
    <div class="about-content">
        This calculator is copyright 2019 Kirk McDonald. It is licensed under the Apache License 2.0, and its source may be <a href="https://github.com/KirkMcDonald/satisfactory-calculator">found on github, here</a>.
        <p>
        This calculator is based on my <a href="https://kirkmcdonald.github.io/calc.html">Factorio calculator</a>, and was created primarily to see what the project would look like if rewritten from scratch, applying lessons learned over the years spent developing the original.
        </p>
        <p>
        Satisfactory is a simpler game for which to calculate ratios than Factorio. This simplicity means that it is easier for this calculator to support certain features that would be very difficult to add to the Factorio calculator, but which I have wanted to implement for a long time. This can be seen in the use of a <a href="https://en.wikipedia.org/wiki/Sankey_diagram">Sankey diagram</a> in the visualizer, among other things.
        </p>
        <p>
        If you wish to support the calculator, please consider donating to <a href="https://www.patreon.com/kirkmcdonald">my Patreon campaign</a>. Any amount helps. And thank you!
        </p>
    </div>
    </div>

    <div id="debug_tab" class="tab">
        <div id="debug_message"></div>

        <label for="render_debug">Render debug tab:</label>
        <input type="checkbox" id="render_debug" @change="toggleDebug($event)"><br>
        Last tableau:
        <div id="debug_tableau"></div>
        Last solution:
        <div id="debug_solution"></div>
    </div>

    <div id="footer"><a href="https://github.com/KirkMcDonald/satisfactory-calculator">GitHub</a> | <a href="https://discord.gg/yxrBKCP">Discord</a> | <a href="https://www.patreon.com/kirkmcdonald">Patreon</a></div>

    <div id="tooltip_container"></div>
</template>
