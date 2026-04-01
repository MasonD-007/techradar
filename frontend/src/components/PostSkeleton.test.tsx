import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PostSkeleton from './PostSkeleton';

describe('PostSkeleton', () => {
  it('renders skeleton loader', () => {
    const { container } = render(<PostSkeleton />);
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
