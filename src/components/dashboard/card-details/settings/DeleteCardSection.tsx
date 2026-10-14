"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  checkLocalCardExist,
  deleteBusinessCard,
  deleteDatabaseBusinessCard,
} from "@/utils/cardStorage";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

export function DeleteCardSection({
  cardId,
  handleDelete: parentHandleDelete,
}) {
  const handleDelete = async () => {
    try {
      if (checkLocalCardExist(cardId)) {
        console.log("cardId", cardId);
        deleteBusinessCard(cardId);
      } else {
        console.log("else", cardId);
        await deleteDatabaseBusinessCard(cardId);
      }
      // const cardRef = doc(db, "businessCards", cardId);
      // await deleteDoc(cardRef);
      if (parentHandleDelete) parentHandleDelete();
      console.log("Card deleted successfully");
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-destructive">
            Delete Card
          </h3>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. This will permanently delete your
            card.
          </p>
          <Button variant="destructive" size="sm" onClick={parentHandleDelete}>
            Delete Card
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
