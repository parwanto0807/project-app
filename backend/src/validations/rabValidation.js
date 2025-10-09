// rabValidation.js
import { z } from "zod";

// Schema untuk RAB Detail
const rabDetailSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  qty: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  price: z.number().positive("Price must be positive"),
  costType: z.enum(["MATERIAL", "LABOR","EQUIPMENT","SUBCON","TRANSPORT","OVERHEAD", "OTHER"]).default("MATERIAL"),
  notes: z.string().optional().nullable(),
});

// Schema utama untuk RAB
const rabCreateSchema = z.object({
  projectId: z.string().uuid("Project ID must be a valid UUID"),
  name: z.string().min(1, "RAB name is required"),
  description: z.string().optional().nullable(),
  rabDetails: z
    .array(rabDetailSchema)
    .min(1, "At least one RAB detail is required"),
  createdById: z.string().uuid().optional(),
});

const rabUpdateSchema = rabCreateSchema.partial().extend({
  rabDetails: z
    .array(rabDetailSchema)
    .min(1, "At least one RAB detail is required"),
});

// Schema untuk update status
export const rabStatusSchema = z.object({
  status: z.enum(["DRAFT", "APPROVED", "REJECTED"]),
});

// Validation functions
export const validateRabData = (data, isUpdate = false) => {
  const schema = isUpdate ? rabUpdateSchema : rabCreateSchema;

  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
    }

    return {
      success: false,
      errors: [{ field: "unknown", message: "Unknown validation error" }],
    };
  }
};

const rabSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "RAB name is required"),
  description: z.string().optional().nullable(),
  createdById: z.string().min(1, "Created by ID is required"),
  rabDetails: z
    .array(
      z.object({
        productId: z.string().optional().nullable(),
        description: z.string().min(1, "Description is required"),
        categoryRab: z.enum([
          "PRELIMINARY",
          "SITEPREP",
          "STRUCTURE",
          "ARCHITECTURE",
          "MEP",
          "FINISHING",
          "LANDSCAPE",
          "EQUIPMENT",
          "OVERHEAD",
          "OTHER",
        ]),
        qty: z.number().min(0.01, "Quantity must be greater than 0"),
        unit: z.string().min(1, "Unit is required"),
        price: z.number().min(0, "Price must be greater than or equal to 0"),
        costType: z.enum(["MATERIAL", "LABOR","EQUIPMENT","SUBCON","TRANSPORT","OVERHEAD", "OTHER"]),
        notes: z.string().optional().nullable(),
      })
    )
    .min(1, "At least one RAB detail is required"),
});

// Alternative: Simple parse function
export const parseRabData = (data) => {
  // Convert string numbers to numbers for validation
  const processedData = {
    ...data,
    rabDetails: data.rabDetails.map((detail) => ({
      ...detail,
      qty: parseFloat(detail.qty),
      price: parseFloat(detail.price),
    })),
  };

  return rabSchema.safeParse(processedData);
};

// Export schemas untuk digunakan di tempat lain
export { rabCreateSchema, rabUpdateSchema, rabDetailSchema };
