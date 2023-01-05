import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Storage from '../views/Storage.vue';
import NewSecret from '../views/NewSecret.vue';
// import DeleteSecret from '../views/_DeleteSecret.vue';
import ViewSecret from '../views/ViewSecret.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/new',
    name: 'new',
    component: NewSecret,
  },
  // {
  //   path: '/delete',
  //   name: 'delete',
  //   component: DeleteSecret,
  // },
  {
    path: '/storage',
    name: 'storage',
    component: Storage,
  },
  {
    path: '/view',
    name: 'view',
    component: ViewSecret,
  },
  // {
  //   path: '/about',
  //   name: 'about',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue'),
  // },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
