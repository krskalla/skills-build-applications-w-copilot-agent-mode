import { useEffect, useState } from 'react';
import { deleteJson, getJson, postJson, putJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  _id?: string;
  user?: string | { _id?: string };
  team?: string | { _id?: string };
  userId?: string;
  teamId?: string;
  type: string;
  minutes: number;
  points?: number;
};

type ActivityForm = {
  userId: string;
  teamId: string;
  type: string;
  minutes: string;
};

const emptyForm: ActivityForm = { userId: '', teamId: '', type: '', minutes: '' };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ActivityForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadActivities() {
    try {
      setLoading(true);
      const data = await getJson<{ activities?: Activity[] }>('/api/activities');
      setActivities(data.activities ?? []);
      setError(null);
    } catch (loadError) {
      setActivities([]);
      setError(loadError instanceof Error ? `Unable to load activities: ${loadError.message}` : 'Unable to load activities.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadActivities();
  }, []);

  function updateForm(field: keyof ActivityForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      userId: form.userId.trim(),
      teamId: form.teamId.trim(),
      type: form.type.trim(),
      minutes: Number(form.minutes),
    };

    if (!payload.userId || !payload.teamId || !payload.type || !Number.isFinite(payload.minutes) || payload.minutes <= 0) {
      setError('Please provide a valid user ID, team ID, type, and minutes value.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await putJson(`/api/activities/${editingId}`, payload);
      } else {
        await postJson('/api/activities', payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadActivities();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save activity.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(activity: Activity) {
    const userId = typeof activity.user === 'string' ? activity.user : activity.user?._id ?? activity.userId ?? '';
    const teamId = typeof activity.team === 'string' ? activity.team : activity.team?._id ?? activity.teamId ?? '';
    setEditingId(activity._id ?? null);
    setForm({
      userId,
      teamId,
      type: activity.type,
      minutes: String(activity.minutes),
    });
    setError(null);
  }

  async function handleDelete(activityId?: string) {
    if (!activityId) return;
    try {
      await deleteJson(`/api/activities/${activityId}`);
      await loadActivities();
      if (editingId === activityId) {
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete activity.');
    }
  }

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error}
      empty={activities.length === 0 && !loading && !error}
      emptyMessage="activities"
    >
      <form className="row g-2 mb-3" onSubmit={handleSubmit}>
        <div className="col-md-3">
          <label className="form-label">User ID</label>
          <input className="form-control" value={form.userId} onChange={(event) => updateForm('userId', event.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Team ID</label>
          <input className="form-control" value={form.teamId} onChange={(event) => updateForm('teamId', event.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Type</label>
          <input className="form-control" value={form.type} onChange={(event) => updateForm('type', event.target.value)} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Minutes</label>
          <input type="number" min="1" className="form-control" value={form.minutes} onChange={(event) => updateForm('minutes', event.target.value)} />
        </div>
        <div className="col-md-1 d-flex align-items-end">
          <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
            {submitting ? 'Saving' : editingId ? 'Save' : 'Add'}
          </button>
        </div>
      </form>

      {editingId ? (
        <button type="button" className="btn btn-link p-0 mb-3" onClick={() => { setEditingId(null); setForm(emptyForm); setError(null); }}>
          Cancel edit
        </button>
      ) : null}

      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity._id ?? activity.type}-${activity.minutes}-${index}`} className="list-group-item d-flex justify-content-between align-items-start gap-3">
            <div>
              <span className="fw-semibold">{activity.type}</span>
              <span className="text-muted"> · {activity.minutes} minutes</span>
              {typeof activity.points === 'number' ? <span> · {activity.points} pts</span> : null}
            </div>
            <div className="btn-group btn-group-sm" role="group" aria-label={`Activity actions for ${activity.type}`}>
              <button type="button" className="btn btn-outline-secondary" onClick={() => handleEdit(activity)}>Edit</button>
              <button type="button" className="btn btn-outline-danger" onClick={() => handleDelete(activity._id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
