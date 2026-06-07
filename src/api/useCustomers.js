import client from './axiosClient';

export const getCustomers = () => client.get('/api/customers');
export const getCustomerById = (id) => client.get(`/api/customers/${id}`);
export const createCustomer = (data) => client.post('/api/customers', data);
export const updateCustomer = (id, data) => client.put(`/api/customers/${id}`, data);
export const deleteCustomer = (id) => client.delete(`/api/customers/${id}`);
