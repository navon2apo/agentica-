import { api } from './client';

export const Agent = {
  list: async () => api.get('/agents'),
  get: async (id) => api.get(`/agents/${id}`),
  create: async (payload) => api.post('/agents', payload),
  update: async (id, payload) => api.put(`/agents/${id}`, payload),
  delete: async (id) => api.delete(`/agents/${id}`)
};

export const Customer = {
  list: async () => api.get('/customers'),
  filter: async (filter) => api.post('/customers/search', filter),
  get: async (id) => api.get(`/customers/${id}`),
  create: async (payload) => api.post('/customers', payload),
  update: async (id, payload) => api.put(`/customers/${id}`, payload),
  delete: async (id) => api.delete(`/customers/${id}`)
};

export const ScheduledTask = {
  list: async () => api.get('/scheduled-tasks'),
  get: async (id) => api.get(`/scheduled-tasks/${id}`),
  create: async (payload) => api.post('/scheduled-tasks', payload),
  update: async (id, payload) => api.put(`/scheduled-tasks/${id}`, payload),
  delete: async (id) => api.delete(`/scheduled-tasks/${id}`)
};

export const Activity = {
  list: async () => api.get('/activities')
};

export const User = {
  me: async () => api.get('/auth/me')
};

export const AgentTemplate = {
  list: async () => api.get('/agent-templates'),
  get: async (id) => api.get(`/agent-templates/${id}`),
  create: async (payload) => api.post('/agent-templates', payload),
  update: async (id, payload) => api.put(`/agent-templates/${id}`, payload),
  delete: async (id) => api.delete(`/agent-templates/${id}`)
};