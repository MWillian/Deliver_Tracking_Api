const api = axios.create({
  baseURL: '/api',
});
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  resposta => resposta,
  erro => {
    if (erro.response?.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/registrar') {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(erro);
  }
);

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        if (token) {
            logoutBtn.style.display = 'inline-block';
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
                window.location.href = '/login';
            });
        }
    }
    
    if (window.location.pathname.startsWith('/painel') && !token) {
        window.location.href = '/login';
    }
});