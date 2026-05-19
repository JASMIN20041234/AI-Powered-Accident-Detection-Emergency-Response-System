import client from './client';

export const getDevices      = ()     => client.get('/devices');
export const registerDevice  = (data) => client.post('/devices/register', data);
