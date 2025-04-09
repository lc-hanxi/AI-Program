import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/global.css'; // 假设有全局样式

const app = createApp(App)

console.log('Using router instance (main.js):', router);
app.use(router)
app.mount('#app') 