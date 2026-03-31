'use server';

import { revalidatePath } from 'next/cache';
import { logInfo, logError } from './logger';

const API_URL = process.env.API_URL || 'http://localhost:8080';

export interface Post {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ActionResult {
  success: boolean;
  data?: Post;
  error?: string;
}

export async function getPosts(): Promise<Post[]> {
  logInfo('getPosts', 'START', { apiUrl: API_URL });

  try {
    logInfo('getPosts', 'FETCH_REQUEST', { url: `${API_URL}/posts`, method: 'GET' });

    const res = await fetch(`${API_URL}/posts`, {
      cache: 'no-store',
    });

    logInfo('getPosts', 'FETCH_RESPONSE', { status: res.status, statusText: res.statusText });

    if (!res.ok) {
      const errorBody = await res.text();
      logError('getPosts', 'FETCH_ERROR', `HTTP ${res.status}: ${res.statusText}`, { body: errorBody });
      const error = await res.json().catch(() => ({ message: 'Failed to fetch posts' }));
      throw new Error(error.message || 'Failed to fetch posts');
    }

    const posts = await res.json();
    logInfo('getPosts', 'SUCCESS', { count: posts.length });
    return posts;
  } catch (error) {
    logError('getPosts', 'ERROR', error as Error, { apiUrl: API_URL });
    return [];
  }
}

export async function createPost(formData: FormData): Promise<ActionResult> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  logInfo('createPost', 'START', { apiUrl: API_URL, name, description });

  if (!name || !description) {
    logError('createPost', 'VALIDATION_ERROR', 'Name and description are required', { name: !!name, description: !!description });
    return { success: false, error: 'Name and description are required' };
  }

  try {
    logInfo('createPost', 'FETCH_REQUEST', {
      url: `${API_URL}/posts`,
      method: 'POST',
      body: { name, description }
    });

    const res = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });

    const responseBody = await res.text();
    logInfo('createPost', 'FETCH_RESPONSE', {
      status: res.status,
      statusText: res.statusText,
      body: responseBody
    });

    if (!res.ok) {
      logError('createPost', 'FETCH_ERROR', `HTTP ${res.status}: ${res.statusText}`, { body: responseBody });
      const error = JSON.parse(responseBody);
      return { success: false, error: error.message || 'Failed to create post' };
    }

    const post = JSON.parse(responseBody);
    logInfo('createPost', 'SUCCESS', { postId: post.id });
    revalidatePath('/posts');
    return { success: true, data: post };
  } catch (error) {
    logError('createPost', 'ERROR', error as Error, { apiUrl: API_URL, name, description });
    return { success: false, error: 'Failed to create post' };
  }
}

export async function updatePost(id: number, formData: FormData): Promise<ActionResult> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  logInfo('updatePost', 'START', { apiUrl: API_URL, id, name, description });

  if (!name || !description) {
    logError('updatePost', 'VALIDATION_ERROR', 'Name and description are required', { id, name: !!name, description: !!description });
    return { success: false, error: 'Name and description are required' };
  }

  try {
    logInfo('updatePost', 'FETCH_REQUEST', {
      url: `${API_URL}/posts?id=${id}`,
      method: 'PUT',
      body: { name, description }
    });

    const res = await fetch(`${API_URL}/posts?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });

    const responseBody = await res.text();
    logInfo('updatePost', 'FETCH_RESPONSE', {
      status: res.status,
      statusText: res.statusText,
      body: responseBody
    });

    if (!res.ok) {
      logError('updatePost', 'FETCH_ERROR', `HTTP ${res.status}: ${res.statusText}`, { body: responseBody });
      const error = JSON.parse(responseBody);
      return { success: false, error: error.message || 'Failed to update post' };
    }

    const post = JSON.parse(responseBody);
    logInfo('updatePost', 'SUCCESS', { postId: post.id });
    revalidatePath('/posts');
    return { success: true, data: post };
  } catch (error) {
    logError('updatePost', 'ERROR', error as Error, { apiUrl: API_URL, id });
    return { success: false, error: 'Failed to update post' };
  }
}

export async function deletePost(id: number): Promise<ActionResult> {
  logInfo('deletePost', 'START', { apiUrl: API_URL, id });

  try {
    logInfo('deletePost', 'FETCH_REQUEST', {
      url: `${API_URL}/posts?id=${id}`,
      method: 'DELETE'
    });

    const res = await fetch(`${API_URL}/posts?id=${id}`, {
      method: 'DELETE',
    });

    const responseBody = await res.text();
    logInfo('deletePost', 'FETCH_RESPONSE', {
      status: res.status,
      statusText: res.statusText,
      body: responseBody
    });

    if (!res.ok) {
      logError('deletePost', 'FETCH_ERROR', `HTTP ${res.status}: ${res.statusText}`, { body: responseBody });
      const error = JSON.parse(responseBody);
      return { success: false, error: error.message || 'Failed to delete post' };
    }

    logInfo('deletePost', 'SUCCESS', { id });
    revalidatePath('/posts');
    return { success: true };
  } catch (error) {
    logError('deletePost', 'ERROR', error as Error, { apiUrl: API_URL, id });
    return { success: false, error: 'Failed to delete post' };
  }
}
