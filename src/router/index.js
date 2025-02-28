import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/tree',
    name: 'Tree',
    component: () => import('../views/Tree.vue')
  },
  {
    path: '/tree2',
    name: 'Tree2',
    component: () => import('../views/Tree2.vue')
  },
  {
    path: '/tree3',
    name: 'Tree3',
    component: () => import('../views/Tree3.vue')
  },
  {
    path: '/tree4',
    name: 'Tree4',
    component: () => import('../views/Tree4.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
