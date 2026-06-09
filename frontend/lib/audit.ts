import { api } from './api';

export interface AuditLog {
  _id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export const auditService = {
  async getAuditLogs(page = 1, limit = 20, userId?: string, action?: string, entityType?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (userId) params.append('user_id', userId);
    if (action) params.append('action', action);
    if (entityType) params.append('entity_type', entityType);
    
    const response = await api.get(`/audit-logs?${params}`);
    return response.data;
  },

  async getAuditLog(id: string) {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  },
};
