
import { cn } from "@/lib/utils"
import localFont from 'next/font/local'

const poppins = localFont({
  src: '../../public/fonts/Poppins-Regular.ttf',
  weight: '400',
  style: 'normal',
})

interface HeaderProps {
    label: string; 
};

export const Header = ({
    label,
}: HeaderProps) => {
  return (
    <div className="w-full flex flex-col gap-y-4 items-center justify-center">
        <h1 className={cn("text-3xl font-semibold", poppins.className)}>
            🔐 Login User
        </h1>
        <p className="text-muted-foreground text-sm">
            {label}
        </p>
    </div>
  )
}