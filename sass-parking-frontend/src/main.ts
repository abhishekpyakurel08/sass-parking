import { createApp } from "vue"
import { createPinia } from "pinia"
import Vue3Toastify, { type ToastContainerOptions } from "vue3-toastify"
import "vue3-toastify/dist/index.css"

import "./styles/style.css"
import App from "./App.vue"
import router from "./router/index.ts"

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(Vue3Toastify, {
  autoClose: 3500,
  position: "top-right",
  theme: "light",
  clearOnUrlChange: false,
} as ToastContainerOptions)

app.mount("#app")