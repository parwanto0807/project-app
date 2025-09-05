// routes/customerRoutes.js
import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerCount,
} from "../../../controllers/master/customer/customerController.js";
import {
  authorizeAdmin,
  authenticateToken,
  authorizeSuperAdmin,
} from "../../../middleware/authMiddleware.js";

const router = express.Router();

// router.use("/", authenticateToken);

router.get("/getAllCustomers", getAllCustomers);
router.get("/getCustomerCount", getCustomerCount);
router.get("/getCustomerById/:id", getCustomerById);
router.post("/createCustomer", createCustomer);
router.put("/updateCustomer/:id", updateCustomer);
router.delete("/deleteCustomer/:id", deleteCustomer);

export default router;
