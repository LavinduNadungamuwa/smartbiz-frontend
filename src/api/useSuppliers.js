import client from './axiosClient';

export const getSuppliers = () => client.get('/api/suppliers');
export const getSupplierById = (id) => client.get(`/api/suppliers/${id}`);
export const createSupplier = (data) => client.post('/api/suppliers', data);
export const updateSupplier = (id, data) => client.put(`/api/suppliers/${id}`, data);
export const deleteSupplier = (id) => client.delete(`/api/suppliers/${id}`);
