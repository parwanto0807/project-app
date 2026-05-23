import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { MapPhoto } from "./SpkMapComponent";

// Dynamically import the MapComponent with ssr disabled
// This prevents Next.js from throwing window is not defined errors for leaflet
const MapComponent = dynamic(() => import("./SpkMapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] sm:h-[500px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-pulse">
      <span className="text-gray-500 dark:text-gray-400 font-medium">Memuat Peta...</span>
    </div>
  ),
});

interface SpkMapDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  photos: MapPhoto[];
  spkNumber: string;
}

export function SpkMapDialog({ isOpen, onOpenChange, photos, spkNumber }: SpkMapDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-4 md:p-6 pb-2 border-b">
          <DialogTitle className="text-lg font-bold">
            Lokasi Laporan Lapangan - {spkNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 md:p-6 pt-2">
          {photos.length === 0 ? (
            <div className="w-full h-40 flex items-center justify-center text-gray-500 border rounded-lg border-dashed">
              Tidak ada data lokasi untuk SPK ini.
            </div>
          ) : (
            <MapComponent photos={photos} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
