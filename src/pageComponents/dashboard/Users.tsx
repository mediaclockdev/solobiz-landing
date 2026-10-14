"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Pencil, Trash, Eye, Download, Search, X } from "lucide-react";
import { db } from "@/services/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, listAll, deleteObject } from "firebase/storage";
import { useToast } from "@/contexts/ToastContext";
import { Select } from "@/components/ui/select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const storage = getStorage();
  const [editUserData, setEditUserData] = useState({
    displayName: "",
    lastName: "",
    businessCategory: "",
    clientsPreference: "",
    companyName: "",
    status: "",
    role: "user", // default value
  });

  const usersPerPage = 25;
  const { showToast } = useToast();

  // Fetch users
  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const data = snapshot.docs.map(async (docSnap) => {
        const d = docSnap.data() as any;
        const userId = d.id;
        const cardsRef = collection(db, "cards");
        const q = query(
          cardsRef,
          where("uid", "==", userId),
          orderBy("createdAt", "desc"), // Assuming you have a createdAt timestamp
          limit(1)
        );
        const cardSnap = await getDocs(q);
        let latestCard = null;
        cardSnap.forEach((cardDoc) => {
          latestCard = { id: cardDoc.id, name: cardDoc.data().name };
        });

        return {
          id: docSnap.id,
          displayName: d.displayName || "",
          lastName: d.lastName || "",
          email: d.email || "",
          businessCategory: d.businessCategory || "",
          clientsPreference: d.clientsPreference || "",
          planType: d.planType || "",
          planName: d.planName || "",
          subscriptionStartDate: d.subscriptionStartDate || null,
          subscriptionEndDate: d.subscriptionEndDate || null,
          referralCode: d.referralCode || "",
          role: d.role || "User",
          companyName: d.companyName || "",
          status: d.status || "active",
          addons: d.addons || "",
          paymentId: d.paymentId || "",
          stripeCustomerId: d.stripeCustomerId || "",
          subscriptionId: d.subscriptionId || "",
          latestCardId: latestCard?.id || null,
          latestCardName: latestCard?.name || null,
        };
      });
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users by search
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(
    startIndex,
    startIndex + usersPerPage
  );

  // Edit user
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditUserData({
      displayName: user.displayName,
      lastName: user.lastName,
      businessCategory: user.businessCategory,
      clientsPreference: user.clientsPreference,
      companyName: user.companyName,
      status: user.status,
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, editUserData);
      showToast("User details updated successfully.", "success");
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  async function deleteFolderRecursive(...folderRefs: any[]) {
    for (const folderRef of folderRefs) {
      const list = await listAll(folderRef);

      // Delete all files in this folder
      await Promise.all(list.items.map((fileRef) => deleteObject(fileRef)));

      // Recursively delete subfolders
      await Promise.all(
        list.prefixes.map((subFolderRef) =>
          deleteFolderRecursive(subFolderRef),
        ),
      );
    }
  }

  const handleOpenDeleteDialog = (userObj: any) => {
    setUserToDelete(userObj);
    setIsDeleteDialogOpen(true);
  };

  const handleSoftDelete = async (userObj: any) => {
    if (!userObj?.id) return;
    setIsDeleting(true);

    try {
      const userId = userObj.id;
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        avatarUrl: "",
        status: "inactive",
        deletedAt: serverTimestamp(),
      });

      const cardsQuery = query(
        collection(db, "cards"),
        where("uid", "==", userId),
      );
      const querySnapshot = await getDocs(cardsQuery);
      const deleteCardPromises = querySnapshot.docs.map((cardDoc) =>
        deleteDoc(doc(db, "cards", cardDoc.id)),
      );
      await Promise.all(deleteCardPromises);

      const folderRef = ref(storage, `cards/${userId}/`);
      const userFolderRef = ref(storage, `avatars/${userId}/`);
      await deleteFolderRecursive(folderRef, userFolderRef);

      showToast(
        "User soft deleted (status set to Inactive, cards and storage cleaned).",
        "success",
      );
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      console.error("Error soft deleting user:", err);
      showToast("Failed to soft delete user.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermanentDelete = async (userObj: any) => {
    if (!userObj?.id) return;
    setIsDeleting(true);

    try {
      const userId = userObj.id;

      const cardsQuery = query(
        collection(db, "cards"),
        where("uid", "==", userId),
      );
      const querySnapshot = await getDocs(cardsQuery);
      const deleteCardPromises = querySnapshot.docs.map((cardDoc) =>
        deleteDoc(doc(db, "cards", cardDoc.id)),
      );
      await Promise.all(deleteCardPromises);

      const folderRef = ref(storage, `cards/${userId}/`);
      const userFolderRef = ref(storage, `avatars/${userId}/`);
      await deleteFolderRecursive(folderRef, userFolderRef);

      await deleteDoc(doc(db, "users", userId));

      showToast("User permanently deleted from database.", "success");
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      console.error("Error permanently deleting user:", err);
      showToast("Failed to permanently delete user from database.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle status
  const toggleStatus = async (user: any) => {
    try {
      const userRef = doc(db, "users", user.id);
      const newStatus = user.status === "active" ? "inactive" : "active";
      await updateDoc(userRef, { status: newStatus });
      showToast(`User status updated to ${newStatus}`, "success");
      fetchUsers();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // View user
  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  // Export CSV
  const exportToCSV = (usersData: any[]) => {
    if (!usersData.length) return;

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Business Category",
      "Clients Preference",
      "Company",
      "Plan Type",
      "Plan Name",
      "Subscription Start Date",
      "Subscription End Date",
      "Referral Code",
      "Role",
      "Status",
      "stripeCustomerId",
      "paymentId",
      "subscriptionId",
    ];

    // Helper: format Firestore or normal date
    const formatDate = (value: any) => {
      if (!value) return "";
      let dateObj;

      // Firestore Timestamp (has seconds field)
      if (value.seconds) {
        dateObj = new Date(value.seconds * 1000);
      }
      // Firestore Timestamp object (has toDate method)
      else if (typeof value.toDate === "function") {
        dateObj = value.toDate();
      }
      // ISO string or date string
      else if (typeof value === "string" || value instanceof Date) {
        dateObj = new Date(value);
      } else {
        return "";
      }

      if (isNaN(dateObj.getTime())) return "";

      // Format date nicely e.g., 7th October 2025
      const day = dateObj.getDate();
      const month = dateObj.toLocaleString("default", { month: "long" });
      const year = dateObj.getFullYear();

      const suffix =
        day % 10 === 1 && day !== 11
          ? "st"
          : day % 10 === 2 && day !== 12
          ? "nd"
          : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

      return `${day}${suffix} ${month} ${year}`;
    };

    const csvRows = [
      headers.join(","),
      ...usersData.map((user) =>
        [
          user.displayName,
          user.lastName,
          user.email,
          user.businessCategory,
          user.clientsPreference,
          user.companyName,
          user.planType,
          user.planName,
          formatDate(user.subscriptionStartDate),
          formatDate(user.subscriptionEndDate),
          user.referralCode,
          user.role,
          user.status,
          user.stripeCustomerId,
          user.paymentId,
          user.subscriptionId,
        ]
          .map((v) => `"${v ?? ""}"`)
          .join(",")
      ),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function formatDate(dateValue) {
    if (!dateValue) return "-";

    let dateObj;

    // Handle Firestore Timestamp or ISO string
    if (dateValue?.toDate) {
      dateObj = dateValue.toDate(); // Firestore timestamp
    } else {
      dateObj = new Date(dateValue);
    }

    if (isNaN(dateObj)) return "-";

    const day = dateObj.getDate();
    const month = dateObj.toLocaleString("default", { month: "long" });
    const year = dateObj.getFullYear();

    // Add ordinal suffix (st, nd, rd, th)
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";

    return `${day}${suffix} ${month} ${year}`;
  }

  //console.log("selectedUser", selectedUser);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-muted-foreground">
          Users [{users.length}]
        </h2>

        <div className="flex gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, title, company..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Export CSV Button */}
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => exportToCSV(filteredUsers)}
          >
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Table View */}
      <Card className="p-4 overflow-x-auto">
        {currentUsers.length === 0 ? (
          <div className="flex justify-center py-4">No users found.</div>
        ) : (
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-2 text-left">First Name</th>
                <th className="border p-2 text-left">Last Name</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Company</th>
                <th className="border p-2 text-left">Plan Type</th>
                <th className="border p-2 text-left">Referral Code</th>
                <th className="border p-2 text-left">Role</th>
                <th className="border p-2 text-center">Status</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border p-2">{user.displayName}</td>
                  <td className="border p-2">{user.lastName}</td>
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2">{user.companyName}</td>
                  <td className="border p-2">{user.planType}</td>
                  <td className="border p-2">{user.referralCode}</td>
                  <td className="border p-2">{user.role}</td>
                  <td className="border p-2 text-center">
                    <Badge
                      variant={
                        user.status === "active" ? "secondary" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleStatus(user)}
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="border p-2 text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUser(user)}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleOpenDeleteDialog(user)}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      {filteredUsers.length > usersPerPage && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <Label htmlFor="First-Name">First Name</Label>
              <Input
                className="mt-3"
                placeholder="First Name"
                value={editUserData.displayName}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    displayName: e.target.value,
                  })
                }
              />
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="Last-Name">Last Name</Label>
              <Input
                className="mt-3"
                placeholder="Last Name"
                value={editUserData.lastName}
                onChange={(e) =>
                  setEditUserData({ ...editUserData, lastName: e.target.value })
                }
              />
            </div>

            {/* Business Category */}
            <div>
              <Label htmlFor="business-category">Business Category</Label>
              <Select
                value={editUserData.businessCategory}
                onValueChange={(value) =>
                  setEditUserData({ ...editUserData, businessCategory: value })
                }
              >
                <SelectTrigger className="mt-3">
                  <SelectValue placeholder="Select Business Category" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "ARTS/MUSIC/WRITING",
                    "BANKING/FINANCE",
                    "BUSINESS MGT",
                    "COMMUNICATION",
                    "CONSTRUCTION",
                    "EDUCATION",
                    "ENGINEERING",
                    "ENTERTAINMENT",
                    "FARMING",
                    "GOV/POLITICS",
                    "HEALTHCARE",
                    "HOSPITALITY",
                    "IT/SOFTWARE",
                    "LEGAL",
                    "MANUFACTURING",
                    "MILITARY",
                    "NON-PROFIT",
                    "REAL ESTATE",
                    "RETAIL",
                    "SALES/MARKETING",
                    "SCIENCE/RESEARCH",
                    "SELF-EMPLOYED",
                    "STUDENT",
                    "TRANSPORTATION",
                    "RETIRED",
                    "OTHER",
                  ].map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clients Preference */}
            <div>
              <Label htmlFor="Clients-Preference">Clients Preference</Label>
              <Select
                value={editUserData.clientsPreference}
                onValueChange={(value) =>
                  setEditUserData({ ...editUserData, clientsPreference: value })
                }
              >
                <SelectTrigger className="mt-3">
                  <SelectValue placeholder="Select Clients Preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local Clients</SelectItem>
                  <SelectItem value="non-local">Non-Local Clients</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Name */}
            <div>
              <Label htmlFor="Company-Name">Company Name</Label>
              <Input
                className="mt-3"
                placeholder="Company Name"
                value={editUserData.companyName}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    companyName: e.target.value,
                  })
                }
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="Status">Status</Label>
              <Select
                value={editUserData.status}
                onValueChange={(value) =>
                  setEditUserData({ ...editUserData, status: value })
                }
              >
                <SelectTrigger className="mt-3">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="Role">Role</Label>
              <Select
                value={editUserData.role}
                onValueChange={(value) =>
                  setEditUserData({ ...editUserData, role: value })
                }
              >
                <SelectTrigger className="mt-3">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-2 mt-2">
              <div>
                <h1 className="font-bold underline mt-5 mb-2">
                  Personal Information:
                </h1>
                <p>
                  <strong>First Name:</strong> {selectedUser.displayName}
                </p>
                <p>
                  <strong>Last Name:</strong> {selectedUser.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedUser.email}
                </p>
              </div>
              <div>
                <h1 className="font-bold underline mt-5 mb-2">
                  Business Information:
                </h1>
                <p>
                  <strong>Business Category:</strong>{" "}
                  {selectedUser.businessCategory}
                </p>
                <p>
                  <strong>Clients Preference:</strong>{" "}
                  {selectedUser.clientsPreference}
                </p>
                <p>
                  <strong>Company:</strong> {selectedUser.companyName}
                </p>
              </div>

              {selectedUser.planType === "paid" && (
                <>
                  <div>
                    <h1 className="font-bold underline mt-5 mb-2">
                      Subscription Information:
                    </h1>
                    <p>
                      <strong>Payment Id:</strong> {selectedUser.paymentId}
                    </p>
                    <p>
                      <strong>Subscription Id:</strong>{" "}
                      {selectedUser.subscriptionId}
                    </p>
                    <p>
                      <strong>Stripe Customer Id:</strong>{" "}
                      {selectedUser.stripeCustomerId}
                    </p>
                    <p>
                      <strong>Plan Type:</strong> {selectedUser.planType}
                    </p>
                    <p>
                      <strong>Plan Name:</strong> {selectedUser.planName}
                    </p>
                    <p>
                      <strong>Subscription Start Date:</strong>{" "}
                      {formatDate(selectedUser.subscriptionStartDate)}
                    </p>
                    <p>
                      <strong>Subscription End Date:</strong>{" "}
                      {formatDate(selectedUser.subscriptionEndDate)}
                    </p>

                    {selectedUser?.planName?.toLowerCase() !== "free plan" &&
                      Array.isArray(selectedUser.addons) &&
                      selectedUser.addons.length > 0 && (
                        <>
                          {selectedUser.addons.map((addon, index) => (
                            <div key={index}>
                              <p>
                                <strong>Addons :</strong> {addon.name}
                                {"("}
                                {addon.price
                                  ? `$${addon.price} / ${
                                      addon.billing === "annual"
                                        ? "Yearly"
                                        : "Monthly"
                                    }`
                                  : ""}
                                {")"}
                              </p>
                            </div>
                          ))}
                        </>
                      )}
                  </div>
                </>
              )}

              <div>
                <h1 className="font-bold underline mt-5 mb-2">
                  Others Information:
                </h1>
                <p>
                  <strong>Referral Code:</strong> {selectedUser.referralCode}
                </p>
                <p>
                  <strong>Role:</strong> {selectedUser.role}
                </p>
                <p>
                  <strong>Status:</strong> {selectedUser.status}
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <Trash className="w-5 h-5" /> Delete User
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 text-sm text-gray-600 space-y-3">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {userToDelete?.displayName || userToDelete?.email || "this user"}
              </span>
              {userToDelete?.email && (
                <span className="text-gray-500 text-xs block">
                  ({userToDelete.email})
                </span>
              )}
              ?
            </p>
            <p className="text-xs text-muted-foreground">
              Please choose which delete option you want to perform:
            </p>

            <div className="space-y-2.5 pt-1">
              {/* Soft Delete Option Card */}
              <div className="p-3 border rounded-lg bg-gray-50 dark:bg-zinc-900/50 space-y-1">
                <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  1. Soft Delete (Deactivate)
                </div>
                <div className="text-xs text-muted-foreground">
                  Changes user status to <strong>Inactive</strong>. User record stays in the database.
                </div>
              </div>

              {/* Permanent Delete Option Card */}
              <div className="p-3 border border-red-200 bg-red-50/60 dark:bg-red-950/20 rounded-lg space-y-1">
                <div className="font-medium text-red-700 dark:text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  2. Permanent Delete
                </div>
                <div className="text-xs text-red-600/80 dark:text-red-400/80">
                  Completely and irreversibly removes this user from the Firebase database.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 justify-end border-t border-gray-100">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={isDeleting}
              onClick={() => handleSoftDelete(userToDelete)}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
            >
              {isDeleting ? "Processing..." : "Soft Delete"}
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => handlePermanentDelete(userToDelete)}
            >
              {isDeleting ? "Deleting..." : "Permanent Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
