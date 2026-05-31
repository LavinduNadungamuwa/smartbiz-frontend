import { useCallback, useEffect, useMemo, useState } from 'react';
import client from './axiosClient';

const endpoints = {
  summary: '/api/dashboard/summary',
  customers: '/api/customers',
  products: '/api/products',
  suppliers: '/api/suppliers',
  sales: '/api/sales',
  invoices: '/api/invoices',
  expenses: '/api/expenses',
};

export function useBusinessData() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    data: emptyBusinessData,
  });

  const fetchBusinessData = useCallback(async () => {
    const [summary, customers, products, suppliers, sales, invoices, expenses] = await Promise.all([
      client.get(endpoints.summary),
      client.get(endpoints.customers),
      client.get(endpoints.products),
      client.get(endpoints.suppliers),
      client.get(endpoints.sales),
      client.get(endpoints.invoices),
      client.get(endpoints.expenses),
    ]);

    return {
      summary: summary.data || {},
      customers: customers.data || [],
      products: products.data || [],
      suppliers: suppliers.data || [],
      sales: sales.data || [],
      invoices: invoices.data || [],
      expenses: expenses.data || [],
    };
  }, []);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));

    try {
      const data = await fetchBusinessData();
      setState({
        loading: false,
        error: '',
        data,
      });
    } catch (err) {
      setState({
        loading: false,
        error: err.response?.data?.message || err.message || 'Unable to load SmartBiz data.',
        data: emptyBusinessData,
      });
    }
  }, [fetchBusinessData]);

  useEffect(() => {
    let isActive = true;

    async function loadInitialData() {
      try {
        const data = await fetchBusinessData();
        if (!isActive) return;
        setState({ loading: false, error: '', data });
      } catch (err) {
        if (!isActive) return;
        setState({
          loading: false,
          error: err.response?.data?.message || err.message || 'Unable to load SmartBiz data.',
          data: emptyBusinessData,
        });
      }
    }

    loadInitialData();

    return () => {
      isActive = false;
    };
  }, [fetchBusinessData]);

  return useMemo(() => ({ ...state, reload: load }), [state, load]);
}

export const askAi = (question) => client.post('/api/ai/ask', { question });

const emptyBusinessData = {
  summary: {},
  customers: [],
  products: [],
  suppliers: [],
  sales: [],
  invoices: [],
  expenses: [],
};
