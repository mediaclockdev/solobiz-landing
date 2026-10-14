"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export function ActivationRequests() {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Load pending requests from Firestore
  const loadRequests = async () => {
    try {
      const q = query(
        collection(db, "monetized"),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      //console.log("Data", data);
      setRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast({
        title: "Error",
        description: "Failed to load requests.",
        variant: "destructive",
      });
    }
  };

  // Approve a specific request
  const handleApprove = async (request: any) => {
    try {
      const monetizedRef = doc(db, "monetized", request.id);

      await updateDoc(monetizedRef, {
        status: "active",
        activatedAt: new Date().toISOString(),
      });

      showToast(
        `${request.userName}'s monetization has been activated.`,
        "success"
      );

      loadRequests();
    } catch (error) {
      showToast("Failed to approve request. Please try again.", "error");
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  return (
    <Card className="hover:border-gray-400 card-hover">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-base">Monetization Activation List</span>
          {requests.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {requests.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>Activation Required</span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4">
            {requests.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No pending activation requests
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <Card
                    key={request.id}
                    className="border-orange-200 bg-orange-50/50"
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Name:</span>
                            <p className="text-muted-foreground">
                              {request.userName}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Email:</span>
                            <p className="text-muted-foreground">
                              {request.email}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Ref #:</span>
                            <p className="text-muted-foreground">
                              {request.referralNumber}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">PayPal Account:</span>
                            <p className="text-muted-foreground font-semibold">
                              {request.paypalAccount}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            Requested:{" "}
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(request)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            APPROVE REQUEST
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
