import { getPosts } from '@/lib/actions';
import PostsList from '@/components/ItemsList';

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Posts</h1>
        <PostsList initialPosts={posts} />
      </div>
    </main>
  );
}
