import {
  HomeIcon,
  SettingsIcon,
  CreditCardIcon,
  UsersIcon,
  // FileTextIcon,
  // BellIcon,
  // MessageSquareIcon,
  // CalendarIcon,
  HelpCircleIcon,
  // LandmarkIcon,
  FileSearchIcon,
  // WalletIcon,
  // BuildingIcon,
  // ClipboardListIcon,
  // AlertCircleIcon,
  // BarChart2Icon,
  LucideIcon,
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
  const basePath = role === "super" ? "/super-admin-area" : "/admin-area";
  const allMenus: MenuGroup[] = [
    {
      groupLabel: "DASHBOARD SUPER ADMIN",
      allowedRoles: ["super"],
      menus: [
        {
          label: "Dashboard Super Admin",
          href: "/super-admin-area",
          icon: HomeIcon,
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
          icon: HomeIcon,
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
          icon: HomeIcon,
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
          icon: HomeIcon,
          active: isActive("/user-area", pathname),
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "SALES",
      allowedRoles: ["super", "admin"], // cukup gabung di sini
      menus: [
        {
          label: "Sales Management",
          href: "/sales",
          icon: CreditCardIcon,
          active: isActive("/sales", pathname),
          submenus: [
            {
              href: `${basePath}/sales/salesOrder`,
              label: "Sales Order",
              active: isActive(`${basePath}/sales/salesOrder`, pathname),
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
          icon: UsersIcon,
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
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "PENGATURAN",
      allowedRoles: ["admin"],
      menus: [
        {
          label: "Master Data",
          href: "/admin-area/master",
          icon: UsersIcon,
          active: isActive("/admin-area/master", pathname),
          submenus: [
            {
              href: "/admin-area/master/customers",
              label: "Data Customer",
              active: isActive("/super-admin-area/master/customers", pathname),
            },
            {
              href: "/admin-area/master/products",
              label: "Data Products",
              active: isActive("/admin-area/master/products", pathname),
            },
          ],
        },
      ],
    },
    {
      groupLabel: "BANTUAN",
      allowedRoles: ["super", "admin", "pic", "warga"],
      menus: [
        {
          label: "Pusat Bantuan",
          href: "/help",
          icon: HelpCircleIcon,
          active: isActive("/help", pathname),
          submenus: [
            {
              href: "/help/faq",
              label: "FAQ",
              active: isActive("/help/faq", pathname),
            },
            {
              href: "/help/panduan",
              label: "Panduan Penggunaan",
              active: isActive("/help/panduan", pathname),
            },
            {
              href: "/help/kontak",
              label: "Kontak Admin",
              active: isActive("/help/kontak", pathname),
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
