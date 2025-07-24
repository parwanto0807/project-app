import {
  Sheet,
  SheetHeader,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "@/components/admin-panel/menu";

type SheetMenuProps = {
  role: "super" | "admin" | "pic" | "user";
};

export function SheetMenu({ role }: SheetMenuProps) {
  console.log("SheetMenu role:", role);
  return (
    <Sheet>
      <SheetTrigger className="lg:hidden" asChild>
        <Button className="h-8" variant="outline" size="icon">
          <MenuIcon size={20} />
        </Button>
      </SheetTrigger>

      <SheetContent className="sm:w-72 px-3 h-full flex flex-col" side="left">
        <SheetHeader>
          <Button
            className="flex justify-center items-center pb-2 pt-1"
            variant="link"
            asChild
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/LogoMd.png"
                alt="IPL Cluster"
                width={200}
                height={100}
                className="w-auto h-auto"
              />
            </Link>
          </Button>

          <SheetTitle className="text-orange-600">
            {/* IPL Cluster Taman Marunda */}
          </SheetTitle>
          <SheetDescription>
            A Trusted Platform for Construction Project Orders.
          </SheetDescription>
        </SheetHeader>

        <Menu isOpen role={role} />
      </SheetContent>
    </Sheet>
  );
}
