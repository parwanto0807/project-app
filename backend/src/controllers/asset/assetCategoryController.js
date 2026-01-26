import { prisma } from "../../config/db.js";

export const assetCategoryController = {
  getAll: async (req, res) => {
    try {
      const categories = await prisma.assetCategory.findMany({
        include: {
          _count: {
            select: { assets: true }
          }
        },
        orderBy: { name: 'asc' }
      });
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { 
        name, 
        description, 
        usefulLife, 
        depreciationMethod,
        assetAccountId,
        accumDeprecAccountId,
        deprecExpenseAccountId
      } = req.body;

      const category = await prisma.assetCategory.create({
        data: {
          name,
          description,
          usefulLife: parseInt(usefulLife),
          depreciationMethod,
          assetAccountId,
          accumDeprecAccountId,
          deprecExpenseAccountId
        }
      });

      res.status(201).json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const category = await prisma.assetCategory.update({
        where: { id },
        data: {
          ...data,
          usefulLife: data.usefulLife ? parseInt(data.usefulLife) : undefined,
        }
      });

      res.status(200).json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if there are assets in this category
      const assetCount = await prisma.fixedAsset.count({ where: { categoryId: id } });
      if (assetCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete category with existing assets' 
        });
      }

      await prisma.assetCategory.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Category deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
