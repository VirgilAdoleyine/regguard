const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const srcDir = path.join(__dirname, '..', 'src');
const outDir = path.join(__dirname, '..', 'out');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const entryPoints = [];

function findTsFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findTsFiles(fullPath);
    } else if (file.endsWith('.ts')) {
      entryPoints.push(fullPath);
    }
  }
}

findTsFiles(srcDir);

async function build() {
  const result = await esbuild.build({
    entryPoints: entryPoints,
    bundle: true,
    platform: 'node',
    target: 'node18',
    outdir: outDir,
    format: 'cjs',
    sourcemap: true,
    external: ['vscode'],
    loader: {
      '.ts': 'ts'
    },
    resolveExtensions: ['.ts', '.js'],
    logLevel: 'info'
  });
  console.log('Build completed successfully');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
