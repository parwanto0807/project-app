import { z } from "zod";

const dateField = z
  .union([z.string(), z.date()])
  .nullable()
  .optional()
  .transform((val) => {
    if (!val) return null; // handle null
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  });

// Enum sama seperti Prisma
export const BAPStatusEnum = z.enum([
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "APPROVED",
]);

// Schema untuk Photo
export const PhotoCategoryEnum = z.enum(["BEFORE", "PROCESS", "AFTER"]);

export const BAPPhotoSchema = z.object({
  id: z.string().uuid().optional(), // optional untuk create
  bapId: z.string(),
  photoUrl: z.string().min(1, "Foto wajib ada"),
  caption: z.string().nullable().optional(), // 🔑 fix → bisa null
  category: PhotoCategoryEnum,
  createdAt: dateField,
});

// Schema utama BAP
// Schema utama BAP
export const BAPSchema = z.object({
  id: z.string().uuid().optional(),
  bapNumber: z.string().min(1, "Nomor BAP wajib diisi"),
  bapDate: dateField,
  salesOrderId: z.string().uuid(),
  projectId: z.string().uuid(),

  // Relasi user
  createdById: z.string().min(1, "User wajib dipilih"),
  userId: z.string().min(1, "User wajib dipilih"),

  // Informasi pekerjaan
  workDescription: z.string().optional(),
  location: z.string().optional(),

  // Status
  status: BAPStatusEnum.default("DRAFT"),
  isApproved: z.boolean().default(false),
  approvedAt: dateField, // 🔑 fix → bisa null/string/date

  // Tambahan
  notes: z.string().optional(),

  createdAt: dateField,  // 🔑 fix
  updatedAt: dateField,  // 🔑 fix

  // Relasi photos
  photos: z.array(BAPPhotoSchema).optional(),
});


// Schema untuk create (frontend form)
export const BAPCreateSchema = BAPSchema.omit({
  id: true,
  bapNumber: true, // auto generate di backend
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
}).extend({
  photos: z
    .array(
      z.object({
        photoUrl: z.string().url(),
        category: z.enum(["BEFORE", "PROCESS", "AFTER"]),
        caption: z.string().optional(),
        source: z.string().optional(),
      })
    )
    .optional(),
});

// Schema untuk update
export const BAPUpdateSchema = BAPSchema.partial();

export type BAPPhotoInput = {
  photoUrl: string | File; // bisa string (SPK) atau File (manual)
  category: "BEFORE" | "PROCESS" | "AFTER";
  caption?: string;
};
