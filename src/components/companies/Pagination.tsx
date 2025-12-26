'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-gray-500">
        Showing {totalItems} {totalItems === 1 ? 'company' : 'companies'}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      {/* Item count */}
      <div className="text-sm text-gray-500 order-2 sm:order-1">
        Showing <span className="font-medium text-gray-700">{startItem}</span> to{' '}
        <span className="font-medium text-gray-700">{endItem}</span> of{' '}
        <span className="font-medium text-gray-700">{totalItems}</span> companies
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* First page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-[#1e3a5f] disabled:opacity-40"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-[#1e3a5f] disabled:opacity-40"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 text-sm font-medium transition-colors',
                  currentPage === page
                    ? 'bg-[#1e3a5f] text-white hover:bg-[#1e3a5f] hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-[#1e3a5f]'
                )}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )
          )}
        </div>

        {/* Next page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-[#1e3a5f] disabled:opacity-40"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-[#1e3a5f] disabled:opacity-40"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
