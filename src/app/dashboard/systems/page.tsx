// ============================================================================
// COMMENTED OUT FOR FUNNEL-ONLY DEPLOYMENT:
// This repo only serves the welcome funnel (/, /login, /signup, /forgot).
// To restore this page, uncomment the code below.
// ============================================================================
// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { auth, db } from "@/services/firebase";
// import { doc, getDoc } from "firebase/firestore";
// import Systems from "@/pageComponents/dashboard/Systems";
// 
// export default function SystemsPage() {
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();
// 
//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged(async (user) => {
//       if (!user) {
//         router.push("/login");
//         return;
//       }
// 
//       const snap = await getDoc(doc(db, "users", user.uid));
// 
//       // If user doc doesn't exist OR role is not admin
//       if (!snap.exists() || snap.data()?.role !== "admin") {
//         router.push("/");
//         return;
//       }
// 
//       setLoading(false);
//     });
// 
//     return () => unsubscribe();
//   }, [router]);
// 
//   if (loading) return <p>Loading...</p>;
// 
//   return <Systems />;
// }
// 

import { redirect } from "next/navigation";

export default function DisabledRoute() {
  redirect("/");
  return null;
}
