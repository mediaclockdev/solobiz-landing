import { redirect } from "next/navigation";

export default function DashboardMyAccessoriesPage() {
  redirect("/dashboard/settings?tab=my-accessories");
}
