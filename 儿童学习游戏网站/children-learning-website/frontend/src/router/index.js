import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import MathGame from '../views/Math.vue'
import EnglishGame from '../views/English.vue'
import ChineseLearning from '../views/Chinese.vue'
import Statistics from '../views/Statistics.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminMathSettings from '../views/admin/AdminMathSettings.vue'
import AdminEnglishWords from '../views/admin/AdminEnglishWords.vue'
import AdminChineseChars from '../views/admin/AdminChineseChars.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/math',
    name: 'MathGame',
    component: MathGame
  },
  {
    path: '/english',
    name: 'EnglishGame',
    component: EnglishGame
  },
  {
    path: '/chinese',
    name: 'ChineseLearning',
    component: ChineseLearning
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboard
      },
      {
        path: 'math',
        name: 'AdminMathSettings',
        component: AdminMathSettings
      },
      {
        path: 'english',
        name: 'AdminEnglishWords',
        component: AdminEnglishWords
      },
      {
        path: 'chinese',
        name: 'AdminChineseChars',
        component: AdminChineseChars
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

console.log('Registered Routes:', router.getRoutes());
router.beforeEach((to, from, next) => {
  console.log(`Navigating from ${from.fullPath} to ${to.fullPath}`);
  // ... (导航守卫逻辑)
  next();
});

export default router 