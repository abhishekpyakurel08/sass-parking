import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@parksaas:offline_queue';

export type OfflineOpType = 'CHECK_IN' | 'CHECK_OUT' | 'PAYMENT';

export interface OfflineOperation {
  id: string;             // local UUID for dedup
  type: OfflineOpType;
  data: Record<string, any>;
  queued_at: string;      // ISO timestamp
  retry_count: number;
}

/** Load the full queue from storage */
export async function loadQueue(): Promise<OfflineOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Persist the queue to storage */
export async function saveQueue(queue: OfflineOperation[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Append a single operation to the queue */
export async function enqueue(type: OfflineOpType, data: Record<string, any>): Promise<OfflineOperation> {
  const op: OfflineOperation = {
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    data,
    queued_at: new Date().toISOString(),
    retry_count: 0,
  };
  const queue = await loadQueue();
  queue.push(op);
  await saveQueue(queue);
  return op;
}

/** Remove successfully synced operations by their ids */
export async function removeFromQueue(ids: string[]): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(queue.filter(op => !ids.includes(op.id)));
}

/** Clear the entire queue */
export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

/** Determine if an axios error is a network error (no connectivity) */
export function isNetworkError(err: any): boolean {
  // Axios sets message = 'Network Error' when no response is received
  return !err?.response && (err?.message === 'Network Error' || err?.code === 'ECONNABORTED');
}
