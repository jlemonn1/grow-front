import { useNavigate } from 'react-router-dom';
import { HiSearch } from 'react-icons/hi';
import { EmptyState } from '@/components/common/EmptyState';
import './NotFoundPage.css';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <EmptyState
        message="Página no encontrada"
        icon={<HiSearch />}
        action={{
          label: 'Volver al inicio',
          onClick: () => navigate('/sales/new'),
        }}
      />
    </div>
  );
}
