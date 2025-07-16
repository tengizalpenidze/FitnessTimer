#!/usr/bin/env node

// Static build script for frontend-only HIIT timer app
import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🏗️  Building static frontend-only HIIT timer app...');

try {
  // Create dist directory
  const distDir = join(__dirname, 'dist');
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  // Build the client with Vite
  console.log('📦 Building client with Vite...');
  execSync('cd client && npm run build', { stdio: 'inherit' });

  // Copy service worker to the build directory
  const swSource = join(__dirname, 'client/public/sw.js');
  const swDest = join(distDir, 'sw.js');
  if (existsSync(swSource)) {
    copyFileSync(swSource, swDest);
    console.log('📄 Copied service worker');
  }

  // Create a simple server.js for static hosting
  const serverContent = `
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Serve static files
app.use(express.static(__dirname));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`✅ HIIT Timer app running on port \${PORT}\`);
});
`;

  writeFileSync(join(distDir, 'server.js'), serverContent.trim());
  console.log('🚀 Created static server');

  console.log('✅ Static build completed successfully!');
  console.log('📁 Build output in ./dist/');
  console.log('🌐 Ready for static hosting');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}