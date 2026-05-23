import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  // Group photos by itemName
  const groupedByItem: Record<string, MapPhoto[]> = {};
  photos.forEach(photo => {
    const key = photo.itemName || "Laporan Umum";
    if (!groupedByItem[key]) groupedByItem[key] = [];
    groupedByItem[key].push(photo);
  });
  
  const groupedByItemEntries = Object.entries(groupedByItem).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 md:p-6 pb-2 border-b shrink-0">
          <DialogTitle className="text-lg font-bold">
            Lokasi Laporan Lapangan - {spkNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 md:p-6 pt-4 flex-1 overflow-hidden flex flex-col lg:flex-row gap-4">
          {photos.length === 0 ? (
            <div className="w-full h-40 flex items-center justify-center text-gray-500 border rounded-lg border-dashed">
              Tidak ada data lokasi untuk SPK ini.
            </div>
          ) : (
            <>
              {/* Map Column */}
              <div className="w-full lg:w-2/3 shrink-0 rounded-lg overflow-hidden h-[400px] sm:h-[500px]">
                <MapComponent photos={photos} />
              </div>
              
              {/* List Column */}
              <div className="w-full lg:w-1/3 flex flex-col bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="p-3 border-b font-semibold text-sm bg-white dark:bg-gray-800 rounded-t-lg shrink-0">
                  Daftar Titik Koordinat ({photos.length})
                </div>
                <div className="flex-1 p-3 overflow-y-auto max-h-[400px] sm:max-h-[500px] custom-scrollbar">
                  <Accordion type="multiple" className="w-full flex flex-col gap-2">
                    {groupedByItemEntries.map(([itemName, itemPhotos], idx) => (
                      <AccordionItem value={`item-${idx}`} key={idx} className="border rounded-md bg-white dark:bg-gray-800 px-3 shadow-sm border-b-0">
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center text-sm font-semibold text-gray-800 dark:text-gray-200 text-left">
                            <span className="line-clamp-2">{itemName}</span>
                            <span className="text-gray-500 text-xs ml-2 shrink-0">({itemPhotos.length})</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-3">
                          <div className="flex flex-col gap-2">
                            <TooltipProvider delayDuration={200}>
                              {itemPhotos.map((photo, pIdx) => (
                                <Tooltip key={pIdx}>
                                  <TooltipTrigger asChild>
                                    <div className="flex flex-col p-3 bg-gray-50 dark:bg-gray-900/50 rounded border hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer text-left">
                                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex justify-between items-start gap-2">
                                        <span>{photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}</span>
                                      </span>
                                      <span className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                                        {photo.caption || "Foto Laporan Lapangan"}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent 
                                    side="left" 
                                    sideOffset={10} 
                                    className="p-1 bg-white border shadow-xl w-64 z-[100]"
                                  >
                                    <div className="flex flex-col gap-2">
                                      {photo.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img 
                                          src={photo.imageUrl} 
                                          alt="Preview" 
                                          className="w-full h-auto rounded object-cover" 
                                          style={{ maxHeight: "200px" }}
                                        />
                                      ) : (
                                        <div className="w-full h-32 flex items-center justify-center bg-gray-100 text-gray-400 text-xs rounded">
                                          No Image Available
                                        </div>
                                      )}
                                      <div className="flex flex-col gap-0.5 px-1 pb-1">
                                        <p className="text-[11px] text-center font-bold text-blue-600 dark:text-blue-400">
                                          {itemName}
                                        </p>
                                        <p className="text-xs text-center font-medium text-gray-700">
                                          {photo.caption || "Foto Laporan"}
                                        </p>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </TooltipProvider>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
