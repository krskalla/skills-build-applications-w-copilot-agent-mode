import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      try {
        setLoading(true);
        const data = await getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard');
        if (!active) return;
        setEntries(data.leaderboard ?? []);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setEntries([]);
        setError(loadError instanceof Error ? `Unable to load leaderboard: ${loadError.message}` : 'Unable to load leaderboard.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadLeaderboard();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      empty={entries.length === 0 && !loading && !error}
      emptyMessage="leaderboard data"
    >
      <ol className="list-group list-group-numbered">
        {entries.map((entry) => (
          <li key={`${entry.rank}-${entry.teamName}`} className="list-group-item d-flex justify-content-between align-items-center">
            <span>
              #{entry.rank} {entry.teamName}
            </span>
            <span className="badge text-bg-primary rounded-pill">{entry.totalPoints} pts</span>
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
