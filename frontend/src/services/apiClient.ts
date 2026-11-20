import { packRichText, unpackRichText } from '../utils/richText';

type Json = Record<string, unknown>;
type SaveResult = { success: boolean; id?: string; error?: string; data?: unknown };

const JSON_FIELDS = ['subCategoryPrices', 'parameters', 'subCategoryDailyRates', 'subCategoryChargeComponents', 'includedProcedures'];
const BOOLEAN_FIELDS = [
  'isCash',
  'preauthRequired',
  'isActive',
  'isDefault',
  'requiresContrast',
  'oxygenEquipped',
  'cardiacMonitorEquipped',
];
const NUMBER_FIELDS = [
  'cashPrice',
  'dailyRebateAmount',
  'defaultDiscount',
  'copayAmount',
  'creditLimit',
  'durationMinutes',
  'turnaroundMinutes',
  'includedDays',
  'overstayDailyRate',
  'bedCharge',
  'nursingCareCharge',
  'mealsNutritionCharge',
  'dailyReviewCharge',
];

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function readCookie(name: string): string {
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : '';
}

function snakeToCamel(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(snakeToCamel);
  if (!value || typeof value !== 'object') return value;
  const out: Json = {};
  Object.entries(value as Json).forEach(([key, val]) => {
    out[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = snakeToCamel(val);
  });
  return out;
}

class ApiClient {
  private csrfReady = false;

  private async ensureCsrf(): Promise<void> {
    if (this.csrfReady && readCookie('XSRF-TOKEN')) return;
    await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
    this.csrfReady = true;
  }

  async request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET') await this.ensureCsrf();
    const response = await fetch(`/api/${path.replace(/^\//, '')}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...(method !== 'GET' ? { 'X-XSRF-TOKEN': readCookie('XSRF-TOKEN') } : {}),
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { success: false, error: `The server did not answer properly (HTTP ${response.status})` };
    }
    if (response.status === 401 && !path.startsWith('auth/login')) {
      window.dispatchEvent(new CustomEvent('wisecare:signed-out'));
    }
    if (!response.ok || data?.success === false) {
      throw new ApiError(String(data?.error || data?.message || `HTTP ${response.status}`), response.status);
    }
    return data as T;
  }

  get<T = any>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T = any>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
  }

  put<T = any>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) });
  }

  delete<T = any>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  async login(username: string, password: string) {
    await this.ensureCsrf();
    return this.post<{ success: boolean; user: any; rights: string[] }>('auth/login', { username, password });
  }

  async me() {
    return this.get<{ success: boolean; user: any; rights: string[] }>('auth/me');
  }

  async logout() {
    try {
      await this.post('auth/logout', {});
    } finally {
      this.csrfReady = false;
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.post<{ success: boolean; user: any }>('auth/change-password', { currentPassword, newPassword });
  }

  async getEntity(entity: string): Promise<any[]> {
    try {
      const json = await this.get<{ data: any[] }>(`records/${entity}`);
      return Array.isArray(json.data) ? json.data : [];
    } catch (error) {
      console.error(`WiseCare load ${entity}:`, error);
      return [];
    }
  }

  async getEntityOrError(entity: string): Promise<{ rows: any[]; error: string | null }> {
    try {
      const json = await this.get<{ data: any[] }>(`records/${entity}`);
      return { rows: Array.isArray(json.data) ? json.data : [], error: null };
    } catch (error) {
      return { rows: [], error: (error as Error).message };
    }
  }

  async getSetupEntity(entity: string): Promise<any[]> {
    const rows = await this.getEntity(entity);
    return rows.map((row) => this.parseSetupValue(entity, row));
  }

  async persistEntity(entity: string, data: any): Promise<SaveResult> {
    let payload = data;
    if (entity === 'setup-lab-tests') {
      payload = {
        ...payload,
        ...(payload?.clinicalComment ? { clinicalComment: packRichText(unpackRichText(payload.clinicalComment)) } : {}),
        ...(Array.isArray(payload?.parameters)
          ? {
              parameters: payload.parameters.map((p: any) =>
                p?.clinicalComment ? { ...p, clinicalComment: packRichText(unpackRichText(p.clinicalComment)) } : p,
              ),
            }
          : {}),
      };
    }
    try {
      const json = await this.post<{ id: string }>(`records/${entity}`, payload);
      window.dispatchEvent(new CustomEvent('wisecare:save-success', { detail: { entity, id: json.id } }));
      return { success: true, id: json.id };
    } catch (error) {
      const message = (error as Error).message || `Failed to save ${entity}`;
      window.dispatchEvent(new CustomEvent('wisecare:save-error', { detail: { entity, error: message } }));
      return { success: false, error: message };
    }
  }

  async deleteEntity(entity: string, id: string): Promise<SaveResult> {
    try {
      await this.delete(`records/${entity}/${encodeURIComponent(id)}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  persistQueueItem(item: any) {
    return this.persistEntity('queue', item);
  }

  async getPatients(search = ''): Promise<any[]> {
    try {
      const json = await this.get<{ data: any[] }>(`patients${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      return json.data || [];
    } catch (error) {
      console.error('WiseCare patients:', error);
      return [];
    }
  }

  async persistPatient(patient: any): Promise<SaveResult & { visitId?: string | null }> {
    try {
      const exists = typeof patient?.id === 'string' && patient.id.startsWith('P-');
      const json = exists
        ? await this.put<any>(`patients/${encodeURIComponent(patient.id)}`, patient)
        : await this.post<any>('patients', patient);
      window.dispatchEvent(
        new CustomEvent('wisecare:save-success', { detail: { entity: 'patients', id: json.id, message: 'Patient saved.' } }),
      );
      return { success: true, id: json.id, visitId: json.visitId, data: json.data };
    } catch (error) {
      const message = (error as Error).message || 'Failed to save patient';
      window.dispatchEvent(new CustomEvent('wisecare:save-error', { detail: { entity: 'patients', error: message } }));
      return { success: false, error: message };
    }
  }

  async getConsultationCatalog(): Promise<any[]> {
    try {
      const json = await this.get<{ data: any[] }>('catalog/consultations');
      return json.data || [];
    } catch {
      return [];
    }
  }

  async getBranches(): Promise<any[]> {
    try {
      const json = await this.get<{ data: any[] }>('branches');
      return json.data || [];
    } catch {
      return [];
    }
  }

  getCurrentBranchId(): number {
    const value = Number(window.localStorage.getItem('wisecare.branchId') || 1);
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  setCurrentBranchId(id: number): void {
    if (Number(id) > 0) window.localStorage.setItem('wisecare.branchId', String(Number(id)));
  }

  async getStatus(): Promise<{ connected: boolean } | null> {
    try {
      await this.get('auth/me');
      return { connected: true };
    } catch {
      return { connected: false };
    }
  }

  async notAvailable(): Promise<any> {
    return { success: false, error: 'This feature arrives in a later phase of the Laravel version.' };
  }

  getMpesaConfig() {
    return this.notAvailable();
  }

  saveMpesaConfig(_data: unknown) {
    return this.notAvailable();
  }

  testMpesaConfig() {
    return this.notAvailable();
  }

  saveBedChargeComponents(_bedId: number, _components: Record<string, unknown>) {
    return this.notAvailable();
  }

  async getPharmacyOtcSales(_status?: string): Promise<any[]> {
    return [];
  }

  private parseSetupValue(entity: string, row: any): any {
    const x = snakeToCamel(row || {}) as any;
    JSON_FIELDS.forEach((key) => {
      if (x[key] === undefined && typeof x[`${key}Json`] === 'string') x[key] = x[`${key}Json`];
      if (typeof x[key] === 'string') {
        try {
          x[key] = JSON.parse(x[key]);
        } catch {
          x[key] = x[key];
        }
      }
    });
    if (entity === 'setup-lab-tests') {
      if (x.clinicalComment) x.clinicalComment = unpackRichText(x.clinicalComment);
      x.parameters = Array.isArray(x.parameters)
        ? x.parameters.map((p: any) => (p?.clinicalComment ? { ...p, clinicalComment: unpackRichText(p.clinicalComment) } : p))
        : [];
    }
    BOOLEAN_FIELDS.forEach((key) => {
      if (key in x && typeof x[key] !== 'boolean') x[key] = Number(x[key]) === 1 || String(x[key]).toLowerCase() === 'true';
    });
    NUMBER_FIELDS.forEach((key) => {
      if (key in x && x[key] !== null && x[key] !== '') x[key] = Number(x[key]);
    });
    if (entity === 'setup-pharmacy-drugs') x.formulation = x.formulation || x.dosageForm || '';
    return x;
  }
}

export const apiClient = new ApiClient();
