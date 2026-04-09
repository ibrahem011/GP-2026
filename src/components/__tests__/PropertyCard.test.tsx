import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { PropertyCard } from '../PropertyCard';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    };
  },
  usePathname() {
    return '';
  },
}));

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    return <img {...props} />;
  },
}));

test('PropertyCard applies aria attributes correctly', () => {
  render(
    <PropertyCard
      id="test-1"
      title="Test Property"
      location="Test Location"
      price={1000}
      image="/test.jpg"
      bedrooms={2}
      bathrooms={1}
      area={100}
      rating={4.5}
      isVerified={true}
    />
  );

  // Check that the favorite button has an aria-label
  const favoriteBtn = screen.getByRole('button', { name: /إضافة للمفضلة/ });
  expect(favoriteBtn).toBeInTheDocument();

  // We have multiple material icons in the component
  const icons = document.querySelectorAll('.material-symbols-outlined');

  // They should all have aria-hidden="true"
  let hiddenCount = 0;
  icons.forEach((icon) => {
    if (icon.getAttribute('aria-hidden') === 'true') {
      hiddenCount++;
    }
  });

  // Depending on props, we have: favorite(1), verified(1), star(1), location(1), bed(1), bathtub(1), straighten(1), arrow(1) = 8
  expect(hiddenCount).toBe(8);
});
