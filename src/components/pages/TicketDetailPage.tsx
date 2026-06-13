import { useEffect, useState } from 'react';
import AuthGate from '../AuthGate';
import TicketDetail from '../TicketDetail';

export default function TicketDetailPage() {
  const [id, setId] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('id');
    const parsed = raw ? Number(raw) : NaN;
    setId(Number.isFinite(parsed) ? parsed : null);
  }, []);

  if (id === undefined) return null;

  if (id === null) {
    return <p className="text-red-600">Missing or invalid ticket id in URL.</p>;
  }

  return (
    <AuthGate>
      <TicketDetail number={id} />
    </AuthGate>
  );
}
