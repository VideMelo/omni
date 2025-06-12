const fs = require('fs');
const path = require('path');

const rootDir = process.argv[2] || '.';
const ignore = ['node_modules', '.git', 'dist', 'build', '.vscode', 'tree.js', 'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.env', '.env.example', '.gitignore', 'README.md', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md', 'docs', 'test', '__tests__', '.github'];

function generateTree(dir, prefix = '') {
   const items = fs.readdirSync(dir).filter((item) => !ignore.includes(item));

   return items
      .map((item, index) => {
         const fullPath = path.join(dir, item);
         const isLast = index === items.length - 1;
         const marker = isLast ? '└── ' : '├── ';

         let output = `${prefix}${marker}${item}\n`;

         if (fs.statSync(fullPath).isDirectory()) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            output += generateTree(fullPath, newPrefix);
         }

         return output;
      })
      .join('');
}

console.log(`Estrutura de: ${path.resolve(rootDir)}\n`);
console.log(generateTree(rootDir));
