import { createApp } from "vue"

import "./styles/style.css"
import App from "./App.vue"
import router from "./router/index.ts"


createApp(App).use(router).mount("#app")