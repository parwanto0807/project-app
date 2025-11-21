import {
  Clock,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-100 text-gray-800 border-gray-300",
    icon: Clock,
  },
  REVISION_NEEDED: {
    label: "Revision Needed",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: AlertCircle,
  },
  SUBMITTED: {
    label: "Submitted",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: CheckCircle,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: ThumbsUp,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: ThumbsDown,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    icon: CheckCircle,
  },
} as const;

export const STATUS_APPROVE_CONFIG = {
  PENDING: {
    label: "Menunggu Pencairan",
    color: "bg-yellow-200 text-yellow-900 border-yellow-400",
  },
  APPROVED: {
    label: "Disetujui",
    color: "bg-blue-200 text-blue-900 border-blue-400",
  },
  DISBURSED: {
    label: "Sudah Dicairkan",
    color: "bg-blue-200 text-blue-900 border-blue-400",
  },
  SETTLED: {
    label: "On LPP",
    color: "bg-green-200 text-green-900 border-green-400",
  },
  REJECTED: {
    label: "Ditolak",
    color: "bg-red-200 text-red-900 border-red-400",
  },
  DEFAULT: {
    label: "On Progress",
    color: "bg-gray-200 text-gray-900 border-gray-400",
  },
} as const;

export const PERCENTAGE_COLORS = {
  full: "bg-green-300 text-green-900 border-green-500",
  high: "bg-green-200 text-green-900 border-green-400",
  medium: "bg-yellow-200 text-yellow-900 border-yellow-400",
  low: "bg-blue-200 text-blue-900 border-blue-400",
  zero: "bg-gray-200 text-gray-900 border-gray-400",
} as const;

export const PAGE_SIZES = [10, 50, 100, 200, 300] as const;

export const PATH_CONFIG = {
  super: {
    base: "/super-admin-area/logistic/pr",
    create: "/super-admin-area/logistic/lpp/create/",
    edit: "/super-admin-area/logistic/lpp/edit/",
  },
  pic: {
    base: "/pic-area/logistic/pr",
    create: "/pic-area/logistic/lpp/create/",
    edit: "/pic-area/logistic/lpp/edit/",
  },
  admin: {
    base: "/admin-area/logistic/pr",
    create: "/admin-area/logistic/lpp/create/",
    edit: "/admin-area/logistic/lpp/edit/",
  },
} as const;
