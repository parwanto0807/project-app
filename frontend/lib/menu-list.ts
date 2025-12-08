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
} from "lucide-react";

interface Submenu {
  href: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
}

interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  submenus: Submenu[];
}

interface MenuGroup {
  groupLabel: string;
  allowedRoles: string[];
  menus: MenuItem[];
}

function isActive(path: string, pathname: string) {
  return pathname === path || pathname.startsWith(path + "/");
}

export function getMenuList(pathname: string, role: string) {
  const basePath =
    role === "super"
      ? "/super-admin-area"
      : role === "admin"
      ? "/admin-area"
      : "/pic-area";
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
          submenus: [
            {
              href: `${basePath}/sales/salesOrder`,
              label: "Sales Order",
              active: isActive(`${basePath}/sales/salesOrder`, pathname),
              disabled: role === "user",
            },
            {
              href: `${basePath}/sales/quotation`,
              label: "Quotation",
              active: isActive(`${basePath}/sales/quotation`, pathname),
              disabled: role === "user" || role === "pic",
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
          active: isActive("#", pathname),
          submenus: [
            {
              href: `${basePath}/logistic/spk`,
              label: "Surat Perintah Kerja",
              active: isActive(`${basePath}/logistic/spk`, pathname),
              disabled: role === "user",
            },
            {
              href: `${basePath}/logistic/pr`,
              label: "Purchase Request",
              active: isActive(`${basePath}/logistic/pr`, pathname),
              disabled: role === "user",
            },
            {
              href: `${basePath}/logistic/bap`,
              label: "Berita Acara Pekerjaan",
              active: isActive(`${basePath}/logistic/bap`, pathname),
              disabled: role === "user" || role === "pic",
            },
            {
              href: `${basePath}/logistic/rab`,
              label: "Rancangan Anggaran Biaya",
              active: isActive(`${basePath}/logistic/rab`, pathname),
              disabled: role === "user" || role === "pic",
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
          submenus: [
            {
              href: `${basePath}/logistic/spkReport`,
              label: "SPK Progress",
              active: isActive(`${basePath}/logistic/spkReport`, pathname),
              disabled: role === "user",
            },
          ],
        },
      ],
    },
    {
      groupLabel: "ACCOUNTING",
      allowedRoles: ["super", "admin"],
      menus: [
        {
          label: "Accounting Management",
          href: "/accounting",
          icon: Wallet2,
          active: isActive("/accounting", pathname),
          submenus: [
            {
              href: `${basePath}/accounting/prVerify`,
              label: "Verifikasi Purchase Request (PR)",
              active: isActive(`${basePath}/accounting/prVerify`, pathname),
              disabled: role === "user" || role === "pic",
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
          submenus: [
            {
              href: `${basePath}/finance/invoice`,
              label: "Invoicing",
              active: isActive(`${basePath}/finance/invoice`, pathname),
              disabled: role === "user" || role === "pic",
            },
            {
              href: `${basePath}/finance/prApprove`,
              label: "Request Approval",
              active: isActive(`${basePath}/finance/prApprove`, pathname),
              disabled: role === "user" || role === "pic",
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
          icon: BriefcaseIcon, // Menggunakan BriefcaseIcon sebagai pengganti
          active: isActive("/super-admin-area/master", pathname),
          submenus: [
            {
              href: "/super-admin-area/master/customers",
              label: "Data Customer",
              active: isActive("/super-admin-area/master/customers", pathname),
            },
            {
              href: "/super-admin-area/master/products",
              label: "Data Products",
              active: isActive("/super-admin-area/master/products", pathname),
            },
            {
              href: "/super-admin-area/master/karyawan",
              label: "Data Employee",
              active: isActive("/super-admin-area/master/karyawan", pathname),
            },
            {
              href: "/super-admin-area/master/supplier",
              label: "Data Supplier",
              active: isActive("/super-admin-area/master/supplier", pathname),
            },
          ],
        },
        {
          label: "Pengguna",
          href: "/users",
          icon: UsersIcon,
          active: isActive("/users", pathname),
          submenus: [
            {
              href: "/users/list",
              label: "Daftar Pengguna",
              active: isActive("/users/list", pathname),
            },
            {
              href: "/users/roles",
              label: "Manajemen Role",
              active: isActive("/users/roles", pathname),
            },
          ],
        },
        {
          label: "Konfigurasi Sistem",
          href: "/settings",
          icon: SettingsIcon,
          active: isActive("/settings", pathname),
          submenus: [
            {
              href: "/settings/umum",
              label: "Pengaturan Umum",
              active: isActive("/settings/umum", pathname),
            },
            {
              href: "/settings/notifikasi",
              label: "Notifikasi",
              active: isActive("/settings/notifikasi", pathname),
            },
            {
              href: "/settings/pembayaran",
              label: "Metode Pembayaran",
              active: isActive("/settings/pembayaran", pathname),
            },
          ],
        },
        {
          label: "Audit Log",
          href: "#",
          icon: FileSearchIcon,
          active: isActive("#", pathname),
          submenus: [
            {
              href: `${basePath}/setting/auditLog/loginLog`,
              label: "Audit Login",
              active: isActive(`${basePath}/auditLog/loginLog`, pathname),
              disabled: role === "admin" || role === "pic" || role === "user",
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
          icon: BriefcaseIcon, // Menggunakan BriefcaseIcon sebagai pengganti
          active: isActive("/admin-area/master", pathname),
          submenus: [
            {
              href: `${basePath}/master/customers`,
              label: "Data Customer",
              active: isActive(`${basePath}/master/customers`, pathname),
              disabled: role === "user",
            },
            {
              href: `${basePath}/master/supplier`,
              label: "Data Supplier",
              active: isActive(`${basePath}/master/supplier`, pathname),
              disabled: role === "user" || role === "pic",
            },
            {
              href: `${basePath}/master/products`,
              label: "Data Products",
              active: isActive(`${basePath}/master/products`, pathname),
              disabled: role === "user",
            },
            {
              href: `${basePath}/master/karyawan`,
              label: "Data Employee",
              active: isActive(`${basePath}/master/karyawan`, pathname),
              disabled: role === "user" || role === "pic",
            },
            {
              href: `${basePath}/master/team`,
              label: "Data Team",
              active: isActive(`${basePath}/master/team`, pathname),
              disabled: role === "user",
            },
            {
              href: `${basePath}/master/coa`,
              label: "Chart Of Account",
              active: isActive(`${basePath}/master/coa`, pathname),
              disabled: role === "user" || role === "pic",
            },
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
              active: isActive("#", pathname),
            },
            {
              href: "#",
              label: "Panduan Penggunaan",
              active: isActive("#", pathname),
            },
            {
              href: "#",
              label: "Kontak Admin",
              active: isActive("#", pathname),
            },
          ],
        },
      ],
    },
  ];

  // Filter menu berdasarkan role
  const filteredMenus = allMenus
    .filter((group) => group.allowedRoles.includes(role))
    .map((group) => ({
      ...group,
      menus: group.menus
        .filter((menu) => !menu.disabled)
        .map((menu) => ({
          ...menu,
          active:
            isActive(menu.href, pathname) ||
            menu.submenus.some((sub) => isActive(sub.href, pathname)),
          submenus: menu.submenus
            .filter((sub) => !sub.disabled)
            .map((submenu) => ({
              ...submenu,
              active: isActive(submenu.href, pathname),
            })),
        })),
    }));

  return filteredMenus;
}
