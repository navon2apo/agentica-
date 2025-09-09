import { api } from './client';

export const googleOAuth = (body) => api.post('/google/oauth', body);

export const sendGmail = (body) => api.post('/google/gmail', body);

export const googleCalendar = (body) => api.post('/google/calendar', body);

export const googleDrive = (body) => api.post('/google/drive', body);

export const googleSheets = (body) => api.post('/google/sheets', body);

export const googleDocs = (body) => api.post('/google/docs', body);

export const runScheduledTask = (body) => api.post('/scheduled-tasks/run', body);