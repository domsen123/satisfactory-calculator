<script setup lang="ts">
import IconImg from "@/components/IconImg.vue"
import { DEFAULT_TITLE } from "@/lib/legacy"
import { useSettingsStore } from "@/stores/settings"

const store = useSettingsStore()

function onTitleInput(event: Event): void {
    store.setTitleSetting((event.target as HTMLInputElement).value)
}

function onRatePrecision(event: Event): void {
    store.setRatePrecision(Number((event.target as HTMLInputElement).value))
}

function onCountPrecision(event: Event): void {
    store.setCountPrecision(Number((event.target as HTMLInputElement).value))
}
</script>

<template>
    <table id="settings">
        <tbody>
            <tr class="setting-section">
                <td colspan="2"><span>Display</span><hr></td>
            </tr>

            <tr class="setting-row">
                <td class="setting-label">Title:</td>
                <td>
                    <input
                        id="title_setting"
                        type="text"
                        size="30"
                        :placeholder="DEFAULT_TITLE"
                        :value="store.title"
                        @input="onTitleInput"
                    >
                </td>
            </tr>

            <tr class="setting-row">
                <td class="setting-label top">Display rates as:</td>
                <td>
                    <form id="display_rate">
                        <span v-for="rate in store.rateOptions" :key="rate.rateName">
                            <input
                                :id="`${rate.rateName}_rate`"
                                type="radio"
                                name="rate"
                                :value="rate.rateName"
                                :checked="rate.rateName === store.displayRate"
                                @change="store.setDisplayRate(rate.rateName)"
                            ><label :for="`${rate.rateName}_rate`">items/{{ rate.longRateName }}</label><br>
                        </span>
                    </form>
                </td>
            </tr>

            <tr class="setting-row">
                <td class="setting-label">Rate precision:</td>
                <td>
                    <input
                        id="rprec"
                        class="prec"
                        type="number"
                        min="0"
                        :value="store.ratePrecision"
                        @change="onRatePrecision"
                    >
                </td>
            </tr>

            <tr class="setting-row">
                <td class="setting-label">Count precision:</td>
                <td>
                    <input
                        id="cprec"
                        class="prec"
                        type="number"
                        min="0"
                        :value="store.countPrecision"
                        @change="onCountPrecision"
                    >
                </td>
            </tr>

            <tr class="setting-row">
                <td class="setting-label top">Format values as:</td>
                <td>
                    <form id="value_format">
                        <input
                            id="decimal_format"
                            type="radio"
                            name="format"
                            value="decimal"
                            :checked="store.valueFormat === 'decimal'"
                            @change="store.setValueFormat('decimal')"
                        ><label for="decimal_format">Decimals</label><br />
                        <input
                            id="rational_format"
                            type="radio"
                            name="format"
                            value="rational"
                            :checked="store.valueFormat === 'rational'"
                            @change="store.setValueFormat('rational')"
                        ><label for="rational_format">Rationals</label><br />
                    </form>
                </td>
            </tr>

            <tr class="setting-row">
                <td class="setting-label">Color scheme:</td>
                <td>
                    <select
                        id="color_scheme"
                        :value="store.colorSchemeKey"
                        @change="store.setColorSchemeKey(($event.target as HTMLSelectElement).value)"
                    >
                        <option v-for="scheme in store.colorSchemeOptions" :key="scheme.key" :value="scheme.key">
                            {{ scheme.name }}
                        </option>
                    </select>
                </td>
            </tr>

            <tr class="setting-section">
                <td colspan="2"><span>Factory</span><hr></td>
            </tr>

            <tr class="setting-row">
                <td class="setting-label">Belt:</td>
                <td>
                    <span id="belt_selector" class="belt-setting">
                        <span v-for="belt in store.belts" :key="belt.key">
                            <input
                                :id="`belt.${belt.key}`"
                                type="radio"
                                name="belt"
                                :value="belt.key"
                                :checked="belt.key === store.beltKey"
                                @change="store.setBelt(belt.key)"
                            ><label :for="`belt.${belt.key}`"><IconImg :icon="belt.icon" :size="32" /></label>
                        </span>
                    </span>
                </td>
            </tr>

            <tr class="setting-row">
                <td class="setting-label">Pipe:</td>
                <td>
                    <span id="pipe_selector" class="belt-setting">
                        <span v-for="pipe in store.pipes" :key="pipe.key">
                            <input
                                :id="`pipe.${pipe.key}`"
                                type="radio"
                                name="pipe"
                                :value="pipe.key"
                                :checked="pipe.key === store.pipeKey"
                                @change="store.setPipe(pipe.key)"
                            ><label :for="`pipe.${pipe.key}`"><IconImg :icon="pipe.icon" :size="32" /></label>
                        </span>
                    </span>
                </td>
            </tr>
        </tbody>
    </table>
</template>
