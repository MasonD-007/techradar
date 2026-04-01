import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PostsList from './PostsList';

vi.mock('@/lib/actions');
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('PostsList', () => {
    const mockPosts = [
        { id: 1, name: 'Test Post', description: 'Test Description', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    ];

    it('renders posts correctly', () => {
        render(<PostsList initialPosts={mockPosts} />);

        expect(screen.getByText('Test Post')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText(/Create New Post/)).toBeInTheDocument();
    });

    it('renders empty state when no posts', () => {
        render(<PostsList initialPosts={[]} />);

        expect(screen.getByText('No posts yet. Create one above.')).toBeInTheDocument();
    });

    it('enters edit mode when edit button is clicked', () => {
        render(<PostsList initialPosts={mockPosts} />);

        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        expect(screen.getByDisplayValue('Test Post')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('cancels edit mode when cancel is clicked', () => {
        render(<PostsList initialPosts={mockPosts} />);

        fireEvent.click(screen.getByText('Edit'));
        fireEvent.click(screen.getByText('Cancel'));

        expect(screen.queryByText('Save')).not.toBeInTheDocument();
        expect(screen.getByText('Test Post')).toBeInTheDocument();
    });
});
