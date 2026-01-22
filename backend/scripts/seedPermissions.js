import { prisma } from '../src/config/db.js';

const permissions = [
  // ==========================================
  // PURCHASING MODULE
  // ==========================================
  {
    code: 'pr.view',
    name: 'View Purchase Request',
    module: 'purchasing',
    description: 'Dapat melihat daftar dan detail Purchase Request'
  },
  {
    code: 'pr.create',
    name: 'Create Purchase Request',
    module: 'purchasing',
    description: 'Dapat membuat Purchase Request baru'
  },
  {
    code: 'pr.approve',
    name: 'Approve Purchase Request',
    module: 'purchasing',
    description: 'Dapat menyetujui Purchase Request'
  },
  {
    code: 'pr.manage',
    name: 'Manage Purchase Request',
    module: 'purchasing',
    description: 'Full access untuk mengelola Purchase Request'
  },
  {
    code: 'po.view',
    name: 'View Purchase Order',
    module: 'purchasing',
    description: 'Dapat melihat daftar dan detail Purchase Order'
  },
  {
    code: 'po.create',
    name: 'Create Purchase Order',
    module: 'purchasing',
    description: 'Dapat membuat Purchase Order baru'
  },
  {
    code: 'po.manage',
    name: 'Manage Purchase Order',
    module: 'purchasing',
    description: 'Full access untuk mengelola Purchase Order'
  },

  // ==========================================
  // INVENTORY MODULE
  // ==========================================
  {
    code: 'inventory.view',
    name: 'View Inventory',
    module: 'inventory',
    description: 'Dapat melihat stock, inventory, dan data product'
  },
  {
    code: 'inventory.manage',
    name: 'Manage Inventory',
    module: 'inventory',
    description: 'Dapat mengelola inventory (stock in/out, transfer, opname)'
  },
  {
    code: 'mr.view',
    name: 'View Material Requisition',
    module: 'inventory',
    description: 'Dapat melihat Material Requisition'
  },
  {
    code: 'mr.approve',
    name: 'Approve Material Requisition',
    module: 'inventory',
    description: 'Dapat menyetujui Material Requisition'
  },
  {
    code: 'warehouse.manage',
    name: 'Manage Warehouse',
    module: 'inventory',
    description: 'Dapat mengelola gudang dan lokasi penyimpanan'
  },

  // ==========================================
  // FINANCE MODULE
  // ==========================================
  {
    code: 'finance.view',
    name: 'View Finance Reports',
    module: 'finance',
    description: 'Dapat melihat laporan keuangan'
  },
  {
    code: 'finance.manage',
    name: 'Manage Finance',
    module: 'finance',
    description: 'Dapat mengelola transaksi keuangan'
  },
  {
    code: 'payment.approve',
    name: 'Approve Payment',
    module: 'finance',
    description: 'Dapat menyetujui pembayaran'
  },
  {
    code: 'invoice.manage',
    name: 'Manage Invoice',
    module: 'finance',
    description: 'Dapat mengelola invoice (Customer & Supplier)'
  },
  {
    code: 'accounting.manage',
    name: 'Manage Accounting',
    module: 'accounting',
    description: 'Dapat mengelola jurnal, COA, dan pembukuan'
  },

  // ==========================================
  // PROJECT & PRODUCTION MODULE
  // ==========================================
  {
    code: 'project.view',
    name: 'View Projects',
    module: 'project',
    description: 'Dapat melihat daftar project dan produksi (SPK Progress)'
  },
  {
    code: 'project.manage',
    name: 'Manage Projects',
    module: 'project',
    description: 'Dapat mengelola project dan SPK'
  },
  {
    code: 'bap.manage',
    name: 'Manage BAP',
    module: 'project',
    description: 'Dapat mengelola Berita Acara Pekerjaan'
  },

  // ==========================================
  // SALES MODULE
  // ==========================================
  {
    code: 'sales.view',
    name: 'View Sales',
    module: 'sales',
    description: 'Dapat melihat sales order, quotation, dan data customer'
  },
  {
    code: 'sales.manage',
    name: 'Manage Sales',
    module: 'sales',
    description: 'Dapat mengelola sales order, quotation, dan customer'
  },

  // ==========================================
  // HR MODULE
  // ==========================================
  {
    code: 'hr.view',
    name: 'View HR Data',
    module: 'hr',
    description: 'Dapat melihat data karyawan'
  },
  {
    code: 'hr.manage',
    name: 'Manage HR',
    module: 'hr',
    description: 'Dapat mengelola data karyawan dan penggajian'
  },

  // ==========================================
  // SETTINGS MODULE (Super Admin Only)
  // ==========================================
  {
    code: 'settings.users',
    name: 'Manage Users',
    module: 'settings',
    description: 'Dapat mengelola user dan role'
  },
  {
    code: 'settings.permissions',
    name: 'Manage Permissions',
    module: 'settings',
    description: 'Dapat mengatur permission per role'
  },
  {
    code: 'settings.system',
    name: 'Manage System Settings',
    module: 'settings',
    description: 'Dapat mengatur konfigurasi sistem'
  },
];

