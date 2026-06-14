import AuthGate from '../AuthGate';
import NewArticleForm from '../NewArticleForm';

export default function NewArticlePage() {
  return (
    <AuthGate>
      <NewArticleForm />
    </AuthGate>
  );
}
