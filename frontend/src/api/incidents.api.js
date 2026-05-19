import client from './client';

export const getIncidents   = ()     => client.get('/incidents');
export const createIncident = (data) => client.post('/incidents', data);
export const clearIncidents = ()     => client.delete('/incidents');
export const dispatchAlert  = (incident_id) => client.post('/incidents/dispatch',  { incident_id });
export const testSend       = (phone, apikey) => client.post('/incidents/test-send', { phone, apikey });
