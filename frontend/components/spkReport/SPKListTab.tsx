"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Users2Icon, Calendar, User, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface SPKData {
  id: string;
  spkNumber: string;
  clientName: string;
  projectName: string;
  status: 'PENDING' | 'PROGRESS' | 'COMPLETED';
  progress: number;
  deadline: string;
  assignedTo: string;
  teamName: string;
  email: string;
  items: {
    id: string;
    name: string;
    description?: string | null;
    qty: number;
    uom?: string | null;
    status: 'PENDING' | 'DONE';
    progress: number;
  }[];
}

interface SPKListTabProps {
  filteredUserSpk: SPKData[];
  selectedSpk: SPKData | null;
  setSelectedSpk: (spk: SPKData) => void;
  setActiveTab: (tab: 'list' | 'report' | 'history') => void;
  getSPKFieldProgress: (spk: SPKData) => number;
  role: string;
  userEmail: string;
}

const SPKListTab = ({
  filteredUserSpk,
  selectedSpk,
  setSelectedSpk,
  setActiveTab,
  getSPKFieldProgress,
  role,
  userEmail
}: SPKListTabProps) => {
  return (
    <Card className="border px-0 md:px-4 border-gray-200/60 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-0 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-gray-800 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg md:text-xl font-semibold flex items-center gap-2 rounded-xl text-gray-800 dark:text-white ">
              <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400 items-center justify-center" />
              {role === 'admin' || role === 'super' || role === 'pic' || role === 'user' ? 'Semua SPK' : 'SPK List'}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mt-0 rounded-xl">
              {role === 'admin' || role === 'super' || role === 'pic' || role === 'user'
                ? 'Klik SPK untuk memulai pelaporan'
                : 'Pilih SPK yang ditugaskan kepada Anda'}
            </CardDescription>
          </div>
          {filteredUserSpk.length > 0 && (
            <span className="inline-flex items-center px-1 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
              {filteredUserSpk.length} SPK
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2">
        {filteredUserSpk.length === 0 ? (
          <div className="text-center py-10 px-4 animate-fade-in">
            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Tidak ada SPK</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {role === 'admin' || role === 'super' || role === 'pic' || role === 'user'
                ? 'Tidak ada SPK yang terdaftar dalam sistem'
                : `Belum ada SPK yang ditugaskan untuk ${userEmail}`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredUserSpk.map((spk, index) => {
              const progress = getSPKFieldProgress(spk);
              const status = progress === 100 ? 'COMPLETED' : progress > 0 ? 'PROGRESS' : 'PENDING';

              const statusConfig = {
                COMPLETED: {
                  color: 'from-emerald-500 to-green-600',
                  badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                  gradient: 'from-emerald-50/80 via-white to-green-50/60 dark:from-emerald-900/20 dark:via-gray-800 dark:to-green-900/10',
                  icon: CheckCircle,
                  text: 'Selesai'
                },
                PROGRESS: {
                  color: progress > 75 ? 'from-blue-500 to-indigo-600' :
                    progress > 50 ? 'from-indigo-500 to-purple-600' :
                      progress > 25 ? 'from-amber-500 to-orange-600' : 'from-rose-500 to-pink-600',
                  badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                  gradient: 'from-blue-50/80 via-white to-indigo-50/60 dark:from-blue-900/20 dark:via-gray-800 dark:to-indigo-900/10',
                  icon: Clock,
                  text: 'Progress'
                },
                PENDING: {
                  color: 'from-gray-400 to-gray-600',
                  badge: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
                  gradient: 'from-gray-50/80 via-white to-slate-50/60 dark:from-gray-900/20 dark:via-gray-800 dark:to-slate-900/10',
                  icon: Clock,
                  text: 'Pending'
                }
              };

              const config = statusConfig[status];

              return (
                <motion.div
                  key={spk.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  whileHover={{
                    y: -4,
                    transition: { duration: 0.2 }
                  }}
                  className="relative"
                >
                  <div
                    onClick={() => {
                      if (progress === 100) {
                        toast.info("SPK sudah selesai, tidak dapat membuat laporan baru");
                        return;
                      }
                      setSelectedSpk(spk);
                      setActiveTab("report");
                    }}
                    className={cn(
                      "relative cursor-pointer transition-all duration-500 h-full rounded-2xl overflow-hidden group",
                      "border backdrop-blur-sm transform-gpu shadow-sm",
                      "hover:shadow-2xl hover:border-opacity-80",
                      selectedSpk?.id === spk.id && cn(
                        "border-indigo-500/80 dark:border-indigo-400/80 border-2",
                        "bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/90",
                        "dark:from-indigo-900/40 dark:via-gray-800 dark:to-blue-900/30",
                        "shadow-xl shadow-indigo-500/20 dark:shadow-indigo-400/10",
                        "ring-2 ring-indigo-500/20 dark:ring-indigo-400/20"
                      ),
                      selectedSpk?.id !== spk.id && cn(
                        "border-gray-200/60 dark:border-gray-600/60",
                        "bg-gradient-to-br from-white via-gray-50/50 to-white",
                        "dark:from-gray-800 dark:via-gray-800/90 dark:to-gray-800",
                        "hover:bg-gradient-to-br hover:from-blue-50/30 hover:via-white hover:to-indigo-50/30",
                        "dark:hover:from-blue-900/10 dark:hover:via-gray-800 dark:hover:to-indigo-900/10",
                        "hover:border-indigo-300/50 dark:hover:border-indigo-500/40"
                      ),
                      status === 'COMPLETED' && cn(
                        "border-emerald-200/60 dark:border-emerald-700/60",
                        "bg-gradient-to-br from-emerald-50/80 via-white to-green-50/80",
                        "dark:from-emerald-900/20 dark:via-gray-800 dark:to-green-900/10"
                      )
                    )}
                  >
                    <div className={cn(
                      "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-500",
                      config.color,
                      "group-hover:opacity-5"
                    )} />

                    <div className={cn(
                      "absolute top-0 left-0 w-1 h-full bg-gradient-to-b opacity-80",
                      config.color
                    )} />

                    <div className="relative p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 space-y-2">
                          <h3 className="text-xs md:text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                            {spk.spkNumber}
                          </h3>
                          <p className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">
                            {spk.clientName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight line-clamp-2">
                            {spk.projectName}
                          </p>
                        </div>

                        <div className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300",
                          config.badge,
                          "group-hover:scale-105"
                        )}>
                          <config.icon className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold whitespace-nowrap">
                            {config.text}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <Users2Icon className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="font-medium max-w-[100px] truncate">
                                {spk.teamName?.split('@')[0] || 'Team'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Progress
                            </span>
                            <span className={cn(
                              "text-sm font-bold px-2 py-1 rounded-full",
                              progress === 100
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : progress >= 75
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  : progress >= 50
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                    : progress >= 25
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                            )}>
                              {progress}%
                            </span>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, delay: index * 0.1 + 0.3, ease: "easeOut" }}
                              className={cn(
                                "h-full rounded-full bg-gradient-to-r shadow-inner",
                                config.color
                              )}
                            />
                          </div>

                          <div className="flex justify-between mt-1">
                            {[0, 25, 50, 75, 100].map((step) => (
                              <div
                                key={step}
                                className={cn(
                                  "w-1 h-1 rounded-full transition-all duration-300",
                                  progress >= step
                                    ? cn(
                                      "bg-gradient-to-r shadow-sm",
                                      config.color
                                    )
                                    : "bg-gray-300 dark:bg-gray-600"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-rose-500" />
                            <span className="font-medium">
                              {new Date(spk.deadline).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-medium max-w-[80px] truncate">
                            {spk.assignedTo?.split('@')[0] || 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-blue-500/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl" />
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100 group-active:bg-white/10 transition-opacity duration-200" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SPKListTab;