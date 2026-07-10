import React from 'react';
import Button from '../../../components/ui/Button';
import { BundlesCopy } from '../translations';

interface BundleTagScoresPaginationProps {
  copy: BundlesCopy;
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const BundleTagScoresPagination: React.FC<BundleTagScoresPaginationProps> = ({
  copy,
  page,
  limit,
  totalItems,
  totalPages,
  onPageChange,
  onLimitChange,
}) => {
  if (totalItems === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);
  const paginationCopy = copy.detailPage.tagEvaluation.pagination;

  return (
    <div className='flex flex-col gap-4 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
      <p className='text-sm text-gray-500'>
        {paginationCopy.showing
          .replace('{from}', String(from))
          .replace('{to}', String(to))
          .replace('{total}', String(totalItems))}
      </p>

      <div className='flex flex-wrap items-center gap-3'>
        <label className='flex items-center gap-2 text-sm text-gray-600'>
          <span>{paginationCopy.rowsPerPage}</span>
          <select
            value={limit}
            onChange={event => onLimitChange(Number(event.target.value))}
            className='rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700'
          >
            {PAGE_SIZE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {paginationCopy.previous}
          </Button>
          <span className='min-w-16 text-center text-sm font-medium text-gray-700'>
            {page} / {Math.max(totalPages, 1)}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {paginationCopy.next}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BundleTagScoresPagination;
