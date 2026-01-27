import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'backend/scripts/seedChartOfAccounts.js');
let content = fs.readFileSync(filePath, 'utf8');

const oldLogic = `  // Pass 2: Setup Parent-Child Relations automatically based on code pattern
  for (const item of coaData) {
    let parentCode = null;
    const parts = item.code.split('-');
    const num = parts[1];

    if (item.parentCode) {
        parentCode = item.parentCode;
    } else if (item.postingType === 'POSTING') {
      // Rule: POSTING 1-10001 -> Parent HEADER 1-10000
      const parts = item.code.split('-');
      if (parts.length > 1 && !isNaN(parts[1])) {
           const num = parts[1];
           const headerNum = num.substring(0, 3) + '00';
           parentCode = \`\${parts[0]}-\${headerNum}\`;
      }
    } else if (item.postingType === 'HEADER') {
      // Rule: Header 2-10000 -> Parent Root HEADER 2-00000
      const parts = item.code.split('-');
      if (parts.length > 1 && !isNaN(parts[1])) {
           const num = parts[1];
           if (num.endsWith('000') && !num.endsWith('0000')) {
              const rootNum = num.substring(0, 1) + '0000';
              parentCode = \`\${parts[0]}-\${rootNum}\`;
           }
      }
    }

    if (parentCode && parentCode !== item.code) {
      const parent = await prisma.chartOfAccounts.findUnique({
        where: { code: parentCode }
      });
      
      if (parent) {
        await prisma.chartOfAccounts.update({
          where: { code: item.code },
          data: { parentId: parent.id }
        });
      }
    }
  }`;

const newLogic = `  // Pass 2: Setup Parent-Child Relations automatically based on code pattern
  const allCodesForLookup = new Set(coaData.map(item => item.code));

  for (const item of coaData) {
    let parentCode = null;

    if (item.parentCode) {
      parentCode = item.parentCode;
    } else {
      const parts = item.code.split('-');
      if (parts.length > 1) {
        let prefix = parts[0];
        let numStr = parts[1];
        for (let i = numStr.length - 1; i >= 0; i--) {
          if (numStr[i] !== '0') {
            let candidateNum = numStr.substring(0, i) + '0'.repeat(numStr.length - i);
            let candidate = \`\${prefix}-\${candidateNum}\`;
            if (allCodesForLookup.has(candidate) && candidate !== item.code) {
              parentCode = candidate;
              break;
            }
          }
        }
      }
    }

    if (parentCode && parentCode !== item.code) {
      const parent = await prisma.chartOfAccounts.findUnique({
        where: { code: parentCode }
      });
      
      if (parent) {
        await prisma.chartOfAccounts.update({
          where: { code: item.code },
          data: { parentId: parent.id }
        });
      }
    }
  }`;

// Use a more relaxed match just in case of whitespace
const startIndex = content.indexOf('// Pass 2: Setup Parent-Child Relations');
const endIndex = content.indexOf('console.log(\'✅ Chart of Accounts is up to date!\');');

if (startIndex !== -1 && endIndex !== -1) {
    const finalContent = content.substring(0, startIndex) + newLogic + '\n\n  ' + content.substring(endIndex);
    fs.writeFileSync(filePath, finalContent);
    console.log('Successfully updated seedChartOfAccounts.js');
} else {
    console.error('Could not find markers', { startIndex, endIndex });
    process.exit(1);
}
