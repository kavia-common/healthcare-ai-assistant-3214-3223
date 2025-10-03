const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Development proxy configuration for Create React App.
 *
 * Purpose:
 * - Forward all requests starting with /api to the FastAPI backend.
 * - Fixes 404 errors seen when the frontend tries to call `/api/patients`
 *   but no proxy is configured (CRA dev server returns 404).
 *
 * Notes:
 * - If REACT_APP_BACKEND_URL is set, the frontend API client will call that URL directly
 *   and this proxy will be bypassed. This proxy is specifically for local dev using the default `/api` base path.
 * - Adjust target BASE_BACKEND if your backend runs on a different host/port.
 * - Production/preview builds DO NOT use this proxy; ensure REACT_APP_BACKEND_URL points to the backend root.
 */
module.exports = function (app) {
  const BASE_BACKEND =
    process.env.REACT_APP_BACKEND_PROXY_TARGET || 'http://localhost:8000';

  app.use(
    '/api',
    createProxyMiddleware({
      target: BASE_BACKEND,
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // strip /api so /api/patients => http://localhost:8000/patients
      },
      // Optional: add logging for debugging proxy issues
      logLevel: 'warn',
    })
  );
};
