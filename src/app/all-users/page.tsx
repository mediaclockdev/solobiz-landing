// ============================================================================
// COMMENTED OUT FOR FUNNEL-ONLY DEPLOYMENT:
// This repo only serves the welcome funnel (/, /login, /signup, /forgot).
// To restore this page, uncomment the code below.
// ============================================================================
// "use client";
// 
// import React, { useEffect, useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// } from "@/components/ui/pagination";
// import { Pencil, Trash, Eye, Download, Search, X } from "lucide-react";
// import { db } from "@/services/firebase";
// import {
//   collection,
//   getDocs,
//   doc,
//   updateDoc,
//   serverTimestamp,
//   deleteDoc,
//   query,
//   where,
//   orderBy,
//   limit,
//   getDoc,
// } from "firebase/firestore";
// import { useToast } from "@/contexts/ToastContext";
// import { Select } from "@/components/ui/select";
// import {
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Label } from "@/components/ui/label";
// import { useAuth } from "@/contexts/AuthContext";
// import { ref, listAll, deleteObject, getStorage } from "firebase/storage";
// import {
//   AlertDialog,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// 
// export default function UsersListing() {
//   const [freeTrialPeriod, setFreeTrialPeriod] = useState(0);
//   const storage = getStorage();
//   const [users, setUsers] = useState<any[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedUser, setSelectedUser] = useState<any>(null);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//   const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const [userToDelete, setUserToDelete] = useState<any>(null);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [userLeadExports, setUserLeadExports] = useState<any[]>([]);
//   const [loadingLeadExports, setLoadingLeadExports] = useState(false);
//   const [parentData, setParentData] = useState(null);
//   const [grandParentData, setGrandParentData] = useState(null);
//   const [editUserData, setEditUserData] = useState({
//     displayName: "",
//     lastName: "",
//     businessCategory: "",
//     clientsPreference: "",
//     l2Child: "",
//     l3LeveledUps: "",
//     l3Total: "",
//     l4Multiplier: "",
//     l4Total: "",
//     l5Multiplier: "",
//     l5Total: "",
//     l6Multiplier: "",
//     l6Total: "",
//     freeTrialPeriod: "",
//     companyName: "",
//     childEarnings: "",
//     grandchildEarnings: "",
//     operatingCostRate: "",
//     userChildEarning: "",
//     userGrandChildEarning: "",
//     status: "",
//     role: "user", // default value
//     notificationPreferences: {
//       email: "",
//       marketing: "",
//       orderUpdates: "",
//     },
//   });
//   const { user } = useAuth();
//   const usersPerPage = 10;
//   const { showToast } = useToast();
//   // New: Sorting state
//   const [sortConfig, setSortConfig] = useState<{
//     key: string;
//     direction: "asc" | "desc";
//   } | null>(null);
// 
//   const fetchDefaultUser = async () => {
//     const q = query(
//       collection(db, "users"),
//       where("email", "==", "rob@solobizcards.com"),
//     );
//     const querySnapshot = await getDocs(q);
//     if (!querySnapshot.empty) {
//       const userData = querySnapshot.docs[0].data() as any;
//       return userData;
//     }
//     return null;
//   };
//   // Fetch users
//   const fetchUsers = async () => {
//     try {
//       const usersRef = collection(db, "users");
//       const q = query(usersRef, orderBy("createdAt", "desc"));
//       const snapshot = await getDocs(q);
// 
//       const data = await Promise.all(
//         snapshot.docs.map(async (docSnap) => {
//           const d = docSnap.data() as any;
//           const userId = docSnap.id;
//           const referalRef = doc(db, "referrals", userId);
//           const refSnap = await getDoc(referalRef);
//           let childrenCount = 0;
//           let grandchildrenCount = 0;
//           let parentUser = { email: "", firstName: "", referralCode: "" };
//           let grandParent = { email: "", firstName: "", referralCode: "" };
//           if (refSnap.exists()) {
//             const refData = refSnap.data();
//             const children = refData.children || [];
//             if (refData.parentUid) {
//               const userRef = doc(db, "users", refData.parentUid);
//               const userSnap = await getDoc(userRef);
//               if (userSnap.exists()) {
//                 const userInfo = userSnap.data() as any;
//                 setParentData({
//                   email: userInfo.email,
//                   referralCode: userInfo.referralCode,
//                   firstName: userInfo.displayName,
//                 });
//                 parentUser.email = userInfo?.email ?? "";
//                 parentUser.referralCode = userInfo?.referralCode ?? "";
//                 parentUser.firstName = userInfo?.displayName ?? "";
//                 const grandParentRef = query(
//                   collection(db, "referrals"),
//                   where("referralCode", "==", userInfo.referralCode),
//                 );
//                 const grandRefSnap = await getDocs(grandParentRef);
//                 if (!grandRefSnap.empty) {
//                   const granduserData = grandRefSnap.docs[0].data() as any;
//                   if (granduserData.parentUid) {
//                     const grandUserRef = doc(
//                       db,
//                       "users",
//                       granduserData.parentUid,
//                     );
//                     const grandUserSnap = await getDoc(grandUserRef);
//                     if (grandUserSnap.exists()) {
//                       const grandUserInfo = grandUserSnap.data() as any;
//                       setGrandParentData({
//                         email: grandUserInfo.email,
//                         firstName: grandUserInfo.displayName,
//                         referralCode: grandUserInfo.referralCode,
//                       });
//                       grandParent.email = grandUserInfo?.email ?? "";
//                       grandParent.referralCode =
//                         grandUserInfo?.referralCode ?? "";
//                       grandParent.firstName = grandUserInfo?.displayName ?? "";
//                     }
//                   } else {
//                     const defaultUser = await fetchDefaultUser();
// 
//                     if (defaultUser) {
//                       setGrandParentData({
//                         email: defaultUser.email,
//                         referralCode: defaultUser.referralCode,
//                         firstName: defaultUser.displayName,
//                       });
//                       grandParent.email = defaultUser?.email ?? "";
//                       grandParent.firstName = defaultUser?.displayName ?? "";
//                       grandParent.referralCode =
//                         defaultUser?.referralCode ?? "";
//                     }
//                   }
//                 } else {
//                   const defaultUser = await fetchDefaultUser();
// 
//                   if (defaultUser) {
//                     setGrandParentData({
//                       email: defaultUser.email,
//                       firstName: defaultUser.displayName,
//                       referralCode: defaultUser.referralCode,
//                     });
//                     grandParent.email = defaultUser?.email ?? "";
//                     grandParent.firstName = defaultUser?.displayName ?? "";
//                     grandParent.referralCode = defaultUser?.referralCode ?? "";
//                   }
//                 }
//               } else {
//                 const defaultUser = await fetchDefaultUser();
// 
//                 if (defaultUser) {
//                   setParentData({
//                     email: defaultUser.email,
//                     firstName: defaultUser.displayName,
//                     referralCode: defaultUser.referralCode,
//                   });
//                   parentUser.email = defaultUser?.email ?? "";
//                   parentUser.firstName = defaultUser?.displayName ?? "";
//                   parentUser.referralCode = defaultUser?.referralCode ?? "";
//                   setGrandParentData({
//                     email: defaultUser.email,
//                     firstName: defaultUser.displayName,
//                     referralCode: defaultUser.referralCode,
//                   });
//                   grandParent.email = defaultUser?.email ?? "";
//                   grandParent.firstName = defaultUser?.displayName ?? "";
//                   grandParent.referralCode = defaultUser?.referralCode ?? "";
//                 }
//               }
// 
//               const grandchildren = refData.grandchildren || [];
// 
//               childrenCount = children.length;
//               grandchildrenCount = grandchildren.length;
//             } else {
//               const defaultUser = await fetchDefaultUser();
// 
//               if (defaultUser) {
//                 setParentData({
//                   email: defaultUser.email,
//                   firstName: defaultUser.displayName,
//                   referralCode: defaultUser.referralCode,
//                 });
//                 parentUser.email = defaultUser?.email ?? "";
//                 parentUser.firstName = defaultUser?.displayName ?? "";
//                 parentUser.referralCode = defaultUser?.referralCode ?? "";
//                 setGrandParentData({
//                   email: defaultUser.email,
//                   firstName: defaultUser.displayName,
//                   referralCode: defaultUser.referralCode,
//                 });
//                 grandParent.email = defaultUser?.email ?? "";
//                 grandParent.firstName = defaultUser?.displayName ?? "";
//                 grandParent.referralCode = defaultUser?.referralCode ?? "";
//               }
//             }
//           }
//           let childEarnings = d?.userChildEarning || 0;
// 
//           let grandchildEarnings = d?.userGrandChildEarning || 0;
// 
//           const settingsRef = doc(db, "settings", "ReferralEarningRate");
//           const snap1 = await getDoc(settingsRef);
//           if (snap1.exists()) {
//             if (childEarnings === 0) {
//               childEarnings = snap1.data().childEarnings;
//             }
//             if (grandchildEarnings === 0) {
//               grandchildEarnings = snap1.data().grandchildEarnings;
//             }
//           }
//           // Fetch latest card for this user
//           const cardsRef = collection(db, "cards");
//           const q = query(cardsRef, where("uid", "==", userId), limit(1));
//           const cardSnap = await getDocs(q);
//           let latestCard = null;
//           cardSnap.forEach((cardDoc) => {
//             const cd = cardDoc.data() as any;
//             latestCard = { id: cd.urlName, name: cd.urlName };
//           });
//           return {
//             id: userId,
//             displayName: d.displayName || "",
//             lastLogin: d.lastLogin || null,
//             lastName: d.lastName || "",
//             email: d.email || "",
//             businessCategory: d.businessCategory || "",
// 
//             l2Child: Number(d.l2Child) || 0,
//             l3LeveledUps: Number(d.l3LeveledUps) || 0,
//             l4Multiplier: Number(d.l4Multiplier) || 0,
//             l5Multiplier: Number(d.l5Multiplier) || 0,
//             l6Multiplier: Number(d.l6Multiplier) || 0,
// 
//             // childEarnings: Number(d.childEarnings) || 0,
//             // grandchildEarnings: Number(d.grandchildEarnings) || 0,
//             operatingCostRate: Number(d.operatingCostRate) || 0,
// 
//             clientsPreference: d.clientsPreference || "",
//             planType: d.planType || "",
//             planName: d.planName || "",
//             subscriptionStartDate: d.subscriptionStartDate || null,
//             subscriptionEndDate: d.subscriptionEndDate || null,
//             referralCode: d.referralCode || "",
//             userChildEarning: childEarnings || 0,
//             userGrandChildEarning: grandchildEarnings || 0,
//             freeTrialPeriod: d?.freeTrialPeriod || 0,
//             role: d.role || "User",
//             companyName: d.companyName || "",
//             status: d.status || "active",
//             addons: d.addons || "",
//             paymentId: d.paymentId || "",
//             stripeCustomerId: d.stripeCustomerId || "",
//             subscriptionId: d.subscriptionId || "",
//             paymentIntentId: d.paymentIntentId || "",
//             latestCardId: latestCard?.id ?? null,
//             latestCardName: latestCard?.name ?? null,
//             createdAt: d.createdAt || null, // add createdAt
//             ipAddress: d.ipAddress,
//             childrenCount: childrenCount,
//             grandChildCount: grandchildrenCount,
//             parentUser: parentUser,
//             grandParent: grandParent,
//             notificationPreferences: {
//               email: d?.notificationPreferences?.email,
//               marketing: d?.notificationPreferences?.marketing,
//               orderUpdates: d?.notificationPreferences?.orderUpdates,
//             },
//           };
//         }),
//       );
//       setUsers(data);
//     } catch (err) {
//       console.error("Error fetching users:", err);
//       setUsers([]);
//     }
//   };
// 
//   const settingsRef = doc(db, "settings", "PricingRequirement");
// 
//   useEffect(() => {
//     const fetchSettings = async () => {
//       const snap = await getDoc(settingsRef);
//       if (snap.exists()) {
//         const data = snap.data();
//         setFreeTrialPeriod(data.freeTrialPeriod || 0);
//       }
//     };
//     fetchSettings();
//   }, []);
// 
//   useEffect(() => {
//     if (user && users.length <= 0) {
//       fetchUsers();
//     }
//   }, [user]);
// 
//   // Filter users by search
//   const filteredUsers = users.filter((user) => {
//     const query = searchQuery.toLowerCase();
//     return (
//       user.displayName.toLowerCase().includes(query) ||
//       user.lastName.toLowerCase().includes(query) ||
//       user.email.toLowerCase().includes(query)
//     );
//   });
// 
//   // Sorting users
//   const sortedUsers = React.useMemo(() => {
//     if (!sortConfig) return filteredUsers;
//     return [...filteredUsers].sort((a, b) => {
//       const aValue = a[sortConfig.key] ?? "";
//       const bValue = b[sortConfig.key] ?? "";
//       if (typeof aValue === "string" && typeof bValue === "string") {
//         return sortConfig.direction === "asc"
//           ? aValue.localeCompare(bValue)
//           : bValue.localeCompare(aValue);
//       }
//       // Convert Firestore Timestamp or string to Date
//       const aDate = aValue?.toDate ? aValue.toDate() : new Date(aValue);
//       const bDate = bValue?.toDate ? bValue.toDate() : new Date(bValue);
//       if (!isNaN(aDate) && !isNaN(bDate)) {
//         return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
//       }
// 
//       return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
//     });
//   }, [filteredUsers, sortConfig]);
// 
//   // Sorting handler
//   const handleSort = (key: string) => {
//     let direction: "asc" | "desc" = "asc";
//     if (
//       sortConfig &&
//       sortConfig.key === key &&
//       sortConfig.direction === "asc"
//     ) {
//       direction = "desc";
//     }
//     setSortConfig({ key, direction });
//   };
// 
//   // Pagination
//   const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
//   const startIndex = (currentPage - 1) * usersPerPage;
//   const currentUsers = sortedUsers.slice(startIndex, startIndex + usersPerPage);
// 
//   // Edit user
//   const handleEditUser = (user: any) => {
//     setSelectedUser(user);
//     setEditUserData({
//       displayName: user.displayName,
//       lastName: user.lastName,
//       businessCategory: user.businessCategory,
//       clientsPreference: user.clientsPreference,
//       companyName: user.companyName,
//       status: user.status,
//       userChildEarning: user.userChildEarning,
//       userGrandChildEarning: user.userGrandChildEarning,
//       freeTrialPeriod: user.freeTrialPeriod,
//       role: user.role,
//       l2Child: user.l2Child,
//       l3LeveledUps: user.l3LeveledUps,
//       l3Total: user.l3Total,
//       l4Multiplier: user.l4Multiplier,
//       l4Total: user.l4Total,
//       l5Multiplier: user.l5Multiplier,
//       l5Total: user.l5Total,
//       l6Multiplier: user.l6Multiplier,
//       l6Total: user.l6Total,
//       childEarnings: user.childEarnings,
//       grandchildEarnings: user.grandchildEarnings,
//       operatingCostRate: user.operatingCostRate,
//       notificationPreferences: {
//         email: user?.notificationPreferences?.email,
//         marketing: user?.notificationPreferences?.marketing,
//         orderUpdates: user?.notificationPreferences?.orderUpdates,
//       },
//     });
//     setIsEditDialogOpen(true);
//   };
// 
//   const getLocationFromIP = async (ip: string) => {
//     const accessToken = "9f9a0a0c6d2d36";
//     try {
//       const res = await fetch(
//         `https://ipinfo.io/${ip}/json?token=${accessToken}`,
//       );
//       const data = await res.json();
//       if (data)
//         return {
//           ip: data.ip,
//           latitude: data.loc ? Number(data.loc.split(",")[0]) : 0,
//           longitude: data.loc ? Number(data.loc.split(",")[1]) : 0,
//           state: data.region ?? null,
//           country: data.country ?? null,
//           city: data.city ?? null,
//           ...data,
//         };
//       else {
//         return {
//           ip: 0,
//           latitude: 0,
//           longitude: 0,
//           state: null,
//           country: null,
//           city: null,
//           ...data,
//         };
//       }
//     } catch (err) {
//       console.error("Error fetching IP location:", err);
//       return null;
//     }
//   };
// 
//   const handleUpdateUser = async () => {
//     if (!selectedUser) return;
//     try {
//       const userRef = doc(db, "users", selectedUser.id);
//       await updateDoc(userRef, {
//         ...editUserData,
//         l2Child: Number(editUserData.l2Child),
//         l3LeveledUps: Number(editUserData.l3LeveledUps),
//         l4Multiplier: Number(editUserData.l4Multiplier),
//         l5Multiplier: Number(editUserData.l5Multiplier),
//         l6Multiplier: Number(editUserData.l6Multiplier),
// 
//         l3Total:
//           Number(editUserData?.l3LeveledUps) * Number(editUserData?.l2Child),
// 
//         l4Total:
//           Number(editUserData?.l3LeveledUps) *
//           Number(editUserData?.l2Child) *
//           Number(editUserData.l4Multiplier),
// 
//         l5Total:
//           Number(editUserData?.l3LeveledUps) *
//           Number(editUserData?.l2Child) *
//           Number(editUserData.l5Multiplier),
// 
//         l6Total:
//           Number(editUserData?.l3LeveledUps) *
//           Number(editUserData?.l2Child) *
//           Number(editUserData.l6Multiplier),
// 
//         childEarnings: Number(editUserData.childEarnings),
//         grandchildEarnings: Number(editUserData.grandchildEarnings),
//         operatingCostRate: Number(editUserData.operatingCostRate),
//       });
// 
//       showToast("User details updated successfully.", "success");
//       setIsEditDialogOpen(false);
//       fetchUsers();
//     } catch (err) {
//       console.error("Error updating user:", err);
//     }
//   };
// 
//   // Delete user
//   // const handleDeleteUser = async (userId: string) => {
//   //   if (!confirm("Are you sure you want to delete this user?")) return;
//   //   try {
//   //     await deleteDoc(doc(db, "users", userId));
//   //     showToast("User deleted successfully.", "success");
//   //     fetchUsers();
//   //   } catch (err) {
//   //     console.error("Error deleting user:", err);
//   //   }
//   // };
// 
//   async function deleteFolderRecursive(...folderRefs: any[]) {
//     for (const folderRef of folderRefs) {
//       const list = await listAll(folderRef);
// 
//       // Delete all files in this folder
//       await Promise.all(list.items.map((fileRef) => deleteObject(fileRef)));
// 
//       // Recursively delete subfolders
//       await Promise.all(
//         list.prefixes.map((subFolderRef) =>
//           deleteFolderRecursive(subFolderRef),
//         ),
//       );
//     }
//   }
// 
//   const handleOpenDeleteDialog = (userObj: any) => {
//     setUserToDelete(userObj);
//     setIsDeleteDialogOpen(true);
//   };
// 
//   const handleSoftDelete = async (userObj: any) => {
//     if (!userObj?.id) return;
//     setIsDeleting(true);
// 
//     try {
//       const userId = userObj.id;
//       // 1️ Mark user as inactive
//       const userRef = doc(db, "users", userId);
//       await updateDoc(userRef, {
//         avatarUrl: "",
//         status: "inactive",
//         deletedAt: serverTimestamp(),
//       });
// 
//       // 2️ Delete all cards in Firestore where uid = userId
//       const cardsQuery = query(
//         collection(db, "cards"),
//         where("uid", "==", userId),
//       );
//       const querySnapshot = await getDocs(cardsQuery);
//       const deleteCardPromises = querySnapshot.docs.map((cardDoc) =>
//         deleteDoc(doc(db, "cards", cardDoc.id)),
//       );
//       await Promise.all(deleteCardPromises);
// 
//       // 3️ Delete all files in storage under cards/{userId}/ and avatars/{userId}/ recursively
//       const folderRef = ref(storage, `cards/${userId}/`);
//       const userFolderRef = ref(storage, `avatars/${userId}/`);
// 
//       await deleteFolderRecursive(folderRef, userFolderRef);
// 
//       showToast(
//         "User soft deleted (status set to Inactive, cards and storage cleaned).",
//         "success",
//       );
//       setIsDeleteDialogOpen(false);
//       setUserToDelete(null);
//       fetchUsers(); // refresh list
//     } catch (err) {
//       console.error("Error soft deleting user or deleting cards/storage:", err);
//       showToast("Failed to soft delete user.", "error");
//     } finally {
//       setIsDeleting(false);
//     }
//   };
// 
//   const handlePermanentDelete = async (userObj: any) => {
//     if (!userObj?.id) return;
//     setIsDeleting(true);
// 
//     try {
//       const userId = userObj.id;
// 
//       // 1️ Delete all cards in Firestore where uid = userId
//       const cardsQuery = query(
//         collection(db, "cards"),
//         where("uid", "==", userId),
//       );
//       const querySnapshot = await getDocs(cardsQuery);
//       const deleteCardPromises = querySnapshot.docs.map((cardDoc) =>
//         deleteDoc(doc(db, "cards", cardDoc.id)),
//       );
//       await Promise.all(deleteCardPromises);
// 
//       // 2️ Delete all files in storage under cards/{userId}/ and avatars/{userId}/ recursively
//       const folderRef = ref(storage, `cards/${userId}/`);
//       const userFolderRef = ref(storage, `avatars/${userId}/`);
// 
//       await deleteFolderRecursive(folderRef, userFolderRef);
// 
//       // 3️ Delete user document permanently from Firebase Firestore
//       await deleteDoc(doc(db, "users", userId));
// 
//       showToast(
//         "User permanently deleted from database.",
//         "success",
//       );
//       setIsDeleteDialogOpen(false);
//       setUserToDelete(null);
//       fetchUsers(); // refresh list
//     } catch (err) {
//       console.error("Error permanently deleting user:", err);
//       showToast("Failed to permanently delete user from database.", "error");
//     } finally {
//       setIsDeleting(false);
//     }
//   };
// 
//   // Toggle status
//   const toggleStatus = async (user: any) => {
//     try {
//       const userRef = doc(db, "users", user.id);
//       const newStatus = user.status === "active" ? "inactive" : "active";
//       await updateDoc(userRef, { status: newStatus });
//       showToast(`User status updated to ${newStatus}`, "success");
//       fetchUsers();
//     } catch (err) {
//       console.error("Error updating status:", err);
//     }
//   };
// 
//   // View user
//   const handleViewUser = async (user: any) => {
//     const userAddress = await getLocationFromIP(user.ipAddress);
//     user.userAddress = userAddress;
//     setSelectedUser(user);
//     setIsViewDialogOpen(true);
// 
//     setUserLeadExports([]);
//     setLoadingLeadExports(true);
//     try {
//       const targetUid = user?.id || user?.uid;
//       if (targetUid) {
//         const q = query(
//           collection(db, "leadExports"),
//           where("uid", "==", targetUid)
//         );
//         const snap = await getDocs(q);
//         const exportsList = snap.docs
//           .map((d) => ({ id: d.id, ...d.data() }))
//           .sort((a: any, b: any) => {
//             const aTime =
//               a.paidAt?.toMillis?.() ||
//               (a.paidAt?.seconds
//                 ? a.paidAt.seconds * 1000
//                 : a.paidAt
//                 ? new Date(a.paidAt).getTime()
//                 : 0);
//             const bTime =
//               b.paidAt?.toMillis?.() ||
//               (b.paidAt?.seconds
//                 ? b.paidAt.seconds * 1000
//                 : b.paidAt
//                 ? new Date(b.paidAt).getTime()
//                 : 0);
//             return bTime - aTime;
//           });
//         setUserLeadExports(exportsList);
//       }
//     } catch (err) {
//       console.error("Error fetching lead exports for user:", err);
//       setUserLeadExports([]);
//     } finally {
//       setLoadingLeadExports(false);
//     }
//   };
// 
//   // Export CSV
//   const exportToCSV = (usersData: any[]) => {
//     if (!usersData.length) return;
// 
//     const headers = [
//       "First Name",
//       "Last Name",
//       "Email",
//       "Business Category",
//       "Clients Preference",
//       "Company",
//       "Plan Type",
//       "Plan Name",
//       "Subscription Start Date",
//       "Subscription End Date",
//       "Referral Code",
//       "Role",
//       "Status",
//       "stripeCustomerId",
//       "paymentId",
//       "subscriptionId",
//     ];
// 
//     // Helper: format Firestore or normal date
//     const formatDate = (value: any) => {
//       if (!value) return "";
//       let dateObj;
// 
//       // Firestore Timestamp (has seconds field)
//       if (value.seconds) {
//         dateObj = new Date(value.seconds * 1000);
//       }
//       // Firestore Timestamp object (has toDate method)
//       else if (typeof value.toDate === "function") {
//         dateObj = value.toDate();
//       }
//       // ISO string or date string
//       else if (typeof value === "string" || value instanceof Date) {
//         dateObj = new Date(value);
//       } else {
//         return "";
//       }
// 
//       if (isNaN(dateObj.getTime())) return "";
// 
//       // Format date nicely e.g., 7th October 2025
//       const day = dateObj.getDate();
//       const month = dateObj.toLocaleString("default", { month: "long" });
//       const year = dateObj.getFullYear();
// 
//       const suffix =
//         day % 10 === 1 && day !== 11
//           ? "st"
//           : day % 10 === 2 && day !== 12
//             ? "nd"
//             : day % 10 === 3 && day !== 13
//               ? "rd"
//               : "th";
// 
//       return `${day}${suffix} ${month} ${year}`;
//     };
// 
//     const csvRows = [
//       headers.join(","),
//       ...usersData.map((user) =>
//         [
//           user.displayName,
//           user.lastName,
//           user.email,
//           user.businessCategory,
//           user.clientsPreference,
//           user.companyName,
//           user.planType,
//           user.planName,
//           formatDate(user.subscriptionStartDate),
//           formatDate(user.subscriptionEndDate),
//           user.referralCode,
//           user.role,
//           user.status,
//           user.stripeCustomerId,
//           user.paymentId,
//           user.subscriptionId,
//         ]
//           .map((v) => `"${v ?? ""}"`)
//           .join(","),
//       ),
//     ];
// 
//     const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
//     const encodedUri = encodeURI(csvContent);
//     const link = document.createElement("a");
//     link.setAttribute("href", encodedUri);
//     link.setAttribute("download", "users.csv");
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };
// 
//   function formatDate(dateValue) {
//     if (!dateValue) return "-";
// 
//     let dateObj;
// 
//     // Handle Firestore Timestamp or ISO string
//     if (dateValue?.toDate) {
//       dateObj = dateValue.toDate(); // Firestore Timestamp
//     } else if (dateValue?.seconds) {
//       dateObj = new Date(dateValue.seconds * 1000);
//     } else if (typeof dateValue === "string" || typeof dateValue === "number") {
//       dateObj = new Date(dateValue);
//     } else if (dateValue instanceof Date) {
//       dateObj = dateValue;
//     } else {
//       return "-";
//     }
// 
//     if (isNaN(dateObj.getTime())) return "-";
// 
//     // Format date: MM/DD/YYYY
//     const month = String(dateObj.getMonth() + 1).padStart(2, "0");
//     const day = String(dateObj.getDate()).padStart(2, "0");
//     const year = dateObj.getFullYear();
// 
//     // Format time: hh:mm AM/PM
//     let hours = dateObj.getHours();
//     const minutes = String(dateObj.getMinutes()).padStart(2, "0");
//     const ampm = hours >= 12 ? "PM" : "AM";
//     hours = hours % 12 || 12; // Convert 0 to 12-hour format
//     const formattedTime = `${String(hours).padStart(
//       2,
//       "0",
//     )}:${minutes} ${ampm}`;
// 
//     return `${month}/${day}/${year} ${formattedTime}`;
//   }
// 
//   //console.log("selectedUser", selectedUser?.notificationPreferences?.email);
// 
//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <h2 className="font-semibold tracking-tight text-lg">
//           Users Listing [{users.length}]
//         </h2>
// 
//         <div className="flex gap-2 w-full sm:w-auto">
//           {/* Search */}
//           <div className="relative flex-1 sm:w-64 md:w-80">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <Input
//               placeholder="Search by name, email..."
//               className="pl-10 w-full"
//               value={searchQuery}
//               onChange={(e) => {
//                 setSearchQuery(e.target.value);
//                 setCurrentPage(1);
//               }}
//             />
//           </div>
// 
//           {/* Export CSV Button */}
//           <Button
//             size="sm"
//             className="bg-blue-600 hover:bg-blue-700 shrink-0"
//             onClick={() => exportToCSV(filteredUsers)}
//           >
//             <Download className="h-4 w-4 mr-2" /> Export CSV
//           </Button>
//         </div>
//       </div>
// 
//       {/* Table View */}
//       <Card className="p-4 overflow-x-auto">
//         {currentUsers.length === 0 ? (
//           <div className="flex justify-center py-4">
//             {" "}
//             <div className="flex justify-center items-center py-6">
//               <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
//             </div>
//           </div>
//         ) : (
//           <table className="min-w-full border border-gray-200 text-sm">
//             <thead className="bg-gray-50">
//               <tr className="bg-card">
//                 {[
//                   { key: "displayName", label: "First Name" },
//                   { key: "lastName", label: "Last Name" },
//                   { key: "email", label: "Email" },
//                   { key: "planType", label: "Plan Type" },
//                   { key: "Cards", label: "Cards" },
//                   { key: "referralCode", label: "Referral Code" },
//                   { key: "role", label: "Role" },
//                   { key: "status", label: "Status" },
//                   { key: "createdAt", label: "createdAt" },
//                 ].map((col) => (
//                   <th
//                     key={col.key}
//                     className="border p-2 text-left cursor-pointer bg-card"
//                     onClick={() => handleSort(col.key)}
//                   >
//                     <div className="flex items-center gap-1 select-none">
//                       {col.label}
//                       <span className="flex flex-col text-xs">
//                         <span
//                           className={
//                             sortConfig?.key === col.key &&
//                             sortConfig.direction === "asc"
//                               ? "text-black"
//                               : "text-gray-400"
//                           }
//                         >
//                           ▲
//                         </span>
//                         <span
//                           className={
//                             sortConfig?.key === col.key &&
//                             sortConfig.direction === "desc"
//                               ? "text-black"
//                               : "text-gray-400"
//                           }
//                         >
//                           ▼
//                         </span>
//                       </span>
//                     </div>
//                   </th>
//                 ))}
//                 {/* <th className="border p-2 text-left">Created Date</th> */}
//                 {/* <th className="border p-2 text-center">Status</th> */}
//                 <th className="border p-2 text-center bg-card">Actions</th>
//               </tr>
//             </thead>
// 
//             <tbody>
//               {currentUsers.map((user) => (
//                 <tr key={user.id} className="hover:bg-gray-50">
//                   <td className="border p-2">{user.displayName}</td>
//                   <td className="border p-2">{user.lastName}</td>
//                   <td className="border p-2">{user.email}</td>
// 
//                   <td
//                     className="border p-2"
//                     style={{ textTransform: "capitalize" }}
//                   >
//                     {user.planType}
//                   </td>
//                   <td className="border p-2 text-primary underline">
//                     {user.latestCardName ? (
//                       <a
//                         href={
//                           process.env.NEXT_PUBLIC_API_LIVE_URL +
//                           user.latestCardId
//                         }
//                       >
//                         {user.latestCardName}
//                       </a>
//                     ) : (
//                       "No Card"
//                     )}
//                   </td>
//                   <td className="border p-2">{user.referralCode}</td>
// 
//                   <td
//                     className="border p-2"
//                     style={{ textTransform: "capitalize" }}
//                   >
//                     {user.role}
//                   </td>
//                   <td
//                     className="border p-2 text-center"
//                     style={{ textTransform: "capitalize" }}
//                   >
//                     <Badge
//                       variant={
//                         user.status === "active" ? "secondary" : "outline"
//                       }
//                       className="cursor-pointer"
//                       onClick={() => toggleStatus(user)}
//                     >
//                       {user.status}
//                     </Badge>
//                   </td>
//                   <td className="border p-2">
//                     {" "}
//                     {user.createdAt ? formatDate(user.createdAt) : "-"}
//                   </td>
//                   <td className="border p-2 text-center">
//                     <div className="flex justify-center gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => handleViewUser(user)}
//                       >
//                         <Eye size={14} />
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => handleEditUser(user)}
//                       >
//                         <Pencil size={14} />
//                       </Button>
//                       <Button
//                         variant="destructive"
//                         size="sm"
//                         onClick={() => handleOpenDeleteDialog(user)}
//                       >
//                         <Trash size={14} />
//                       </Button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </Card>
// 
//       {/* Pagination */}
//       {filteredUsers.length > usersPerPage && (
//         <div className="flex justify-center">
//           <Pagination>
//             <PaginationContent>
//               {/* Previous Button */}
//               <PaginationItem>
//                 <PaginationPrevious
//                   href="#"
//                   onClick={(e) => {
//                     e.preventDefault();
//                     if (currentPage > 1) setCurrentPage(currentPage - 1);
//                   }}
//                   className={
//                     currentPage === 1 ? "pointer-events-none opacity-50" : ""
//                   }
//                 />
//               </PaginationItem>
// 
//               {/* Page Numbers with Ellipsis */}
//               {(() => {
//                 const pagesToShow = [];
//                 const maxVisible = 5; // max numbers to show (excluding first & last)
//                 const start = Math.max(2, currentPage - 1);
//                 const end = Math.min(totalPages - 1, currentPage + 1);
// 
//                 pagesToShow.push(1); // Always show first page
// 
//                 if (start > 2) {
//                   pagesToShow.push("..."); // Left ellipsis
//                 }
// 
//                 for (let i = start; i <= end; i++) {
//                   pagesToShow.push(i);
//                 }
// 
//                 if (end < totalPages - 1) {
//                   pagesToShow.push("..."); // Right ellipsis
//                 }
// 
//                 if (totalPages > 1) {
//                   pagesToShow.push(totalPages); // Always show last page
//                 }
// 
//                 return pagesToShow.map((page, index) => (
//                   <PaginationItem key={index}>
//                     {page === "..." ? (
//                       <span className="px-3 py-1 text-gray-500">...</span>
//                     ) : (
//                       <PaginationLink
//                         href="#"
//                         isActive={currentPage === page}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           setCurrentPage(page);
//                         }}
//                       >
//                         {page}
//                       </PaginationLink>
//                     )}
//                   </PaginationItem>
//                 ));
//               })()}
// 
//               {/* Next Button */}
//               <PaginationItem>
//                 <PaginationNext
//                   href="#"
//                   onClick={(e) => {
//                     e.preventDefault();
//                     if (currentPage < totalPages)
//                       setCurrentPage(currentPage + 1);
//                   }}
//                   className={
//                     currentPage === totalPages
//                       ? "pointer-events-none opacity-50"
//                       : ""
//                   }
//                 />
//               </PaginationItem>
//             </PaginationContent>
//           </Pagination>
//         </div>
//       )}
// 
//       {/* Edit Dialog */}
//       <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//         <AlertDialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full max-h-[85vh] !flex !flex-col overflow-hidden">
//           <AlertDialogHeader className="shrink-0">
//             <AlertDialogCancel className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100">
//               <X className="w-5 h-5" />
//             </AlertDialogCancel>
//             <AlertDialogTitle>Edit User</AlertDialogTitle>
//           </AlertDialogHeader>
//           <div className="flex-1 overflow-y-auto space-y-4 pr-2">
//             {/* First Name */}
//             <div>
//               <Label htmlFor="First-Name">First Name</Label>
//               <Input
//                 className="mt-3"
//                 placeholder="First Name"
//                 value={editUserData.displayName}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     displayName: e.target.value,
//                   })
//                 }
//               />
//             </div>
// 
//             {/* Last Name */}
//             {/* <div>
//               <Label htmlFor="Last-Name">Last Name</Label>
//               <Input
//                 className="mt-3"
//                 placeholder="Last Name"
//                 value={editUserData.lastName}
//                 onChange={(e) =>
//                   setEditUserData({ ...editUserData, lastName: e.target.value })
//                 }
//               />
//             </div> */}
// 
//             {/* Business Category */}
//             {/* <div>
//               <Label htmlFor="business-category">Business Category</Label>
//               <Select
//                 value={editUserData.businessCategory}
//                 onValueChange={(value) =>
//                   setEditUserData({ ...editUserData, businessCategory: value })
//                 }
//               >
//                 <SelectTrigger className="mt-3">
//                   <SelectValue placeholder="Select Business Category" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {[
//                     "ARTS/MUSIC/WRITING",
//                     "BANKING/FINANCE",
//                     "BUSINESS MGT",
//                     "COMMUNICATION",
//                     "CONSTRUCTION",
//                     "EDUCATION",
//                     "ENGINEERING",
//                     "ENTERTAINMENT",
//                     "FARMING",
//                     "GOV/POLITICS",
//                     "HEALTHCARE",
//                     "HOSPITALITY",
//                     "IT/SOFTWARE",
//                     "LEGAL",
//                     "MANUFACTURING",
//                     "MILITARY",
//                     "NON-PROFIT",
//                     "REAL ESTATE",
//                     "RETAIL",
//                     "SALES/MARKETING",
//                     "SCIENCE/RESEARCH",
//                     "SELF-EMPLOYED",
//                     "STUDENT",
//                     "TRANSPORTATION",
//                     "RETIRED",
//                     "OTHER",
//                   ].map((cat) => (
//                     <SelectItem key={cat} value={cat}>
//                       {cat}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div> */}
// 
//             {/* Clients Preference */}
//             {/* <div>
//               <Label htmlFor="Clients-Preference">Clients Preference</Label>
//               <Select
//                 value={editUserData.clientsPreference}
//                 onValueChange={(value) =>
//                   setEditUserData({ ...editUserData, clientsPreference: value })
//                 }
//               >
//                 <SelectTrigger className="mt-3">
//                   <SelectValue placeholder="Select Clients Preference" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="local">Local Clients</SelectItem>
//                   <SelectItem value="non-local">Non-Local Clients</SelectItem>
//                   <SelectItem value="both">Both</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div> */}
// 
//             {/* Company Name */}
//             {/* <div>
//               <Label htmlFor="Company-Name">Company Name</Label>
//               <Input
//                 className="mt-3"
//                 placeholder="Company Name"
//                 value={editUserData.companyName}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     companyName: e.target.value,
//                   })
//                 }
//               />
//             </div> */}
// 
//             <div>
//               <Label htmlFor="Company-Name">
//                 Child affiliate earnings after monetization
//               </Label>
//               <Input
//                 type="number"
//                 className="mt-3"
//                 placeholder="Child Earning"
//                 value={editUserData.userChildEarning}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     userChildEarning: e.target.value,
//                   })
//                 }
//               />
//             </div>
// 
//             <div>
//               <Label htmlFor="Company-Name">
//                 Grandchild affiliate earnings after monetization
//               </Label>
//               <Input
//                 type="number"
//                 className="mt-3"
//                 placeholder="Grand-Child Earning"
//                 value={editUserData.userGrandChildEarning}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     userGrandChildEarning: e.target.value,
//                   })
//                 }
//               />
//             </div>
// 
//             <div>
//               <Label htmlFor="Company-Name">
//                 Member's operating cost deduction rate
//               </Label>
//               <Input
//                 type="number"
//                 className="mt-3"
//                 placeholder="operatingCostRate"
//                 value={editUserData.operatingCostRate}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     operatingCostRate: e.target.value,
//                   })
//                 }
//               />
//             </div>
// 
//             <div>
//               <Label htmlFor="Company-Name">L2 - # needed to Level-Up</Label>
//               <Input
//                 type="number"
//                 className="mt-3"
//                 placeholder="L2 - # needed to Level-Up"
//                 value={editUserData.l2Child}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     l2Child: e.target.value,
//                   })
//                 }
//               />
//             </div>
// 
//             <div>
//               <Label htmlFor="Company-Name">
//                 L3 - # of L2s needed, Level-Ups
//               </Label>
//               <Input
//                 type="number"
//                 className="mt-3"
//                 placeholder="L3 - # of L2s needed, Level-Ups"
//                 value={editUserData.l3LeveledUps}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     l3LeveledUps: e.target.value,
//                   })
//                 }
//               />
//             </div>
// 
//             <div>
//               <Label htmlFor="Company-Name">L4 - L3 times</Label>
//               <Input
//                 type="number"
//                 className="mt-3"
//                 placeholder="L4 - L3 times"
//                 value={editUserData.l4Multiplier}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     l4Multiplier: e.target.value,
//                   })
//                 }
//               />
//             </div>
// 
//             <div>
//               <Label htmlFor="Company-Name">L5 - L3 times</Label>
//               <Input
//                 type="number"
//                 className="mt-3"
//                 placeholder="L5 - L3 times "
//                 value={editUserData.l5Multiplier}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     l5Multiplier: e.target.value,
//                   })
//                 }
//               />
//             </div>
// 
//             <div>
//               <Label htmlFor="Company-Name">L6 - L3 times</Label>
//               <Input
//                 type="number"
//                 className="mt-3"
//                 placeholder="L6 - L3 times"
//                 value={editUserData.l6Multiplier}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     l6Multiplier: e.target.value,
//                   })
//                 }
//               />
//             </div>
// 
//             <div>
//               <Label htmlFor="Company-Name">Trial Periods</Label>
//               <Input
//                 type="number"
//                 className="mt-3"
//                 placeholder="L6 - L3 times"
//                 value={editUserData.freeTrialPeriod}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     freeTrialPeriod: e.target.value,
//                   })
//                 }
//               />
//             </div>
// 
//             {/* <div>
//               <Label htmlFor="Company-Name">
//                 Child affiliate earnings after monetization
//               </Label>
//               <Input
//                 type="number"
//                 className="mt-3"
//                 placeholder="childEarnings"
//                 value={editUserData.childEarnings}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     childEarnings: e.target.value,
//                   })
//                 }
//               />
//             </div>
// 
//             <div>
//               <Label htmlFor="Company-Name">
//                 Grandchild affiliate earnings after monetization
//               </Label>
//               <Input
//                 type="number"
//                 className="mt-3"
//                 placeholder="grandchildEarnings"
//                 value={editUserData.grandchildEarnings}
//                 onChange={(e) =>
//                   setEditUserData({
//                     ...editUserData,
//                     grandchildEarnings: e.target.value,
//                   })
//                 }
//               />
//             </div> */}
// 
//             {/* Status */}
//             <div>
//               <Label htmlFor="Status">Status</Label>
//               <Select
//                 value={editUserData.status}
//                 onValueChange={(value) =>
//                   setEditUserData({ ...editUserData, status: value })
//                 }
//               >
//                 <SelectTrigger className="mt-3">
//                   <SelectValue placeholder="Select Status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="active">Active</SelectItem>
//                   <SelectItem value="inactive">Inactive</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
// 
//             {/* Role */}
//             <div>
//               <Label htmlFor="Role">Role</Label>
//               <Select
//                 value={editUserData.role}
//                 onValueChange={(value) =>
//                   setEditUserData({ ...editUserData, role: value })
//                 }
//               >
//                 <SelectTrigger className="mt-3">
//                   <SelectValue placeholder="Select Role" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="user">User</SelectItem>
//                   <SelectItem value="admin">Admin</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
// 
//           <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 shrink-0">
//             <Button
//               variant="outline"
//               onClick={() => setIsEditDialogOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button onClick={handleUpdateUser}>Save</Button>
//           </div>
//         </AlertDialogContent>
//       </AlertDialog>
// 
//       {/* View Dialog */}
//       <AlertDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
//         <AlertDialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full max-h-[85vh] !flex !flex-col overflow-hidden">
//           <AlertDialogCancel className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100">
//             <X className="w-5 h-5" />
//           </AlertDialogCancel>
//           <AlertDialogHeader className="shrink-0">
//             <AlertDialogTitle>User Details</AlertDialogTitle>
//             {selectedUser && selectedUser.lastLogin && (
//               <h6>Last Login Date : {formatDate(selectedUser.lastLogin)}</h6>
//             )}
//           </AlertDialogHeader>
//           {selectedUser && (
//             <>
//               <div className="flex-1 overflow-y-auto space-y-2 mt-2 pr-2">
//                 <div>
//                   <h1 className="font-bold underline mt-5 mb-2">
//                     Personal Information:
//                   </h1>
//                   <p>
//                     <strong>First Name :</strong> {selectedUser.displayName}
//                   </p>
//                   <p>
//                     <strong>Last Name :</strong> {selectedUser.lastName}
//                   </p>
//                   <p>
//                     <strong>Email :</strong> {selectedUser.email}
//                   </p>
//                 </div>
// 
//                 <div>
//                   <h1 className="font-bold underline mt-5 mb-2">
//                     Business Information :
//                   </h1>
//                   <p>
//                     <strong>Business Category :</strong>{" "}
//                     {selectedUser.businessCategory}
//                   </p>
//                   <p>
//                     <strong>Clients Preference :</strong>{" "}
//                     {selectedUser.clientsPreference}
//                   </p>
//                   <p>
//                     <strong>Company :</strong> {selectedUser.companyName}
//                   </p>
//                 </div>
// 
//                 <div>
//                   <h1 className="font-bold underline mt-5 mb-2">
//                     Referrals Requirements:
//                   </h1>
//                   <p>
//                     <strong>L2 - # needed to Level-Up :</strong>{" "}
//                     {selectedUser.l2Child}
//                   </p>
//                   <p>
//                     <strong>L3 - # of L2s needed, Level-Ups :</strong>{" "}
//                     {selectedUser.l3LeveledUps}
//                   </p>
//                   <p>
//                     <strong>L4 - L3 times :</strong> {selectedUser.l4Multiplier}
//                   </p>
//                   <p>
//                     <strong>L5 - L3 times :</strong> {selectedUser.l5Multiplier}
//                   </p>
//                   <p>
//                     <strong>L6 - L3 times :</strong> {selectedUser.l6Multiplier}
//                   </p>
//                 </div>
// 
//                 <div>
//                   <h1 className="font-bold underline mt-5 mb-2">
//                     Referral Earning Rate:
//                   </h1>
//                   <p>
//                     <strong>Child :</strong> {selectedUser.userChildEarning}%
//                   </p>
//                   <p>
//                     <strong>Grandchild :</strong>{" "}
//                     {selectedUser.userGrandChildEarning}%
//                   </p>
//                   <p>
//                     <strong>Operating cost :</strong>{" "}
//                     {selectedUser.operatingCostRate}%
//                   </p>
//                 </div>
// 
//                 {selectedUser.planType === "free" && (
//                   <>
//                     <div>
//                       <h1 className="font-bold underline mt-5 mb-2">
//                         Plans Information :
//                       </h1>
//                       <p>
//                         <strong>Plan Type :</strong> {selectedUser.planType}
//                       </p>
//                       <p>
//                         <strong>Trial Periods :</strong>{" "}
//                         {selectedUser.freeTrialPeriod} days
//                       </p>
//                     </div>
//                   </>
//                 )}
// 
//                 {selectedUser.planType === "paid" && (
//                   <>
//                     <div>
//                       <h1 className="font-bold underline mt-5 mb-2">
//                         Subscription Information :
//                       </h1>
//                       <p>
//                         <strong>Payment Id:</strong>{" "}
//                         {selectedUser.paymentIntentId}
//                       </p>
//                       <p>
//                         <strong>Subscription Id :</strong>{" "}
//                         {selectedUser.subscriptionId}
//                       </p>
//                       <p>
//                         <strong>Stripe Customer Id :</strong>{" "}
//                         {selectedUser.stripeCustomerId}
//                       </p>
//                       <p>
//                         <strong>Plan Type :</strong> {selectedUser.planType}
//                       </p>
//                       <p>
//                         <strong>Plan Name :</strong> {selectedUser.planName}
//                       </p>
//                       <p>
//                         <strong>Trial Periods :</strong> {freeTrialPeriod} days
//                       </p>
//                       <p>
//                         <strong>Subscription Start Date :</strong>{" "}
//                         {formatDate(selectedUser.subscriptionStartDate)}
//                       </p>
//                       <p>
//                         <strong>Subscription End Date :</strong>{" "}
//                         {formatDate(selectedUser.subscriptionEndDate)}
//                       </p>
// 
//                       {selectedUser?.planName?.toLowerCase() !== "free plan" &&
//                         Array.isArray(selectedUser.addons) &&
//                         selectedUser.addons.length > 0 && (
//                           <>
//                             {selectedUser.addons.map((addon, index) => (
//                               <div key={index}>
//                                 <p>
//                                   <strong>Addons :</strong> {addon.name}
//                                   {"("}
//                                   {addon.price
//                                     ? `$${addon.price} / ${
//                                         addon.billing === "annual"
//                                           ? "Yearly"
//                                           : "Monthly"
//                                       }`
//                                     : ""}
//                                   {")"}
//                                 </p>
//                               </div>
//                             ))}
//                           </>
//                         )}
//                     </div>
//                   </>
//                 )}
// 
//                 <div>
//                   <h1 className="font-bold underline mt-5 mb-2">
//                     Others Information :
//                   </h1>
//                   {/* {selectedUser.userChildEarning && (
//                   <p>
//                     <strong>Child Earning :</strong>{" "}
//                     {selectedUser.userChildEarning}%
//                   </p>
//                 )}
//                 {selectedUser.userGrandChildEarning && (
//                   <p>
//                     <strong>Grand-Child Earning :</strong>{" "}
//                     {selectedUser.userGrandChildEarning}%
//                   </p>
//                 )} */}
//                   <p>
//                     <strong>Referral Code :</strong> {selectedUser.referralCode}
//                   </p>
//                   <p>
//                     <strong>Parent :</strong>{" "}
//                     {selectedUser?.parentUser.email ?? "-"} {"("}
//                     {selectedUser?.parentUser.referralCode ?? "-"}
//                     {")"}
//                   </p>
//                   <p>
//                     <strong>Grand Parent :</strong>{" "}
//                     {selectedUser?.grandParent.email ?? "-"} {"("}
//                     {selectedUser?.grandParent.referralCode ?? "-"}
//                     {")"}
//                   </p>
// 
//                   <p>
//                     <strong>Role :</strong> {selectedUser.role}
//                   </p>
//                   <p>
//                     <strong>Status :</strong> {selectedUser.status}
//                   </p>
//                   <p>
//                     <strong>Location :</strong>{" "}
//                     {selectedUser?.userAddress?.state}{" "}
//                     {selectedUser?.userAddress?.city}{" "}
//                     {selectedUser?.userAddress?.country} (
//                     {selectedUser?.ipAddress})
//                   </p>
//                   <p>
//                     <strong>Created Date :</strong>{" "}
//                     {selectedUser?.createdAt
//                       ? formatDate(selectedUser?.createdAt)
//                       : "-"}
//                   </p>
//                 </div>
// 
//                 <div>
//                   <h1 className="font-bold underline mt-5 mb-2">
//                     Notification Preferneces :
//                   </h1>
//                   <p>
//                     <strong>Email Notifications :</strong>{" "}
//                     {selectedUser?.notificationPreferences?.email
//                       ? "Enable"
//                       : "Disabled"}
//                   </p>
//                   <p>
//                     <strong>Order Updates :</strong>{" "}
//                     {selectedUser?.notificationPreferences?.orderUpdates
//                       ? "Enable"
//                       : "Disabled"}
//                   </p>
//                   <p>
//                     <strong>Marketing Emails :</strong>{" "}
//                     {selectedUser?.notificationPreferences?.marketing
//                       ? "Enable"
//                       : "Disabled"}
//                   </p>
//                 </div>
// 
//                 <div>
//                   <h1 className="font-bold underline mt-5 mb-2">
//                     Grandchild Leads Information :
//                   </h1>
//                   {/* <p>
//                     <strong>Child Leads :</strong>{" "}
//                     {selectedUser?.childrenCount ?? 0}
//                   </p>
//                   <p>
//                     <strong>Grandchild Leads :</strong>{" "}
//                     {selectedUser?.grandChildCount ?? 0}
//                   </p> */}
// 
//                   {loadingLeadExports ? (
//                     <p>
//                       <strong>Lead Export Details :</strong> Loading...
//                     </p>
//                   ) : userLeadExports.length === 0 ? (
//                     <>
//                       <p>
//                         <strong>Stripe Number :</strong> -
//                       </p>
//                       <p>
//                         <strong>Cost / Amount :</strong> -
//                       </p>
//                       <p>
//                         <strong>Export Status :</strong> Not Purchased
//                       </p>
//                     </>
//                   ) : (
//                     userLeadExports.map((exp: any, index: number) => {
//                       const expiresAtDate = exp.expiresAt?.toDate
//                         ? exp.expiresAt.toDate()
//                         : exp.expiresAt?.seconds
//                         ? new Date(exp.expiresAt.seconds * 1000)
//                         : exp.expiresAt
//                         ? new Date(exp.expiresAt)
//                         : null;
//                       const isValidExpiry =
//                         expiresAtDate instanceof Date &&
//                         !isNaN(expiresAtDate.getTime());
//                       const isActive =
//                         isValidExpiry && expiresAtDate.getTime() > Date.now();
//                       const diffMs = isActive
//                         ? expiresAtDate.getTime() - Date.now()
//                         : 0;
//                       const daysRemaining = Math.max(
//                         0,
//                         Math.ceil(diffMs / (1000 * 60 * 60 * 24))
//                       );
// 
//                       return (
//                         <div
//                           key={exp.id || index}
//                           className={index > 0 ? "pt-2 mt-2 border-t border-gray-200" : ""}
//                         >
//                           {userLeadExports.length > 1 && (
//                             <p>
//                               <strong>Export #{userLeadExports.length - index}</strong>
//                             </p>
//                           )}
//                           <p>
//                             <strong>Stripe Number :</strong>{" "}
//                             {exp.paymentIntentId || "-"}
//                           </p>
//                           <p>
//                             <strong>Cost / Amount :</strong> $
//                             {Number(exp.amount || 0).toFixed(2)}{" "}
//                             {exp.perLeadFee !== undefined &&
//                               `($${Number(exp.perLeadFee).toFixed(2)}/lead)`}
//                           </p>
//                           <p>
//                             <strong>Leads Exported :</strong>{" "}
//                             {exp.leadCount ?? "-"} leads
//                           </p>
//                           <p>
//                             <strong>Purchase Time :</strong>{" "}
//                             {formatDate(exp.paidAt)}
//                           </p>
//                           <p>
//                             <strong>Access Expiration :</strong>{" "}
//                             {formatDate(exp.expiresAt)}
//                           </p>
//                           <p>
//                             <strong>Status :</strong>{" "}
//                             {isActive
//                               ? `Active (${daysRemaining} ${
//                                   daysRemaining === 1 ? "day" : "days"
//                                 } left)`
//                               : "Expired"}
//                           </p>
//                         </div>
//                       );
//                     })
//                   )}
//                 </div>
//               </div>
//             </>
//           )}
//           <div className="flex justify-end mt-4 pt-4 border-t border-gray-100 shrink-0">
//             <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
//           </div>
//         </AlertDialogContent>
//       </AlertDialog>
// 
//       {/* Delete User Confirmation Dialog */}
//       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//         <AlertDialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
//           <AlertDialogHeader>
//             <div className="flex items-center justify-between">
//               <AlertDialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
//                 <Trash className="w-5 h-5" /> Delete User
//               </AlertDialogTitle>
//               <AlertDialogCancel
//                 disabled={isDeleting}
//                 onClick={() => {
//                   setIsDeleteDialogOpen(false);
//                   setUserToDelete(null);
//                 }}
//                 className="p-1.5 h-auto rounded-full hover:bg-gray-100 border-none shadow-none"
//               >
//                 <X className="w-4 h-4" />
//               </AlertDialogCancel>
//             </div>
//           </AlertDialogHeader>
// 
//           <div className="py-2 text-sm text-gray-600 space-y-3">
//             <p>
//               Are you sure you want to delete{" "}
//               <span className="font-semibold text-gray-900">
//                 {userToDelete?.displayName || userToDelete?.email || "this user"}
//               </span>
//               {userToDelete?.email && (
//                 <span className="text-gray-500 text-xs block">
//                   ({userToDelete.email})
//                 </span>
//               )}
//               ?
//             </p>
//             <p className="text-xs text-muted-foreground">
//               Please choose which delete option you want to perform:
//             </p>
// 
//             <div className="space-y-2.5 pt-1">
//               {/* Soft Delete Option Card */}
//               <div className="p-3 border rounded-lg bg-gray-50 dark:bg-zinc-900/50 space-y-1">
//                 <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
//                   <span className="w-2 h-2 rounded-full bg-amber-500"></span>
//                   1. Soft Delete (Deactivate)
//                 </div>
//                 <div className="text-xs text-muted-foreground">
//                   Changes user status to <strong>Inactive</strong>. User record stays in the database.
//                 </div>
//               </div>
// 
//               {/* Permanent Delete Option Card */}
//               <div className="p-3 border border-red-200 bg-red-50/60 dark:bg-red-950/20 rounded-lg space-y-1">
//                 <div className="font-medium text-red-700 dark:text-red-400 flex items-center gap-1.5">
//                   <span className="w-2 h-2 rounded-full bg-red-600"></span>
//                   2. Permanent Delete
//                 </div>
//                 <div className="text-xs text-red-600/80 dark:text-red-400/80">
//                   Completely and irreversibly removes this user from the Firebase database.
//                 </div>
//               </div>
//             </div>
//           </div>
// 
//           <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 justify-end border-t border-gray-100">
//             <Button
//               variant="outline"
//               disabled={isDeleting}
//               onClick={() => {
//                 setIsDeleteDialogOpen(false);
//                 setUserToDelete(null);
//               }}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="secondary"
//               disabled={isDeleting}
//               onClick={() => handleSoftDelete(userToDelete)}
//               className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
//             >
//               {isDeleting ? "Processing..." : "Soft Delete"}
//             </Button>
//             <Button
//               variant="destructive"
//               disabled={isDeleting}
//               onClick={() => handlePermanentDelete(userToDelete)}
//             >
//               {isDeleting ? "Deleting..." : "Permanent Delete"}
//             </Button>
//           </div>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }
// 

import { redirect } from "next/navigation";

export default function DisabledRoute() {
  redirect("/");
  return null;
}
