import app from './app.js';
import { ENV } from './config/env.js';

const PORT = parseInt(ENV.PORT, 10) || 5000;

const server = app.listen(PORT, () => {
  console.log(`[ENTERPRISE SERVER] Vendor Evaluation & Contract System running on port ${PORT}`);
  console.log(`[ENTERPRISE SERVER] Environment: ${ENV.NODE_ENV}`);
  console.log(`[ENTERPRISE SERVER] API Endpoint: http://localhost:${PORT}/api`);
});

// Process signal handling
process.on('SIGTERM', () => {
  console.log('[ENTERPRISE SERVER] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[ENTERPRISE SERVER] HTTP server closed');
  });
});
