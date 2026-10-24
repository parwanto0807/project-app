import express from "express";
import { createImageUpload } from "../../../utils/secureUpload.js";
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

// Upload gambar produk: maks 5 MB, hanya JPG/PNG/WebP.
const upload = createImageUpload("images", 5, 2);

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