// Default permissions untuk setiap role
const defaultRolePermissions = {
  // SUPER ADMIN - Full access ke semua (akan di-bypass di middleware)
  super: [],

  // ADMIN - Access ke operational modules
  admin: [
    // Purchasing
    { code: 'pr.view', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'pr.create', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'pr.approve', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'pr.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'po.view', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'po.create', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'po.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    
    // Inventory & Warehouse
    { code: 'inventory.view', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'inventory.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'warehouse.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'mr.view', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'mr.approve', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    
    // Finance & Accounting
    { code: 'finance.view', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'finance.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'invoice.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'payment.approve', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'accounting.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    
    // Project & Production
    { code: 'project.view', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'project.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'bap.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    
    // Sales
    { code: 'sales.view', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'sales.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    
    // HR
    { code: 'hr.view', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    { code: 'hr.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: true },
  ],

  // PIC - Limited access
  pic: [
    // Purchasing
    { code: 'pr.view', canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    { code: 'pr.create', canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    { code: 'po.view', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    
    // Inventory
    { code: 'inventory.view', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    { code: 'inventory.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: false }, // For GR/MR/Transfer
    { code: 'warehouse.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: false }, // For Data Gudang
    
    // Project
    { code: 'project.view', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    { code: 'project.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: false }, // For SPK & Data Team
    { code: 'bap.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    
    // Sales
    { code: 'sales.view', canRead: true, canCreate: false, canUpdate: false, canDelete: false }, // For Data Customer
    
    // HR
    { code: 'hr.view', canRead: true, canCreate: false, canUpdate: false, canDelete: false }, // For Data Employee
    
    // Accounting & Finance (Limited)
    { code: 'accounting.manage', canRead: true, canCreate: false, canUpdate: false, canDelete: false }, // Access to menu group
    { code: 'invoice.manage', canRead: true, canCreate: true, canUpdate: true, canDelete: false }, // For Supplier Invoice
  ],

  // USER - Very limited access
  user: [
    { code: 'pr.view', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    { code: 'inventory.view', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    { code: 'project.view', canRead: true, canCreate: false, canUpdate: false, canDelete: false },
  ],
};

async function seedPermissions() {
  console.log('🌱 Starting permission seeding...');

  try {
    // 1. Create all permissions
    console.log('📝 Creating permissions...');
    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { code: perm.code },
        update: perm,
        create: perm,
      });
      console.log(`  ✅ ${perm.code}`);
    }

    // 2. Create default role permissions
    console.log('\n🔐 Creating default role permissions...');
    for (const [role, perms] of Object.entries(defaultRolePermissions)) {
      console.log(`\n  Role: ${role.toUpperCase()}`);
      
      for (const permConfig of perms) {
        const permission = await prisma.permission.findUnique({
          where: { code: permConfig.code }
        });

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              role_permissionId: {
                role: role,
                permissionId: permission.id
              }
            },
            update: {
              canCreate: permConfig.canCreate,
              canRead: permConfig.canRead,
              canUpdate: permConfig.canUpdate,
              canDelete: permConfig.canDelete,
            },
            create: {
              role: role,
              permissionId: permission.id,
              canCreate: permConfig.canCreate,
              canRead: permConfig.canRead,
              canUpdate: permConfig.canUpdate,
              canDelete: permConfig.canDelete,
            }
          });
          console.log(`    ✅ ${permConfig.code}`);
        }
      }
    }

    console.log('\n✅ Permission seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPermissions()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
