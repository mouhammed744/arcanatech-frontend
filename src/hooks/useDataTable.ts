import { useState, useCallback } from 'react';
import type { PaginationParams } from '@/types';

interface UseDataTableReturn {
  params: PaginationParams;
  page: number;
  pageSize: number;
  search: string;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortBy: (field: string, order: 'asc' | 'desc') => void;
  resetFilters: () => void;
}

const DEFAULT_PARAMS: PaginationParams = {
  page: 1,
  pageSize: 20,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useDataTable = (initialParams?: Partial<PaginationParams>): UseDataTableReturn => {
  const [params, setParams] = useState<PaginationParams>({ ...DEFAULT_PARAMS, ...initialParams });

  const setSearch = useCallback((search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setParams((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const setSortBy = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setParams((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setParams({ ...DEFAULT_PARAMS, ...initialParams });
  }, [initialParams]);

  return {
    params,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    search: params.search ?? '',
    setSearch,
    setPage,
    setPageSize,
    setSortBy,
    resetFilters,
  };
};
