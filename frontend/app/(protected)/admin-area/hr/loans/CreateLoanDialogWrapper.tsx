"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import CreateLoanDialog from "@/components/hr/loan/CreateLoanDialog";

interface CreateLoanDialogWrapperProps {
  onSuccess?: () => void;
}

const CreateLoanDialogWrapper = ({ onSuccess }: CreateLoanDialogWrapperProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
        onClick={() => setOpen(true)}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Buat Pinjaman
      </Button>
      <CreateLoanDialog 
        open={open} 
        onOpenChange={setOpen} 
        onSuccess={onSuccess}
      />
    </>
  );
};

export default CreateLoanDialogWrapper;
