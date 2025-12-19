import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import ManageSecret from '../views/ManageSecret.vue';
import Storage from '../views/Storage.vue';
import ViewSecret from '../views/ViewSecret.vue';

const routes = [
	{
		path: '/',
		name: 'home',
		component: Home,
	},
	{
		path: '/new',
		redirect: (to) => {
			return { path: '/manage', hash: to.hash };
		},
	},
	{
		path: '/manage',
		name: 'manage',
		component: ManageSecret,
	},
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
];

const router = createRouter({
	history: createWebHistory(), // import.meta.env.BASE_URL
	routes,
});

export default router;
