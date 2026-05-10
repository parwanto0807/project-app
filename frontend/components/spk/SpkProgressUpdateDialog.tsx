"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Loader2, MessageSquare, BarChart2, Clock, User as UserIcon } from "lucide-react";
import { updateSpkProgressComment, getSpkProgressLogs } from "@/lib/action/master/spk/spk";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface ProgressLog {
  id: string;
  progress: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

interface SpkProgressUpdateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  spkId: string;
  spkNumber: string;
  projectName: string;
  teamName: string;
  customerName: string;
  spkDate: string | Date;
  currentProgress: number;
  userId?: string;
  onSuccess: () => void;
}

export function SpkProgressUpdateDialog({
  isOpen,
  onOpenChange,
  spkId,
  spkNumber,
  projectName,
  teamName,
  customerName,
  spkDate,
  currentProgress,
  userId,
  onSuccess,
}: SpkProgressUpdateDialogProps) {
  const [comment, setComment] = useState(""); // Default empty for new comment
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setComment(""); // Reset comment field when opening
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const data = await getSpkProgressLogs(spkId);
      setLogs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error("Silakan masukkan komentar update");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSpkProgressComment(spkId, {
        progress: currentProgress, // Send current progress as is
        progressComment: comment,
        userId: userId,
      });
      toast.success("Progress monitoring berhasil diperbarui");
      setComment("");
      onSuccess();
      fetchLogs(); // Refresh history
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-none shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <BarChart2 className="h-6 w-6" />
            Monitoring Progress SPK
          </DialogTitle>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-blue-100 text-[11px]">
            <p>No. SPK: <span className="font-semibold text-white">{spkNumber}</span></p>
            <p>Tanggal: <span className="font-semibold text-white">{new Date(spkDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</span></p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* SPK Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Customer</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{customerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Project</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{projectName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Team Pelaksana</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{teamName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Progress Saat Ini</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${currentProgress}%` }} />
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{currentProgress}%</span>
                </div>
              </div>
            </div>

            {/* Input Section */}
            <div className="space-y-4 bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              {/* Comment Area */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Kirim Update Monitoring
                </Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ketik kondisi terbaru di sini..."
                  className="min-h-[80px] resize-none border-gray-200 dark:border-gray-700 focus:ring-blue-500 rounded-xl"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !comment.trim()}
                    size="sm"
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Kirim Update"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* History Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold text-sm border-b pb-2">
                <Clock className="h-4 w-4" />
                Riwayat Monitoring
              </div>

              <ScrollArea className="h-[250px] pr-4">
                {isLoadingLogs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm italic">
                    Belum ada riwayat monitoring.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Avatar className="h-8 w-8 mt-0.5 border border-gray-100">
                          <AvatarImage src={log.user.avatar} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-[10px]">
                            {log.user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1.5 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-800">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {log.user.name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: localeId })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-md">
                              {log.progress}%
                            </span>
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                              {log.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t flex-shrink-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-xl text-gray-500 hover:bg-gray-100"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
