import {
  // HomeIcon,
  SettingsIcon,
  CreditCardIcon,
  UsersIcon,
  // FileTextIcon,
  HelpCircleIcon,
  FileSearchIcon,
  // BuildingIcon,
  BriefcaseIcon,
  // UserCheckIcon,
  // PackageIcon,
  // ShieldIcon,
  // BookOpenIcon,
  // PhoneIcon,
  // ClipboardListIcon,
  PackageOpen,
  BarChart3Icon,
  type LucideIcon,
  PackageCheckIcon,
  Wallet2,
  Banknote,
  Warehouse,
  ReceiptText,
  FileText,
  ClipboardList,
  ShoppingBag,
  FilePlus,
  FileCheck,
  Calculator,
  Monitor,
  PackageSearch,
  ArrowLeftRight,
  ClipboardCheck,
  Container,
  TrendingUp,
  CheckSquare,
  Scale,
  FileSpreadsheet,
  Book,
  PieChart,
  Calendar,
  Cpu,
  Landmark,
  Activity,
  LayoutList,
  FileBadge,
  UserCheck,
  ArrowRightLeft,
  Truck,
  Package,
  Contact,
  Users,
  Network,
  BookOpen,
  Phone,
  LayoutDashboard,
  ShieldCheck,
  History,
} from "lucide-react";

interface Permission {
  code: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface Submenu {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  requiredPermission?: string;
}

interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  submenus: Submenu[];
  requiredPermission?: string;
}

interface MenuGroup {
  groupLabel: string;
  allowedRoles: string[];
  menus: MenuItem[];
}

function isActive(path: string, pathname: string) {
  return pathname === path || pathname.startsWith(path + "/");
}

