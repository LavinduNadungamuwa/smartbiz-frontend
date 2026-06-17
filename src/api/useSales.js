import client from './axiosClient';

export const getSales = () => client.get('/api/sales');
export const getSaleById = (id) => client.get(`/api/sales/${id}`);
export const createSale = (data) => client.post('/api/sales', data);
export const updateSale = (id, data) => client.put(`/api/sales/${id}`, data);
export const deleteSale = (id) => client.delete(`/api/sales/${id}`);
export const getSaleItems = () => client.get('/api/sale-items');
