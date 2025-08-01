// components/dialogs/mfa-registration-dialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useMfaSetup } from "@/hooks/use-mfa-setup"; // Import hook yang baru dibuat
import { useRouter } from "next/navigation";

type MfaDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onCancelRedirect?: () => void; // Make this optional
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

export function MfaRegistrationDialog({
  open,
  onOpenChange,
  onSuccess,
  title = "Aktifkan Autentikasi Dua Faktor",
  description = "🔐 Tambahkan lapisan keamanan ekstra ke akun Anda dengan mengaktifkan autentikasi dua faktor (2FA)",
  confirmText = "Aktifkan 2FA",
  cancelText = "Lewati",
}: MfaDialogProps) {
  const {
    step,
    isLoading,
    error,
    qrCode,
    secret,
    generateQrCode,
    reset,
  } = useMfaSetup();

  const router = useRouter();
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
    reset();
    router.push("/super-admin-area");
  }, 300);
    setTimeout(reset, 300); 
  };
  
  const handleContinue = () => {
    onSuccess();
    // handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-md p-0 overflow-hidden rounded-lg">
        {/* Konten dialog tidak berubah banyak, hanya penyesuaian padding dan event handler */}
        <div className="space-y-6 p-4 sm:p-6">
          <DialogHeader className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-1 text-center">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {step === "setup" ? title : "Set Up Authenticator App"}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {step === "setup" ? description : "Scan the QR code with your authenticator app"}
              </DialogDescription>
            </div>
          </DialogHeader>

          {step === "show-qr" ? (
            <div className="flex flex-col items-center gap-4">
              <Card className="p-4 w-full max-w-[240px]">
                {qrCode ? (
                  <div className="flex items-center justify-center">
                    <Image
                      src={qrCode}
                      alt="QR Code for MFA Setup"
                      className="rounded object-contain"
                      width={180}
                      height={180}
                      priority
                    />
                  </div>
                ) : (
                  <Skeleton className="h-[180px] w-full rounded-lg" />
                )}
              </Card>

              <Card className="w-full p-4">
                <div className="space-y-3">
                  <div className="text-center text-sm text-gray-600">
                    <p>Cant scan the QR code?</p>
                    <p className="mt-2 font-medium text-gray-900">Enter this code manually:</p>
                    {secret ? (
                      <Card className="mt-2 p-3 bg-gray-50">
                        <div className="font-mono tracking-widest text-sm text-center break-all">
                          {secret}
                        </div>
                      </Card>
                    ) : (
                      <Skeleton className="mt-2 h-10 w-full rounded-md" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 text-center px-2">
                    After scanning, enter the 6-digit code from your authenticator app in the next step.
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="flex gap-3 p-4 bg-yellow-50 border-yellow-200 text-center items-center">
              <AlertCircle className="mt-0.5 h-8 w-8 text-yellow-500 flex-shrink-0 text-center" />
              <div className="text-sm text-yellow-700">
                Untuk menjaga keamanan akun Anda, kami sangat menyarankan untuk mengaktifkan autentikasi dua faktor (2FA)
              </div>
            </Card>
          )}

          {error && (
            <Card className="p-3 bg-red-50 border-red-200">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </Card>
          )}
        </div>

        <DialogFooter className="px-4 sm:px-6 py-4 border-t bg-gray-50">
          <div className="flex w-full gap-3 flex-col sm:flex-row-reverse">
            {step === "setup" ? (
              <>
                <Button
                  onClick={generateQrCode}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {cancelText}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleContinue} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  Continue
                </Button>
                <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
