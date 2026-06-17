import client from './axiosClient';

export const getExpenses = () => client.get('/api/expenses');
export const getExpenseById = (id) => client.get(`/api/expenses/${id}`);
export const createExpense = (data) => client.post('/api/expenses', data);
export const updateExpense = (id, data) => client.put(`/api/expenses/${id}`, data);
export const deleteExpense = (id) => client.delete(`/api/expenses/${id}`);
