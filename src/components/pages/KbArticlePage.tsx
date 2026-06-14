import { useEffect, useState } from 'react';
import AuthGate from '../AuthGate';
import KbArticle from '../KbArticle';

export default function KbArticlePage() {
  const [id, setId] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('id');
    const parsed = raw ? Number(raw) : NaN;
    setId(Number.isFinite(parsed) ? parsed : null);
  }, []);

  if (id === undefined) return null;

  if (id === null) {
    return <p className="text-red-600">Missing or invalid article id in URL.</p>;
  }

  return (
    <AuthGate>
      <KbArticle number={id} />
    </AuthGate>
  );
}
