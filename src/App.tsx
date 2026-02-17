import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './context/AppProviders';
import { AppRoutes } from './routes';
import { AuthGuard } from './components/auth/AuthGuard';
import { useColorAccessibility } from './hooks/useColorAccessibility';

function AppContent() {
  // Aplicar modo de accesibilidad de color
  useColorAccessibility();
  
  return (
    <>
      <AuthGuard />
      <AppRoutes />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;
