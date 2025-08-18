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
      allowedRoles: ["super", "admin", "pic", "user"],
      menus: [
        {
          label: "Sales Management",
          href: "/sales",
          icon: CreditCardIcon,
          active: isActive("/sales", pathname),
          submenus: [
            {
              href: "/super-admin-area/sales/salesOrder",
              label: "Sales Order",
              active: isActive("/super-admin-area/sales/salesOrder", pathname),
              disabled: role === "user" || role === "pic"
            },
            // {
            //   href: "/ipl/tagihan",
            //   label: "Daftar Tagihan",
            //   active: isActive("/ipl/tagihan", pathname),
            // },
            // {
            //   href: "/ipl/laporan",
            //   label: "Laporan",
            //   active: isActive("/ipl/laporan", pathname),
            //   disabled: role === "user"
            // },
            // {
            //   href: "/ipl/rekening",
            //   label: "Rekening Pembayaran",
            //   active: isActive("/ipl/rekening", pathname),
            //   disabled: role === "user"
            // },
            // {
            //   href: "/ipl/riwayat",
            //   label: "Riwayat Pembayaran",
            //   active: isActive("/ipl/riwayat", pathname),
            // },
          ],
        },
        // {
        //   label: "Tagihan Saya",
        //   href: "/tagihan-saya",
        //   icon: FileTextIcon,
        //   active: isActive("/tagihan-saya", pathname),
        //   submenus: [],
        //   disabled: role === "super" || role === "admin"
        // },
        // {
        //   label: "Pembayaran",
        //   href: "/pembayaran",
        //   icon: WalletIcon,
        //   active: isActive("/pembayaran", pathname),
        //   submenus: [
        //     {
        //       href: "/pembayaran/baru",
        //       label: "Bayar Tagihan",
        //       active: isActive("/pembayaran/baru", pathname),
        //     },
        //     {
        //       href: "/pembayaran/konfirmasi",
        //       label: "Konfirmasi Pembayaran",
        //       active: isActive("/pembayaran/konfirmasi", pathname),
        //     },
        //   ],
        //   disabled: role === "super" || role === "admin"
        // },
      ],
    },
    // {
    //   groupLabel: "MANAJEMEN PERUMAHAN",
    //   allowedRoles: ["super", "admin"],
    //   menus: [
    //     {
    //       label: "Data Cluster",
    //       href: "/cluster",
    //       icon: BuildingIcon,
    //       active: isActive("/cluster", pathname),
    //       submenus: [
    //         {
    //           href: "/cluster/user",
    //           label: "Data user",
    //           active: isActive("/users/user", pathname),
    //         },
    //         {
    //           href: "/cluster/blok",
    //           label: "Blok Perumahan",
    //           active: isActive("/cluster/blok", pathname),
    //         },
    //         {
    //           href: "/cluster/rumah",
    //           label: "Data Rumah",
    //           active: isActive("/cluster/rumah", pathname),
    //         },
    //       ],
    //     },
    //     {
    //       label: "Tarif IPL",
    //       href: "/tarif-ipl",
    //       icon: LandmarkIcon,
    //       active: isActive("/tarif-ipl", pathname),
    //       submenus: [
    //         {
    //           href: "/tarif-ipl/kelompok",
    //           label: "Kelompok Tarif",
    //           active: isActive("/tarif-ipl/kelompok", pathname),
    //         },
    //         {
    //           href: "/tarif-ipl/penyesuaian",
    //           label: "Penyesuaian Tarif",
    //           active: isActive("/tarif-ipl/penyesuaian", pathname),
    //         },
    //       ],
    //     },
    //   ],
    // },
    // {
    //   groupLabel: "KOMUNIKASI",
    //   allowedRoles: ["super", "admin", "pic", "warga"],
    //   menus: [
    //     {
    //       label: "Pengumuman",
    //       href: "/announcements",
    //       icon: BellIcon,
    //       active: isActive("/announcements", pathname),
    //       submenus: [],
    //     },
    //     {
    //       label: "Forum Diskusi",
    //       href: "/forum",
    //       icon: MessageSquareIcon,
    //       active: isActive("/forum", pathname),
    //       submenus: [
    //         {
    //           href: "/forum/umum",
    //           label: "Forum Umum",
    //           active: isActive("/forum/umum", pathname),
    //         },
    //         {
    //           href: "/forum/keluhan",
    //           label: "Keluhan & Aspirasi",
    //           active: isActive("/forum/keluhan", pathname),
    //         },
    //       ],
    //     },
    //     {
    //       label: "Pemberitahuan",
    //       href: "/notifications",
    //       icon: AlertCircleIcon,
    //       active: isActive("/notifications", pathname),
    //       submenus: [],
    //     },
    //   ],
    // },
    // {
    //   groupLabel: "KEGIATAN",
    //   allowedRoles: ["super", "admin", "pic", "warga"],
    //   menus: [
    //     {
    //       label: "Kalender Kegiatan",
    //       href: "/events",
    //       icon: CalendarIcon,
    //       active: isActive("/events", pathname),
    //       submenus: [
    //         {
    //           href: "/events/rutin",
    //           label: "Kegiatan Rutin",
    //           active: isActive("/events/rutin", pathname),
    //         },
    //         {
    //           href: "/events/khusus",
    //           label: "Kegiatan Khusus",
    //           active: isActive("/events/khusus", pathname),
    //         },
    //       ],
    //     },
    //     {
    //       label: "Keamanan Lingkungan",
    //       href: "/security",
    //       icon: ClipboardListIcon,
    //       active: isActive("/security", pathname),
    //       submenus: [],
    //     },
    //   ],
    // },
    // {
    //   groupLabel: "ANALITIK",
    //   allowedRoles: ["super", "admin", "pic"],
    //   menus: [
    //     {
    //       label: "Statistik",
    //       href: "/analytics",
    //       icon: BarChart2Icon,
    //       active: isActive("/analytics", pathname),
    //       submenus: [
    //         {
    //           href: "/analytics/pembayaran",
    //           label: "Pembayaran IPL",
    //           active: isActive("/analytics/pembayaran", pathname),
    //         },
    //         {
    //           href: "/analytics/warga",
    //           label: "Partisipasi Warga",
    //           active: isActive("/analytics/warga", pathname),
    //         },
    //       ],
    //     },
    //   ],
    // },
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
          href: "/audit-log",
          icon: FileSearchIcon,
          active: isActive("/audit-log", pathname),
          submenus: [],
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
    }
  ];

  // Filter menu berdasarkan role
  const filteredMenus = allMenus
    .filter((group) => group.allowedRoles.includes(role))
    .map((group) => ({
      ...group,
      menus: group.menus
        .filter(menu => !menu.disabled)
        .map((menu) => ({
          ...menu,
          active: isActive(menu.href, pathname) || menu.submenus.some(sub => isActive(sub.href, pathname)),
          submenus: menu.submenus
            .filter(sub => !sub.disabled)
            .map((submenu) => ({
              ...submenu,
              active: isActive(submenu.href, pathname),
            })),
        })),
    }));

  return filteredMenus;
}