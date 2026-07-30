import { createApp } from "vue"
import { createPinia } from "pinia"

import "@/assets/calc.css"
import "@/assets/dropdown.css"

import App from "@/App.vue"

createApp(App).use(createPinia()).mount("#app")
