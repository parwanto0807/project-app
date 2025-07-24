"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { Header } from "./header";
import { BackButton } from "@/components/auth/back-button";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  subHeaderLabel?: string;
  backButtonLabel?: string;
  backButtonHref?: string;
  showSocial?: boolean;
  className?: string;
};

export const CardWrapper = ({
  children,
  headerLabel,
  subHeaderLabel,
  backButtonLabel = "",
  backButtonHref = "/auth/login",
  showSocial,
  className = ""
}: CardWrapperProps) => {
  return (
    <Card className={`w-full min-w-[320px] max-w-[500px] md:max-w-[550px] shadow-md rounded-xl border ${className}`}>
      <CardHeader className="space-y-3 px-6 sm:px-8 pt-8 pb-4">
        <Header label={headerLabel} />
        {subHeaderLabel && (
          <p className="text-sm text-muted-foreground text-center">
            {subHeaderLabel}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="px-6 sm:px-8 py-4">
        {children}
      </CardContent>
      
      {(backButtonLabel || showSocial) && (
        <CardFooter className="flex flex-col gap-4 px-6 sm:px-8 pb-8 pt-0">
          {showSocial && (
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
          )}
          {backButtonLabel && (
            <BackButton
              label={backButtonLabel}
              href={backButtonHref}
              className="mt-2"
            />
          )}
        </CardFooter>
      )}
    </Card>
  );
};