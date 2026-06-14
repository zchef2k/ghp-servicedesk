import AuthGate from '../AuthGate';
import KbList from '../KbList';

export default function KbListPage() {
  return (
    <AuthGate>
      <KbList />
    </AuthGate>
  );
}
