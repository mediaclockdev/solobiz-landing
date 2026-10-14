"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import { PaymentDueUsersList } from "./PaymentDueUsersList";

interface PaymentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setLoadDataLoading: (v: boolean) => void;
  loadDataLoading: boolean;
}

export const PaymentDetailDialog = ({
  open,
  onOpenChange,
  setLoadDataLoading,
  loadDataLoading,
}: PaymentDetailDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-5xl w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
        {/* Close Icon */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-md p-1 
                     text-muted-foreground hover:text-foreground 
                     hover:bg-accent transition"
        >
          <X className="w-5 h-5" />
        </button>
        {/* <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Current Payment List
          </DialogTitle>

          <DialogDescription className="space-y-1">
            <div className="text-lg font-semibold text-foreground">
              # January
            </div>
            <div>Current month payment details</div>
          </DialogDescription>
        </DialogHeader> */}

        {/* Inject your component here */}
        <div className="mt-4">
          <PaymentDueUsersList
            open={open}
            onOpenChange={onOpenChange}
            setLoadDataLoading={setLoadDataLoading}
            loadDataLoading={loadDataLoading}
          />
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
