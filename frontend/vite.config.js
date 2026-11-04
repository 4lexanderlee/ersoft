import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Development/preview only. Production must provide this same-origin endpoint
// through its trusted API; never trust an arbitrary X-Forwarded-For header.
const deviceInfo = () => {
  const install = server => { server.middlewares.use('/api/session/device', (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify({ ip: request.socket.remoteAddress || null }));
  }); };
  return { name: 'device-info', configureServer: install, configurePreviewServer: install };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), deviceInfo()],
});
