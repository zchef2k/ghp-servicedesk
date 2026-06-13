import AuthGate from '../AuthGate';
import NewTicketForm from '../NewTicketForm';

export default function NewTicketPage() {
  return (
    <AuthGate>
      <NewTicketForm />
    </AuthGate>
  );
}
