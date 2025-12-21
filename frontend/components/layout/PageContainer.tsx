import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PageContainerProps {
    children: React.ReactNode;
    scrollable?: boolean;
}

export default function PageContainer({
    children,
    scrollable = false,
}: PageContainerProps) {
    return (
        <>
            {scrollable ? (
                <ScrollArea className="h-[calc(100vh-52px)]">
                    <div className="h-full w-full">{children}</div>
                </ScrollArea>
            ) : (
                <div className="h-[calc(100vh-52px)] w-full">{children}</div>
            )}
        </>
    );
}
