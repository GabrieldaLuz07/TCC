export const requireAuth = (to, from, next) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    next();
  } else {
    next('/admin/login');
  }
};