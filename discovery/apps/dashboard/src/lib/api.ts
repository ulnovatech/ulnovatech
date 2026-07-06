export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Dev-User': 'operator',
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const err = data?.error;
    const message =
      typeof err === 'string' ? err : err?.message ?? JSON.stringify(err) ?? 'Request failed';
    throw new Error(message);
  }
  return data as T;
}
