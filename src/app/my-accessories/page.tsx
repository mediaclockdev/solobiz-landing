import { redirect } from "next/navigation";

export default function MyAccessoriesPage() {
  redirect("/dashboard/settings?tab=my-accessories");
}
