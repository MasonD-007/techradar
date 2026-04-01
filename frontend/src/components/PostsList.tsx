'use client';

import { useOptimistic, useState, useRef } from 'react';
import { toast } from 'sonner';
import { createPost, updatePost, deletePost, type Post } from '@/lib/actions';

interface PostsListProps {
    initialPosts: OptimisticPost[];
}

type OptimisticPost = Post & { isOptimistic?: boolean };

type Action =
    | { type: 'create'; post: OptimisticPost }
    | { type: 'update'; post: OptimisticPost }
    | { type: 'delete'; id: number };

function optimisticReducer(posts: OptimisticPost[], action: Action): OptimisticPost[] {
    switch (action.type) {
        case 'create':
            return [action.post, ...posts];
        case 'update':
            return posts.map((post) => (post.id === action.post.id ? action.post : post));
        case 'delete':
            return posts.filter((post) => post.id !== action.id);
        default:
            return posts;
    }
}

export default function PostsList({ initialPosts }: PostsListProps) {
    const [posts, updatePosts] = useOptimistic(initialPosts, optimisticReducer);
    const [editingId, setEditingId] = useState<number | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    async function handleCreate(formData: FormData) {
        const newPost: OptimisticPost = {
            id: Date.now(),
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            isOptimistic: true,
        };

        updatePosts({ type: 'create', post: newPost });
        formRef.current?.reset();

        const result = await createPost(formData);
        if (!result.success) {
            updatePosts({ type: 'delete', id: newPost.id });
            toast.error(result.error || 'Failed to create post');
        } else {
            toast.success('Post created successfully');
        }
    }

    async function handleUpdate(id: number, formData: FormData) {
        const updatedPost: OptimisticPost = {
            id,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            created_at: '',
            updated_at: new Date().toISOString(),
            isOptimistic: true,
        };

        const originalPost = posts.find((post) => post.id === id);
        updatePosts({ type: 'update', post: updatedPost });
        setEditingId(null);

        const result = await updatePost(id, formData);
        if (!result.success) {
            if (originalPost) {
                updatePosts({ type: 'update', post: originalPost });
            }
            toast.error(result.error || 'Failed to update post');
        } else {
            toast.success('Post updated successfully');
        }
    }

    async function handleDelete(id: number) {
        const originalPost = posts.find((post) => post.id === id);
        updatePosts({ type: 'delete', id });

        const result = await deletePost(id);
        if (!result.success) {
            if (originalPost) {
                updatePosts({ type: 'create', post: originalPost });
            }
            toast.error(result.error || 'Failed to delete post');
        } else {
            toast.success('Post deleted successfully');
        }
    }

    return (
        <div className="space-y-8">
            <form ref={formRef} action={handleCreate} className="flex flex-col gap-4 p-4 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create New Post</h2>
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        required
                        className="px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                    />
                    <textarea
                        name="description"
                        placeholder="Description"
                        required
                        rows={2}
                        className="px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Create
                </button>
            </form>

            <div className="space-y-4">
                {posts.length === 0 ? (
                    <p className="text-slate-500">No posts yet. Create one above.</p>
                ) : (
                    posts.map((post) => (
                        <div
                            key={post.id}
                            className={`p-4 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${post.isOptimistic ? 'opacity-70' : ''}`}
                        >
                            {editingId === post.id ? (
                                <form
                                    action={(formData) => handleUpdate(post.id, formData)}
                                    className="flex flex-col gap-2"
                                >
                                    <input
                                        type="text"
                                        name="name"
                                        defaultValue={post.name}
                                        required
                                        className="px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                                    />
                                    <textarea
                                        name="description"
                                        defaultValue={post.description}
                                        required
                                        rows={2}
                                        className="px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingId(null)}
                                            className="px-3 py-1 border border-slate-300 rounded-md hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg">{post.name}</h3>
                                            <p className="text-zinc-600 dark:text-zinc-400 mt-1">{post.description}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingId(post.id)}
                                                className="px-3 py-1 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="px-3 py-1 text-red-600 border border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-2">
                                        Created: {new Date(post.created_at).toLocaleString()}
                                    </p>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
