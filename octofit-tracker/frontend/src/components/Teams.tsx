import { useEffect, useState } from 'react';
import { getJson, postJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name: string;
  mascot: string;
  members: string[];
};

type TeamForm = {
  name: string;
  mascot: string;
};

const emptyForm: TeamForm = { name: '', mascot: '' };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TeamForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  async function loadTeams() {
    try {
      setLoading(true);
      const data = await getJson<{ teams?: Team[] }>('/api/teams');
      setTeams(data.teams ?? []);
      setError(null);
    } catch (loadError) {
      setTeams([]);
      setError(loadError instanceof Error ? `Unable to load teams: ${loadError.message}` : 'Unable to load teams.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTeams();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      mascot: form.mascot.trim(),
    };

    if (!payload.name || !payload.mascot) {
      setError('Please provide both the team name and mascot.');
      return;
    }

    try {
      setSubmitting(true);
      await postJson('/api/teams', payload);
      setForm(emptyForm);
      await loadTeams();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create team.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      empty={teams.length === 0 && !loading && !error}
      emptyMessage="teams"
    >
      <form className="row g-2 mb-3" onSubmit={handleSubmit}>
        <div className="col-md-5">
          <label className="form-label">Team name</label>
          <input className="form-control" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        </div>
        <div className="col-md-5">
          <label className="form-label">Mascot</label>
          <input className="form-control" value={form.mascot} onChange={(event) => setForm((current) => ({ ...current, mascot: event.target.value }))} />
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
            {submitting ? 'Saving' : 'Create'}
          </button>
        </div>
      </form>

      <ul className="list-group list-group-flush">
        {teams.map((team) => (
          <li key={team.name} className="list-group-item">
            <div className="fw-semibold">{team.name}</div>
            <div className="text-muted">Mascot: {team.mascot}</div>
            <div className="text-muted">{team.members?.length ? team.members.join(', ') : 'No members assigned.'}</div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
