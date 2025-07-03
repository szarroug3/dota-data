import ClientMatchHistoryPage from './ClientMatchHistoryPage';

export default async function MatchHistoryPage({ searchParams }: { searchParams: Promise<{ match?: string }> }) {
  const { match: selectedMatchId = null } = await searchParams;

  return (
    <ClientMatchHistoryPage selectedMatchId={selectedMatchId} />
  );
}
