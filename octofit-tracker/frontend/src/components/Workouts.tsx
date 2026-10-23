import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  reason?: string;
};

const defaultUserEmail = 'mona@example.com';

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSuggestions() {
      try {
        setLoading(true);
        const data = await getJson<{ suggestions?: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${defaultUserEmail}`);
        if (!active) return;
        setSuggestions(data.suggestions ?? []);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setSuggestions([]);
        setError(loadError instanceof Error ? `Unable to load workout suggestions: ${loadError.message}` : 'Unable to load workout suggestions.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSuggestions();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      empty={suggestions.length === 0 && !loading && !error}
      emptyMessage="workout suggestions"
    >
      <ul className="list-group list-group-flush">
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title}-${index}`} className="list-group-item">
            <div className="fw-semibold">{suggestion.title}</div>
            {suggestion.reason ? <div className="text-muted">{suggestion.reason}</div> : null}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
