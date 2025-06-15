#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;

// Move dist/public contents to public for production serving
const distPublicDir = path.join(rootDir, 'dist', 'public');
const publicDir = path.join(rootDir, 'public');

if (fs.existsSync(distPublicDir)) {
  // Remove existing public directory if it exists
  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }
  
  // Move dist/public to public
  fs.renameSync(distPublicDir, publicDir);
  console.log('✓ Moved build files to public directory for production serving');
} else {
  console.log('No dist/public directory found, skipping post-build step');
}