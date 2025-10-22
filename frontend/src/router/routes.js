import { requireAuth } from './guards';

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/InitialScreen.vue') },
      { path: 'cardapio', component: () => import('src/pages/customer/PublicMenu.vue') },
      { path: 'admin/login', component: () => import('src/pages/admin/AdminLogin.vue') }
    ]
  },
  {
    path: '/admin',
    component: () => import('layouts/AdminLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      { path: 'dashboard', component: () => import('pages/admin/AdminDashboard.vue') },
       { path: 'pedidos', component: () => import('pages/admin/AdminOrders.vue') },
       { path: 'produtos', component: () => import('pages/admin/AdminProducts.vue') },
       { path: 'configuracoes', component: () => import('pages/admin/AdminSettings.vue') },
    ]
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes