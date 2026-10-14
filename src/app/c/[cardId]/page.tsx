import { redirect } from "next/navigation";

export default async function TapPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  redirect(`/api/c/${cardId}`);
}
