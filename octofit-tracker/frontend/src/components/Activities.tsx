import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type: string;
  minutes: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadActivities() {
      try {
        setLoading(true);
        const data = await getJson<{ activities?: Activity[] }>('/api/activities');
        if (!active) return;
        setActivities(data.activities ?? []);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setActivities([]);
        setError(loadError instanceof Error ? `Unable to load activities: ${loadError.message}` : 'Unable to load activities.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadActivities();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error}
      empty={activities.length === 0 && !loading && !error}
      emptyMessage="activities"
    >
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity.type}-${activity.minutes}-${index}`} className="list-group-item">
            <span className="fw-semibold">{activity.type}</span>
            <span className="text-muted"> · {activity.minutes} minutes</span>
            {typeof activity.points === 'number' ? <span> · {activity.points} pts</span> : null}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
