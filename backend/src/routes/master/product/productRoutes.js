import express from "express";
import multer from "multer";
import path from "path";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCount,
  getAllProductsByType,
  getAllProductsOpname,
} from "../../../controllers/master/product/productController.js";

// 1. Konfigurasi Multer untuk menyimpan image di /public/images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "public/images"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const router = express.Router();

router.get("/getAllProducts", getAllProducts);
router.get("/getAllProductsOpname", getAllProductsOpname);
router.get("/getAllProductsByType/:type", getAllProductsByType);
router.get("/getProductById/:id", getProductById);
router.get("/getProductCount", getProductCount);
router.post("/createProduct", upload.single("image"), createProduct);
router.put("/updateProduct/:id", upload.single("image"), updateProduct);
router.delete("/deleteProduct/:id", deleteProduct);

export default router;
