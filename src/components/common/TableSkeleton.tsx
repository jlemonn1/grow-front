import './TableSkeleton.css';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="table-skeleton-container">
      <table className="table-skeleton">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="table-skeleton-header">
                <div className="table-skeleton-shimmer" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="table-skeleton-row">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="table-skeleton-cell">
                  <div className="table-skeleton-shimmer" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
