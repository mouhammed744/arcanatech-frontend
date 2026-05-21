import { useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { setPageTitle } from '@/store/slices/uiSlice';

export const usePageTitle = (title: string) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    document.title = `${title} — ARCANA TECH`;
    dispatch(setPageTitle(title));
  }, [title, dispatch]);
};
