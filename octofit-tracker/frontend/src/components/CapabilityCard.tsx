import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children?: ReactNode;
};

export function CapabilityCard({
  title,
  description,
  loading = false,
  error = null,
  empty = false,
  emptyMessage,
  children,
}: Props) {
  const normalizedTitle = title.toLowerCase();

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <div role="alert" className="alert alert-danger mb-0">{error}</div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p role="status" aria-live="polite">Loading {normalizedTitle}...</p>
        </div>
      </section>
    );
  }

  if (empty) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p className="mb-0">No {emptyMessage ?? normalizedTitle}.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {children}
      </div>
    </section>
  );
}