export function getMenuList(pathname: string, role: string, permissions: Permission[] = []) {
  const basePath =
    role === "super"
      ? "/super-admin-area"
      : role === "admin"
        ? "/admin-area"
        : "/pic-area";

  // Helper to check if user has permission
  const hasPermission = (permissionCode?: string) => {
    if (!permissionCode) return true;
    if (role === 'super') return true; // Super admin always has access

    const permission = permissions.find(p => p.code === permissionCode);
    return permission?.canRead || false;
  };

  const allMenus: MenuGroup[] = [
    {
      groupLabel: "DASHBOARD SUPER ADMIN",
      allowedRoles: ["super"],
      menus: [
        {
          label: "Dashboard Super Admin",
          href: "/super-admin-area",
          icon: BarChart3Icon,
          active: isActive("/super-admin-area", pathname),
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "DASHBOARD ADMIN",
      allowedRoles: ["admin"],
      menus: [
        {
          label: "Dashboard Admin",
          href: "/admin-area",
          icon: BarChart3Icon,
          active: isActive("/admin-area", pathname),
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "DASHBOARD PIC",
      allowedRoles: ["pic"],
      menus: [
        {
          label: "Dashboard Pic",
          href: "/pic-area",
          icon: BarChart3Icon,
          active: isActive("/pic-area", pathname),
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "DASHBOARD USER",
      allowedRoles: ["user"],
      menus: [
        {
          label: "Dashboard User",
          href: "/user-area",
          icon: BarChart3Icon,
          active: isActive("/user-area", pathname),
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "SALES",
      allowedRoles: ["super", "admin", "pic"],
      menus: [
        {
          label: "Sales Management",
          href: "#",
          icon: CreditCardIcon,
          active: isActive("#", pathname),
          requiredPermission: "sales.view",
          submenus: [
            {
              href: `${basePath}/sales/salesOrder`,
              label: "Sales Order",
              icon: ReceiptText,
              active: isActive(`${basePath}/sales/salesOrder`, pathname),
              disabled: role === "user",
              requiredPermission: "sales.view",
            },
            {
              href: `${basePath}/sales/quotation`,
              label: "Quotation",
              icon: FileText,
              active: isActive(`${basePath}/sales/quotation`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "sales.view",
            },
          ],
        },
      ],
    },
    {
      groupLabel: "LOGISTIC",
      allowedRoles: ["super", "admin", "pic"],
      menus: [
        {
          label: "Logistic Management",
          href: "#",
          icon: PackageOpen,
          active: isActive(`${basePath}/logistic`, pathname),
          submenus: [
            {
              href: `${basePath}/logistic/spk`,
              label: "Surat Perintah Kerja",
              icon: ClipboardList,
              active: isActive(`${basePath}/logistic/spk`, pathname),
              disabled: role === "user",
              requiredPermission: "project.manage",
            },
            {
              href: `${basePath}/logistic/pr`,
              label: "Purchase Request",
              icon: ShoppingBag,
              active: isActive(`${basePath}/logistic/pr`, pathname),
              disabled: role === "user",
              requiredPermission: "pr.view",
            },
            {
              href: `${basePath}/logistic/purchasing`,
              label: "Purchase Order (PO)",
              icon: FilePlus,
              active: isActive(`${basePath}/logistic/purchasing`, pathname),
              disabled: role === "user", // Biasanya PIC hanya buat PR, Admin yang buat PO
              requiredPermission: "po.view",
            },
            {
              href: `${basePath}/logistic/bap`,
              label: "Berita Acara Pekerjaan",
              icon: FileCheck,
              active: isActive(`${basePath}/logistic/bap`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "bap.manage",
            },
            {
              href: `${basePath}/logistic/rab`,
              label: "Rancangan Anggaran Biaya",
              icon: Calculator,
              active: isActive(`${basePath}/logistic/rab`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "project.manage",
            },
          ],
        },
        // --- TAMBAHAN MENU INVENTORY ---
        {
          label: "Inventory Control",
          href: "#",
          icon: Warehouse,
          active: isActive(`${basePath}/inventory`, pathname),
          requiredPermission: "inventory.view",
          submenus: [
            {
              href: `${basePath}/inventory/dashboard`,
              label: "Stock Monitor",
              icon: Monitor,
              active: isActive(`${basePath}/inventory/dashboard`, pathname),
              requiredPermission: "inventory.view",
            },
            {
              href: `${basePath}/inventory/goods-receipt`,
              label: "Penerimaan Barang (GR)",
              icon: PackageSearch,
              active: isActive(`${basePath}/inventory/goods-receipt`, pathname),
              requiredPermission: "inventory.manage",
            },
            {
              href: `${basePath}/inventory/requisition`,
              label: "Pengeluaran Barang (MR)",
              icon: ShoppingBag,
              active: isActive(`${basePath}/inventory/requisition`, pathname),
              requiredPermission: "inventory.manage",
            },
            {
              href: `${basePath}/inventory/transfer`,
              label: "Transfer Gudang",
              icon: ArrowLeftRight,
              active: isActive(`${basePath}/inventory/transfer`, pathname),
              requiredPermission: "inventory.manage",
            },
            {
              href: `${basePath}/inventory/stock-opname`,
              label: "Stock Opname",
              icon: ClipboardCheck,
              active: isActive(`${basePath}/inventory/stock-opname`, pathname),
              requiredPermission: "inventory.manage",
            },
            {
              href: `${basePath}/inventory/wh`,
              label: "Data Gudang",
              icon: Container,
              active: isActive(`${basePath}/inventory/wh`, pathname),
              requiredPermission: "warehouse.manage",
            },
          ],
        },
      ],
    },
    {
      groupLabel: "PRODUCTION",
      allowedRoles: ["super", "admin", "pic"],
      menus: [
        {
          label: "Production Management",
          href: "#",
          icon: PackageCheckIcon,
          active: isActive("#", pathname),
          requiredPermission: "project.view",
          submenus: [
            {
              href: `${basePath}/logistic/spkReport`,
              label: "SPK Progress",
              icon: TrendingUp,
              active: isActive(`${basePath}/logistic/spkReport`, pathname),
              disabled: role === "user",
              requiredPermission: "project.view",
            },
          ],
        },
      ],
    },
    {
      groupLabel: "ACCOUNTING",
      allowedRoles: ["super", "admin", "pic"],
      menus: [
        {
          label: "Accounting Management",
          href: "/accounting",
          icon: Wallet2,
          active: isActive("/accounting", pathname),
          requiredPermission: "accounting.manage",
          submenus: [
            {
              href: `${basePath}/accounting/prVerify`,
              label: "PR Verifikasi",
              icon: CheckSquare,
              active: isActive(`${basePath}/accounting/prVerify`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "finance.manage",
            },
            {
              href: `${basePath}/accounting/staff-balance`,
              label: "Staff Balance",
              icon: Scale,
              active: isActive(`${basePath}/accounting/staff-balance`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "accounting.manage",
            },
            {
              href: `${basePath}/accounting/supplier-invoice`,
              label: role === "pic" ? "Penerimaan Invoice Supplier" : "Supplier invoice",
              icon: FileSpreadsheet,
              active: isActive(`${basePath}/accounting/supplier-invoice`, pathname),
              disabled: role === "user",
              requiredPermission: "invoice.manage",
            },
            {
              href: `${basePath}/accounting/ledger`,
              label: "Ledger (Buku Besar)",
              icon: Book,
              active: isActive(`${basePath}/accounting/ledger`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "accounting.manage",
            },
            {
              href: `${basePath}/accounting/general-ledger`,
              label: "General Ledger Summary",
              icon: PieChart,
              active: isActive(`${basePath}/accounting/general-ledger`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "accounting.manage",
            },
            {
              href: `${basePath}/accounting/trial-balance`,
              label: "Trial Balance",
              icon: Landmark,
              active: isActive(`${basePath}/accounting/trial-balance`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "accounting.manage",
            },
            {
              href: `${basePath}/accounting/accounting-period`,
              label: "Accounting Period Setting",
              icon: Calendar,
              active: isActive(`${basePath}/accounting/accounting-period`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "accounting.manage",
            },
            {
              href: `${basePath}/accounting/system-account`,
              label: "System Account",
              icon: Cpu,
              active: isActive(`${basePath}/accounting/system-account`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "accounting.manage",
            },
            {
              href: `${basePath}/master/bank-account`,
              label: "Bank Account",
              icon: Landmark,
              active: isActive(`${basePath}/master/bank-account`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "finance.manage",
            },
            {
              href: `${basePath}/accounting/opening-balance`,
              label: "Opening Balance",
              icon: Activity,
              active: isActive(`${basePath}/accounting/opening-balance`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "accounting.manage",
            },
            {
              href: `${basePath}/master/coa`,
              label: "Chart Of Account",
              icon: LayoutList,
              active: isActive(`${basePath}/master/coa`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "accounting.manage",
            },
          ],
        },
      ],
    },
    {
      groupLabel: "FINANCE",
      allowedRoles: ["super", "admin"],
      menus: [
        {
          label: "Finance Management",
          href: "/finance",
          icon: Banknote,
          active: isActive("/finance", pathname),
          requiredPermission: "finance.view",
          submenus: [
            {
              href: `${basePath}/finance/invoice`,
              label: "Invoicing",
              icon: FileBadge,
              active: isActive(`${basePath}/finance/invoice`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "invoice.manage",
            },
            {
              href: `${basePath}/finance/prApprove`,
              label: "PR Approval",
              icon: UserCheck,
              active: isActive(`${basePath}/finance/prApprove`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "pr.approve",
            },
            {
              href: `${basePath}/finance/fund-transfer`,
              label: "Transfer Antar Kas & Bank",
              icon: ArrowRightLeft,
              active: isActive(`${basePath}/finance/fund-transfer`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "finance.manage",
            },
            {
              href: `${basePath}/accounting/supplier-payment`,
              label: "Supplier payment",
              icon: CreditCardIcon,
              active: isActive(`${basePath}/accounting/supplier-payment`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "payment.approve",
            },
          ],
        },
      ],
    },
    {
      groupLabel: "PENGATURAN",
      allowedRoles: ["super"],
      menus: [
        {
          label: "Master Data",
          href: "/super-admin-area/master",
          icon: BriefcaseIcon,
          active: isActive("/super-admin-area/master", pathname),
          submenus: [
            {
              href: "/super-admin-area/master/customers",
              label: "Data Customer",
              icon: Users,
              active: isActive("/super-admin-area/master/customers", pathname),
            },
            {
              href: "/super-admin-area/master/products",
              label: "Data Products",
              icon: Package,
              active: isActive("/super-admin-area/master/products", pathname),
            },
            {
              href: "/super-admin-area/master/karyawan",
              label: "Data Employee",
              icon: Contact,
              active: isActive("/super-admin-area/master/karyawan", pathname),
            },
            {
              href: "/super-admin-area/master/supplier",
              label: "Data Supplier",
              icon: Truck,
              active: isActive("/super-admin-area/master/supplier", pathname),
            },
          ],
        },
        {
          label: "Pengguna",
          href: "/users",
          icon: UsersIcon,
          active: isActive("/users", pathname),
          requiredPermission: "settings.users",
          submenus: [
            {
              href: "/users/list",
              label: "Daftar Pengguna",
              icon: Users,
              active: isActive("/users/list", pathname),
              requiredPermission: "settings.users",
            },
            {
              href: "/users/roles",
              label: "Manajemen Role",
              icon: ShieldCheck,
              active: isActive("/users/roles", pathname),
              requiredPermission: "settings.permissions",
            },
          ],
        },
        {
          label: "Konfigurasi Sistem",
          href: "/super-admin-area/settings",
          icon: SettingsIcon,
          active: isActive("/super-admin-area/setting", pathname),
          requiredPermission: "settings.system",
          submenus: [
            {
              href: "/super-admin-area/settings/umum",
              label: "Pengaturan Umum",
              icon: SettingsIcon,
              active: isActive("/super-admin-area/setting/umum", pathname),
              requiredPermission: "settings.system",
            },
            {
              href: "/super-admin-area/settings/notifikasi",
              label: "Notifikasi",
              icon: BarChart3Icon,
              active: isActive("/super-admin-area/setting/notifikasi", pathname),
              requiredPermission: "settings.system",
            },
            {
              href: "/super-admin-area/setting/pembayaran",
              label: "Metode Pembayaran",
              icon: Banknote,
              active: isActive("/super-admin-area/setting/pembayaran", pathname),
              requiredPermission: "settings.system",
            },
            {
              href: "/super-admin-area/setting/permissions",
              label: "Permissions",
              icon: ShieldCheck,
              active: isActive("/super-admin-area/setting/permissions", pathname),
              requiredPermission: "settings.permissions",
            },
          ],
        },
        {
          label: "Audit Log",
          href: "#",
          icon: FileSearchIcon,
          active: isActive("#", pathname),
          requiredPermission: "settings.system", // Assuming system setting permission for audit logs
          submenus: [
            {
              href: `${basePath}/setting/auditLog/loginLog`,
              label: "Audit Login",
              icon: History,
              active: isActive(`${basePath}/auditLog/loginLog`, pathname),
              disabled: role === "admin" || role === "pic" || role === "user",
              requiredPermission: "settings.system",
            },
          ],
        },
      ],
    },
    {
      groupLabel: "PENGATURAN",
      allowedRoles: ["admin", "pic"],
      menus: [
        {
          label: "Master Data",
          href: `${basePath}/master`,
          icon: BriefcaseIcon,
          active: isActive("/admin-area/master", pathname),
          submenus: [
            {
              href: `${basePath}/master/customers`,
              label: "Data Customer",
              icon: Users,
              active: isActive(`${basePath}/master/customers`, pathname),
              disabled: role === "user",
              requiredPermission: "sales.view",
            },
            {
              href: `${basePath}/master/supplier`,
              label: "Data Supplier",
              icon: Truck,
              active: isActive(`${basePath}/master/supplier`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "po.view",
            },
            {
              href: `${basePath}/master/products`,
              label: "Data Products",
              icon: Package,
              active: isActive(`${basePath}/master/products`, pathname),
              disabled: role === "user",
              requiredPermission: "inventory.view",
            },
            {
              href: `${basePath}/master/karyawan`,
              label: "Data Employee",
              icon: Contact,
              active: isActive(`${basePath}/master/karyawan`, pathname),
              disabled: role === "user" || role === "pic",
              requiredPermission: "hr.view",
            },
            {
              href: `${basePath}/master/team`,
              label: "Data Team",
              icon: Network,
              active: isActive(`${basePath}/master/team`, pathname),
              disabled: role === "user",
              requiredPermission: "project.manage",
            }
          ],
        },
      ],
    },
    {
      groupLabel: "BANTUAN",
      allowedRoles: ["super", "admin", "pic", "user"],
      menus: [
        {
          label: "Pusat Bantuan",
          href: "#",
          icon: HelpCircleIcon,
          active: isActive("#", pathname),
          submenus: [
            {
              href: "#",
              label: "FAQ",
              icon: HelpCircleIcon,
              active: isActive("#", pathname),
            },
            {
              href: "#",
              label: "Panduan Penggunaan",
              icon: BookOpen,
              active: isActive("#", pathname),
            },
            {
              href: "#",
              label: "Kontak Admin",
              icon: Phone,
              active: isActive("#", pathname),
            },
          ],
        },
      ],
    },
  ];

  // Filter menu berdasarkan role AND permission
  const filteredMenus = allMenus
    .filter((group) => group.allowedRoles.includes(role))
    .map((group) => ({
      ...group,
      menus: group.menus
        .filter((menu) => {
          if (menu.disabled) return false;
          // Check menu permission if exists
          if (menu.requiredPermission && !hasPermission(menu.requiredPermission)) return false;

          // Check if it has any valid submenu
          const validSubmenus = menu.submenus.filter(sub => {
            if (sub.disabled) return false;
            if (sub.requiredPermission && !hasPermission(sub.requiredPermission)) return false;
            return true;
          });

          // Only show menu if it has submenus OR it doesn't have submenus (is a direct link)
          // But if it was intended to have submenus (e.g. grouped), we might want to hide it if empty.
          // However, existing logic doesn't strictly enforce this.
          // Let's rely on standard logic: if submenus are filtered out, should we hide parent?
          // Usually yes for group parents like "Sales Management" # link.
          if (menu.href === '#' && validSubmenus.length === 0) return false;

          return true;
        })
        .map((menu) => {
          // Re-filter submenus inside map to actually remove them
          const validSubmenus = menu.submenus.filter(sub => {
            if (sub.disabled) return false;
            if (sub.requiredPermission && !hasPermission(sub.requiredPermission)) return false;
            return true;
          });

          return {
            ...menu,
            submenus: validSubmenus.map((submenu) => ({
              ...submenu,
              active: isActive(submenu.href, pathname),
            })),
            active:
              isActive(menu.href, pathname) ||
              validSubmenus.some((sub) => isActive(sub.href, pathname)),
          };
        }),
    }))
    .filter(group => group.menus.length > 0); // Remove empty groups

  return filteredMenus;
}
