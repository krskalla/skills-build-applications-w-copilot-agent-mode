import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      try {
        setLoading(true);
        const data = await getJson<{ teams?: Team[] }>('/api/teams');
        if (!active) return;
        setTeams(data.teams ?? []);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setTeams([]);
        setError(loadError instanceof Error ? `Unable to load teams: ${loadError.message}` : 'Unable to load teams.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTeams();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      empty={teams.length === 0 && !loading && !error}
      emptyMessage="teams"
    >
      <ul className="list-group list-group-flush">
        {teams.map((team) => (
          <li key={team.name} className="list-group-item">
            <div className="fw-semibold">{team.name}</div>
            <div className="text-muted">{team.members.join(', ') || 'No members assigned.'}</div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
