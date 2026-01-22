import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './context/AppProviders';
import { AppRoutes } from './routes';
import { AuthGuard } from './components/auth/AuthGuard';

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AuthGuard />
        <AppRoutes />
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;
