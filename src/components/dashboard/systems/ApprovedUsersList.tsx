import { useState, useEffect } from "react";
import { db } from "@/services/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Edit2,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface MonetizationRequest {
  id: string;
  userId: string;
  userName: string;
  email: string;
  referralNumber: string;
  paypalAccount?: string;
  status: string;
  createdAt: string;
}

export const ApprovedUsersList = () => {
  const [approvedUsers, setApprovedUsers] = useState<MonetizationRequest[]>([]);
  const [editingUser, setEditingUser] = useState<MonetizationRequest | null>(
    null
  );
  const [paypalAccount, setPaypalAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState({
    lastDoc: null as any,
    firstDoc: null as any,
  });
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);

  const { showToast } = useToast();

  const PAGE_SIZE = 5; // Adjust per page count

  // === Fetch approved users with pagination ===
  const fetchApprovedUsers = async (
    direction: "next" | "prev" | "first" = "first"
  ) => {
    try {
      setLoading(true);
      let q;

      const baseQuery = query(
        collection(db, "monetized"),
        where("status", "==", "active")
      );

      if (direction === "next" && pageInfo.lastDoc) {
        q = query(baseQuery, startAfter(pageInfo.lastDoc), limit(PAGE_SIZE));
      } else if (direction === "prev" && pageInfo.firstDoc) {
        q = query(
          baseQuery,
          endBefore(pageInfo.firstDoc),
          limitToLast(PAGE_SIZE)
        );
      } else {
        q = query(baseQuery, limit(PAGE_SIZE));
      }

      const snapshot = await getDocs(q);
      const users: MonetizationRequest[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<MonetizationRequest, "id">),
      }));

      if (users.length > 0) {
        setPageInfo({
          firstDoc: snapshot.docs[0],
          lastDoc: snapshot.docs[snapshot.docs.length - 1],
        });
      }

      setIsPrevDisabled(direction === "first" || snapshot.docs.length === 0);
      setIsNextDisabled(snapshot.docs.length < PAGE_SIZE);

      setApprovedUsers(users);
    } catch (error) {
      console.error("Error fetching approved users:", error);
      showToast("Unable to load approved users. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedUsers("first");
  }, []);

  const handleEditClick = (user: MonetizationRequest) => {
    setEditingUser(user);
    setPaypalAccount(user.paypalAccount || "");
  };

  // === Update PayPal in Firestore ===
  const handleSavePayPal = async () => {
    if (!editingUser) return;
    if (!paypalAccount.trim()) {
      showToast("Please enter a valid PayPal account email.", "error");
      return;
    }

    try {
      const monetizedRef = doc(db, "monetized", editingUser.id);
      await updateDoc(monetizedRef, { paypalAccount: paypalAccount.trim() });

      setApprovedUsers((prev) =>
        prev.map((user) =>
          user.id === editingUser.id
            ? { ...user, paypalAccount: paypalAccount.trim() }
            : user
        )
      );

      showToast(
        `PayPal account updated for ${editingUser.userName}`,
        "success"
      );
      setEditingUser(null);
      setPaypalAccount("");
    } catch (error) {
      console.error("Error updating PayPal account:", error);
      showToast("Failed to update PayPal account. Please try again.", "error");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Approved Monetization Users</CardTitle>
          </div>
          <CardDescription>
            Manage PayPal accounts for users with active monetization
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading users...</p>
            </div>
          ) : approvedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No approved users yet.</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ref #</TableHead>
                      <TableHead>PayPal Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.userName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {user.referralNumber}
                          </code>
                        </TableCell>
                        <TableCell>
                          {user.paypalAccount ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {user.paypalAccount}
                            </code>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Not set
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleEditClick(user)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit2 className="mr-2 h-3 w-3" />
                            Edit PayPal
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Buttons */}
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchApprovedUsers("prev")}
                  disabled={isPrevDisabled}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fetchApprovedUsers("next")}
                  disabled={isNextDisabled}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit PayPal Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit PayPal Account</DialogTitle>
            <DialogDescription>
              Update the PayPal account for {editingUser?.userName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paypal">PayPal Account Email</Label>
              <Input
                id="paypal"
                type="email"
                placeholder="user@paypal.com"
                value={paypalAccount}
                onChange={(e) => setPaypalAccount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the PayPal email address for payment transfers
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSavePayPal}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
