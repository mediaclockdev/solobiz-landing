// ============================================================================
// COMMENTED OUT FOR FUNNEL-ONLY DEPLOYMENT:
// This repo only serves the welcome funnel (/, /login, /signup, /forgot).
// To restore this page, uncomment the code below.
// ============================================================================
// 
// 
// 
// import BusinessCardSlider from "@/components/BusinessCardSlider";
// 
// export default function Home() {
//   return (
//     <div>
//       <BusinessCardSlider />
//     </div>
//   );
// }
// 

import { redirect } from "next/navigation";

export default function DisabledRoute() {
  redirect("/");
  return null;
}
