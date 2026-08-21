const fs = require('fs');

const path = 'backend/src/controllers/lpp/lppController.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('updatePRRemainingBudget')) {
  // Add import
  content = content.replace(
    'import {',
    'import { updatePRRemainingBudget } from "../../utils/prParentChildHelpers.js";\nimport {'
  );

  // Helper function to insert before return/res.status
  const helperStr = `
const syncPRBudgetFromLPJ = async (lpjId, tx) => {
  const db = tx || prisma;
  const lpj = await db.pertanggungjawaban.findUnique({
    where: { id: lpjId },
    include: { uangMuka: true }
  });
  if (lpj && lpj.uangMuka && lpj.uangMuka.purchaseRequestId) {
    await updatePRRemainingBudget(lpj.uangMuka.purchaseRequestId, db);
  }
};
`;

  content = content.replace(
    'export const lppController = {',
    helperStr + '\nexport const lppController = {'
  );

  // Insert in createLpp (after result is assigned)
  content = content.replace(
    /return lpp;\s+}\);\s+res\.status\(201\)\.json\(\{/g,
    '  await syncPRBudgetFromLPJ(lpp.id, tx);\n          return lpp;\n        });\n\n      res.status(201).json({'
  );

  // Insert in createLppDetail (after result is assigned)
  content = content.replace(
    /return completeDetail;\s+}\);\s+res\.status\(201\)\.json\(\{/g,
    '  await syncPRBudgetFromLPJ(id, tx);\n          return completeDetail;\n        });\n\n      res.status(201).json({'
  );

  // Insert in batchUpdateDetails (after updatedLpp)
  content = content.replace(
    /return updatedLpp;\s+}\);\s+res\.json\(\{/g,
    '  await syncPRBudgetFromLPJ(id, tx);\n          return updatedLpp;\n        });\n\n      res.json({'
  );

  // Insert in updateStatus (after updatedLpp is defined in transaction)
  // Wait, updateStatus uses updatedLpp.id? Let's check updateStatus
  content = content.replace(
    /return updatedLpp;\s+}\);\s+res\.json\(\{\s+success: true,\s+message: `Status/g,
    '  await syncPRBudgetFromLPJ(updatedLpp.id, tx);\n          return updatedLpp;\n        });\n\n      res.json({\n        success: true,\n        message: `Status'
  );

  // Let's just do a blanket insert: replace "return lpp;" inside transactions with "await syncPRBudgetFromLPJ(lpp.id, tx); return lpp;"
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('lppController.js updated successfully!');
} else {
  console.log('lppController.js already has updatePRRemainingBudget');
}
