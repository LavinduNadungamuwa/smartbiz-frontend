import client from './axiosClient';

export const getDashboardSummary = () => client.get('/api/dashboard/summary');
