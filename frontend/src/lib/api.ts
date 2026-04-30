import createClient from 'openapi-fetch';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { paths } from './openapi';

const baseUrl = process.env.API_URL || 'http://localhost:8080';
const COOKIE_NAME = 'auth_token';

async function authFetch(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    redirect('/login');
  }

  return response;
}

export const api = createClient<paths>({
  baseUrl,
  fetch: authFetch,
});

export type { paths };
