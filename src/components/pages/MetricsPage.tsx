import AuthGate from '../AuthGate';
import MetricsDashboard from '../MetricsDashboard';

export default function MetricsPage() {
  return (
    <AuthGate>
      <h1 className="mb-4 text-xl font-semibold">Metrics</h1>
      <MetricsDashboard />
    </AuthGate>
  );
}
