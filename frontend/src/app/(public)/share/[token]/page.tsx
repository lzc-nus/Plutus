import SharedFinancialProfile from "@/components/public/SharedFinancialProfile";

export default async function SharedFinancialProfilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SharedFinancialProfile token={token} />;
}
