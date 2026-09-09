const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const standaloneNm = path.join(standaloneDir, 'node_modules');
const pnpmStore = path.join(rootDir, 'node_modules', '.pnpm');

console.log('🚀 Preparing standalone output for Docker...');

if (!fs.existsSync(standaloneDir)) {
  console.error('❌ .next/standalone does not exist. Run pnpm build first.');
  process.exit(1);
}

if (!fs.existsSync(standaloneNm)) {
  fs.mkdirSync(standaloneNm, { recursive: true });
}

// 1. Find next's internal dependencies inside pnpm virtual store
try {
  const pnpmEntries = fs.readdirSync(pnpmStore);
  const nextPnpmDir = pnpmEntries.find((d) => d.startsWith('next@'));
  if (nextPnpmDir) {
    const nextInternalNm = path.join(pnpmStore, nextPnpmDir, 'node_modules');
    if (fs.existsSync(nextInternalNm)) {
      const internalPkgs = fs.readdirSync(nextInternalNm);
      for (const pkg of internalPkgs) {
        const src = path.join(nextInternalNm, pkg);
        const dst = path.join(standaloneNm, pkg);
        if (!fs.existsSync(dst)) {
          console.log(`📦 Injecting missing Next dependency: ${pkg}`);
          fs.cpSync(src, dst, { recursive: true, dereference: true });
        }
      }
    }
  }
} catch (err) {
  console.warn('⚠️ Warning while scanning pnpm store for Next dependencies:', err.message);
}

// 2. Ensure @swc/helpers is present
const swcDir = path.join(standaloneNm, '@swc', 'helpers');
if (!fs.existsSync(swcDir)) {
  try {
    const pnpmEntries = fs.readdirSync(pnpmStore);
    const swcEntry = pnpmEntries.find((d) => d.includes('@swc+helpers'));
    if (swcEntry) {
      const src = path.join(pnpmStore, swcEntry, 'node_modules', '@swc', 'helpers');
      if (fs.existsSync(src)) {
        console.log('📦 Injecting @swc/helpers...');
        fs.mkdirSync(path.dirname(swcDir), { recursive: true });
        fs.cpSync(src, swcDir, { recursive: true, dereference: true });
      }
    }
  } catch (err) {
    console.warn('⚠️ Warning while injecting @swc/helpers:', err.message);
  }
}

// 3. Ensure @next/env is present
const nextEnvDir = path.join(standaloneNm, '@next', 'env');
if (!fs.existsSync(nextEnvDir)) {
  try {
    const pnpmEntries = fs.readdirSync(pnpmStore);
    const envEntry = pnpmEntries.find((d) => d.includes('@next+env'));
    if (envEntry) {
      const src = path.join(pnpmStore, envEntry, 'node_modules', '@next', 'env');
      if (fs.existsSync(src)) {
        console.log('📦 Injecting @next/env...');
        fs.mkdirSync(path.dirname(nextEnvDir), { recursive: true });
        fs.cpSync(src, nextEnvDir, { recursive: true, dereference: true });
      }
    }
  } catch (err) {
    console.warn('⚠️ Warning while injecting @next/env:', err.message);
  }
}

// 4. Ensure .prisma client is present in standalone/node_modules
const prismaClientDir = path.join(standaloneNm, '.prisma');
if (!fs.existsSync(prismaClientDir)) {
  try {
    const pnpmEntries = fs.readdirSync(pnpmStore);
    const prismaEntry = pnpmEntries.find((d) => d.includes('@prisma+client'));
    if (prismaEntry) {
      const src = path.join(pnpmStore, prismaEntry, 'node_modules', '.prisma');
      if (fs.existsSync(src)) {
        console.log('📦 Injecting .prisma generated client...');
        fs.cpSync(src, prismaClientDir, { recursive: true, dereference: true });
      }
    }
  } catch (err) {
    console.warn('⚠️ Warning while injecting .prisma:', err.message);
  }
}


// 4. Fully dereference all junctions / symlinks across the entire standalone directory
console.log('🔗 Dereferencing all symlinks and junctions with fs.cpSync(dereference: true)...');
const tempResolved = path.join(rootDir, '.next', 'standalone_resolved_clean');

if (fs.existsSync(tempResolved)) {
  fs.rmSync(tempResolved, { recursive: true, force: true });
}

fs.cpSync(standaloneDir, tempResolved, { recursive: true, dereference: true });

// Swap directories
console.log('🔄 Swapping resolved directory with .next/standalone...');
fs.rmSync(standaloneDir, { recursive: true, force: true });
fs.renameSync(tempResolved, standaloneDir);

console.log('✅ Standalone directory is now 100% real files with zero broken Windows symlinks!');
