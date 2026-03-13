export const SENSORBIO_BASE_URL = 'https://api.getsensr.io';

export type OrgUser = {
  id: string;
  name?: string;
  email?: string;
};

export type SleepApiItem = {
  start_timestamp?: string;
  end_timestamp?: string;
  light_sleep_mins?: number;
  deep_sleep_mins?: number;
  rem_sleep_mins?: number;
  awake_time_mins?: number;
  fall_asleep_mins?: number;
  biometrics?: {
    resting_bpm?: number;
    resting_hrv?: number;
    hrv?: number;
    bpm?: number;
  };
  score?: {
    value?: number;
    meta?: unknown;
  };
};

export type SleepDay = {
  date: string; // YYYY-MM-DD
  hasData: boolean;
  score?: number;
  totalMins?: number;
  lightMins?: number;
  deepMins?: number;
  remMins?: number;
  awakeMins?: number;
  latencyMins?: number;
  restingHr?: number;
  hrv?: number;
};

function authHeaders(apiKey: string) {
  return {
    Authorization: `APIKey ${apiKey}`,
  };
}

export async function fetchOrgUsers(apiKey: string, signal?: AbortSignal): Promise<OrgUser[]> {
  const url = `${SENSORBIO_BASE_URL}/v1/organizations/users?page=1&items_per_page=100`;
  const res = await fetch(url, { headers: authHeaders(apiKey), signal });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch users (${res.status}). ${text}`);
  }
  const json = (await res.json()) as { users?: OrgUser[] };
  return (json.users ?? []).filter((u) => u && u.id);
}

export async function fetchSleepForDate(apiKey: string, userId: string, date: string, signal?: AbortSignal) {
  const url = `${SENSORBIO_BASE_URL}/v1/sleep?user_id=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}`;
  const res = await fetch(url, { headers: authHeaders(apiKey), signal });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch sleep for ${date} (${res.status}). ${text}`);
  }
  const json = (await res.json()) as { data?: SleepApiItem[] };
  return json.data ?? [];
}
