"use client";
import { BusinessCard } from "@/types/businessCard";
import { CardNameSection } from "../settings/CardNameSection";
import { QRCodeLogoSection } from "../settings/QRCodeLogoSection";
import { EmailSignatureSection } from "../settings/EmailSignatureSection";
import { RenewLinkSection } from "../settings/RenewLinkSection";
import { TrackingCodeSection } from "../settings/TrackingCodeSection";
import { DeleteCardSection } from "../settings/DeleteCardSection";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  checkLocalCardExist,
  deleteBusinessCard,
  deleteDatabaseBusinessCard,
} from "@/utils/cardStorage";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";

interface SettingsTabProps {
  card: BusinessCard;
  cardId: string;
  qrCodeUrl: string;
  onLogoChange?: (logoFile: File | null) => void;
  onQRCodeUpdate?: (newQRCodeUrl: string) => void;
}

export function SettingsTab({
  card,
  cardId,
  qrCodeUrl,
  onLogoChange,
  onQRCodeUpdate,
}: SettingsTabProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const handleConfirmDelete = () => {
    if (user) {
      if (checkLocalCardExist(cardId)) {
        deleteBusinessCard(cardId);
      } else {
        deleteDatabaseBusinessCard(cardId);
      }
      showToast("Card deleted successfully.", "success");
      setTimeout(() => router.replace("/dashboard/cards"), 1000);
    } else {
      deleteBusinessCard(cardId);
      setTimeout(() => router.replace("/dashboard/cards"), 100);
    }

    // ✅ close dialog after everything
    setShowDeleteDialog(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };
  return (
    <div className="space-y-4">
      <CardNameSection card={card} />
      <QRCodeLogoSection
        card={card}
        qrCodeUrl={qrCodeUrl}
        onLogoChange={onLogoChange}
        onQRCodeUpdate={onQRCodeUpdate}
      />
      <EmailSignatureSection card={card} />
      <RenewLinkSection cardId={cardId} card={card} />
      <TrackingCodeSection cardId={cardId} card={card} />
      <DeleteCardSection cardId={cardId} handleDelete={handleDelete} />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {card
                ? `${card.profile.firstName} ${card.profile.lastName}`
                : "this card"}
              "? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
