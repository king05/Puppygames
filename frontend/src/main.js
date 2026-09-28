import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import BeamerView from './components/BeamerView.vue';
import HelperView from './components/HelperView.vue';
import AdminView from './components/AdminView.vue';
import LoginView from './components/LoginView.vue';
import './style.css';

const routes = [
  { path: '/', component: BeamerView },
  { path: '/beamer', component: BeamerView },
  { path: '/login', component: LoginView },
  { path: '/helper', component: HelperView },
  { path: '/admin', component: AdminView }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guard für Auth
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if ((to.path === '/helper' || to.path === '/admin') && !token) {
    next('/login');
  } else {
    next();
  }
});

const app = createApp(App);
app.use(router);
app.mount('#app');