// ============================================================================
// COMMENTED OUT FOR FUNNEL-ONLY DEPLOYMENT:
// This repo only serves the welcome funnel (/, /login, /signup, /forgot).
// To restore this page, uncomment the code below.
// ============================================================================
// "use client";
// import ReCAPTCHA from "react-google-recaptcha";
// import React, { useState, useRef } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/contexts/ToastContext";
// import { doc, increment, setDoc } from "firebase/firestore";
// import { db } from "@/services/firebase";
// 
// export default function ContactUs() {
//   const [formData, setFormData] = useState({
//     userName: "",
//     userEmail: "",
//     subject: "",
//     issueDescription: "",
//   });
// 
//   const [loading, setLoading] = useState(false);
//   const { showToast } = useToast();
//   const recaptchaRef = useRef(null);
//   const [captchaToken, setCaptchaToken] = useState(null);
// 
//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.id]: e.target.value });
//   };
// 
//   const handleSubmit = async (e) => {
//     e.preventDefault();
// 
//     // Basic validation
//     if (
//       !formData.userName.trim() ||
//       !formData.userEmail.trim() ||
//       !formData.subject.trim() ||
//       !formData.issueDescription.trim()
//     ) {
//       showToast("Please fill out all required fields.", "error");
//       return;
//     }
//     if (!captchaToken) {
//       showToast("Please verify that you are not a robot.", "error");
//       return;
//     }
// 
//     setLoading(true);
//     try {
//       const res = await fetch("/api/send-support-email", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...formData,
//           captchaToken,
//           action: "Contact",
//         }),
//       });
// 
//       // Update "public" count in the same collection
//       const docRef = doc(db, "support", "public");
//       await setDoc(docRef, { count: increment(1) }, { merge: true });
// 
//       if (res.ok) {
//         showToast("Your message has been sent successfully!", "success");
//         setFormData({
//           userName: "",
//           userEmail: "",
//           subject: "",
//           issueDescription: "",
//         });
//         recaptchaRef.current?.reset();
//         setCaptchaToken(null);
//       } else {
//         showToast("Failed to send message. Please try again later.", "error");
//       }
//     } catch (error) {
//       showToast("Something went wrong. Please try again.", "error");
//     } finally {
//       setLoading(false);
//     }
//   };
// 
//   return (
//     <div className="max-w-2xl mx-auto mt-10">
//       {/* <h1 className="text-3xl font-bold text-gray-900 mb-4">
//         Get in Touch with Us
//       </h1> */}
//       {/* <p className="text-gray-600 mb-10">
//         Have questions, suggestions, or need support? Fill out the form below
//         and our team will get back to you as soon as possible.
//       </p> */}
// 
//       <Card className="pt-6">
//         {/* <CardHeader>
//           <CardTitle className="text-lg font-semibold text-gray-900">
//             Contact Us
//           </CardTitle>
//         </CardHeader> */}
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* Name and Email */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 {/* <Label htmlFor="userName">Your Name</Label> */}
//                 <Input
//                   id="userName"
//                   placeholder="Enter your name"
//                   value={formData.userName}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
// 
//               <div className="space-y-2">
//                 {/* <Label htmlFor="userEmail">Your Email</Label> */}
//                 <Input
//                   id="userEmail"
//                   type="email"
//                   placeholder="Enter your email"
//                   value={formData.userEmail}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>
// 
//             {/* Dropdown Field */}
//             <div className="space-y-2">
//               {/* <Label htmlFor="issueType">Select Topic</Label> */}
//               <select
//                 id="subject"
//                 value={formData.subject}
//                 onChange={handleChange}
//                 required
//                 className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">-- Select an option --</option>
//                 <option value="Report a bug">Report a bug</option>
//                 <option value="Cancellation">Cancellation</option>
//                 <option value="Tech support">Tech support</option>
//                 <option value="Suggestions">Suggestions</option>
//                 <option value="How to earn income">How to earn income</option>
//               </select>
//             </div>
// 
//             {/* Message Field */}
//             <div className="space-y-2">
//               {/* <Label htmlFor="issueDescription">Message</Label> */}
//               <Textarea
//                 id="issueDescription"
//                 placeholder="Type your message (max 2000 characters)..."
//                 rows={4}
//                 maxLength={2000}
//                 value={formData.issueDescription}
//                 onChange={handleChange}
//                 required
//               />
//               <p className="text-xs text-gray-500">
//                 {formData.issueDescription.length}/2000 characters
//               </p>
//             </div>
//             
//             <div className="justify-center">
//               <ReCAPTCHA
//                 ref={recaptchaRef}
//                 sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
//                 onChange={(token) => setCaptchaToken(token)}
//               />
//             </div>
// 
//             <Button type="submit" disabled={loading} className="w-full">
//               {loading ? "Sending..." : "Send Message"}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
// 

import { redirect } from "next/navigation";

export default function DisabledRoute() {
  redirect("/");
  return null;
}
