import React from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NavigationShell } from './components/Dashboard/NavigationShell';
import { OnboardingModal } from './components/Dashboard/OnboardingModal';
import { PrivyShieldProvider, usePrivyShield } from './context/PrivyShieldContext';
import { AuditReports } from './pages/AuditReports';
import { DetectionLab } from './pages/DetectionLab';
import { Overview } from './pages/Overview';
import { PrivacyCenter } from './pages/PrivacyCenter';
import { SanitizeWorkspace } from './pages/SanitizeWorkspace';

const ActivePageRouter: React.FC = () => {
  const { activePage } = usePrivyShield();

  switch (activePage) {
    case 'workspace':
      return <SanitizeWorkspace />;
    case 'lab':
      return <DetectionLab />;
    case 'audit':
      return <AuditReports />;
    case 'privacy':
      return <PrivacyCenter />;
    case 'overview':
    default:
      return <Overview />;
  }
};

export function App() {
  return (
    <ErrorBoundary>
      <PrivyShieldProvider>
        <NavigationShell>
          <ActivePageRouter />
        </NavigationShell>
        <OnboardingModal />
      </PrivyShieldProvider>
    </ErrorBoundary>
  );
}

export default App;
