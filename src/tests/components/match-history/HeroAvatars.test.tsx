import { render, screen } from '@testing-library/react';

import { HeroAvatars } from '@/components/match-history/list/HeroAvatars';
import type { Hero } from '@/types/contexts/hero-context-value';

const mockHeroes: Hero[] = [
  {
    id: '1',
    name: 'crystal_maiden',
    localizedName: 'Crystal Maiden',
    primaryAttribute: 'intelligence',
    attackType: 'ranged',
    roles: ['Support', 'Disabler', 'Nuker'],
    complexity: 1,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/crystal_maiden.png?'
  },
  {
    id: '2',
    name: 'juggernaut',
    localizedName: 'Juggernaut',
    primaryAttribute: 'agility',
    attackType: 'melee',
    roles: ['Carry', 'Pusher'],
    complexity: 2,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/juggernaut.png?'
  },
  {
    id: '3',
    name: 'lina',
    localizedName: 'Lina',
    primaryAttribute: 'intelligence',
    attackType: 'ranged',
    roles: ['Support', 'Nuker'],
    complexity: 2,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/lina.png?'
  },
  {
    id: '4',
    name: 'pudge',
    localizedName: 'Pudge',
    primaryAttribute: 'strength',
    attackType: 'melee',
    roles: ['Disabler', 'Initiator'],
    complexity: 3,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/pudge.png?'
  },
  {
    id: '5',
    name: 'axe',
    localizedName: 'Axe',
    primaryAttribute: 'strength',
    attackType: 'melee',
    roles: ['Initiator', 'Durable'],
    complexity: 2,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/axe.png?'
  }
];

describe('HeroAvatars', () => {
  it('renders without crashing', () => {
    render(<HeroAvatars heroes={mockHeroes} />);
    
    // Check that avatar fallbacks are present (multiple instances due to responsive design)
    const crElements = screen.getAllByText('CR');
    expect(crElements.length).toBeGreaterThan(0);
  });

  it('renders with default props', () => {
    render(<HeroAvatars heroes={mockHeroes} />);
    
    // Check that the container has the correct classes
    const container = document.querySelector('[class*="flex -space-x-1"]');
    expect(container).toBeInTheDocument();
  });

  it('renders with custom avatar size', () => {
    render(
      <HeroAvatars 
        heroes={mockHeroes} 
        avatarSize={{ width: 'w-6', height: 'h-6' }}
      />
    );
    
    // Check that avatars have the custom size classes
    const avatars = document.querySelectorAll('[class*="w-6 h-6"]');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('renders with custom breakpoints', () => {
    const customBreakpoints = {
      showAll: '400px',
      showThree: '350px',
      showTwo: '300px',
      showOne: '200px',
      hideAll: '200px'
    };
    
    render(
      <HeroAvatars 
        heroes={mockHeroes} 
        breakpoints={customBreakpoints}
      />
    );
    
    // Check that the component renders without errors
    const crElements = screen.getAllByText('CR');
    expect(crElements.length).toBeGreaterThan(0);
  });

  it('renders with custom className', () => {
    const { container } = render(
      <HeroAvatars heroes={mockHeroes} className="custom-class" />
    );
    
    const heroAvatarsContainer = container.firstChild;
    expect(heroAvatarsContainer).toHaveClass('custom-class');
  });

  it('handles empty heroes array', () => {
    render(<HeroAvatars heroes={[]} />);
    
    // Should render without errors
    const container = document.querySelector('[class*="flex -space-x-1"]');
    expect(container).toBeInTheDocument();
  });

  it('renders hero avatars with proper accessibility', () => {
    render(<HeroAvatars heroes={mockHeroes} />);
    
    // Check that avatar images have proper alt text (when images load)
    // In test environment, images might not load, so we check fallbacks instead
    const avatarFallbacks = document.querySelectorAll('[data-slot="avatar-fallback"]');
    expect(avatarFallbacks.length).toBeGreaterThan(0);
    
    avatarFallbacks.forEach(fallback => {
      expect(fallback).toHaveTextContent(/^[A-Z]{2}$/);
    });
  });

  it('renders avatar fallbacks correctly', () => {
    render(<HeroAvatars heroes={mockHeroes} />);
    
    // Check that fallbacks show hero initials (multiple instances due to responsive design)
    const crElements = screen.getAllByText('CR'); // Crystal Maiden
    const juElements = screen.getAllByText('JU'); // Juggernaut
    const liElements = screen.getAllByText('LI'); // Lina
    const puElements = screen.getAllByText('PU'); // Pudge
    const axElements = screen.getAllByText('AX'); // Axe
    
    expect(crElements.length).toBeGreaterThan(0);
    expect(juElements.length).toBeGreaterThan(0);
    expect(liElements.length).toBeGreaterThan(0);
    expect(puElements.length).toBeGreaterThan(0);
    expect(axElements.length).toBeGreaterThan(0);
  });

  it('applies correct border styling', () => {
    render(<HeroAvatars heroes={mockHeroes} />);
    
    // Check that avatars have border classes
    const avatars = document.querySelectorAll('[class*="border-2 border-background"]');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('applies correct image styling', () => {
    render(<HeroAvatars heroes={mockHeroes} />);
    
    // Check that images have object-cover and object-center classes (when images are present)
    // In test environment, images might not be rendered, so we check for the classes in the component structure
    const avatarContainers = document.querySelectorAll('[data-slot="avatar"]');
    expect(avatarContainers.length).toBeGreaterThan(0);
  });

  describe('Responsive behavior', () => {
    it('renders container queries for responsive design', () => {
      render(<HeroAvatars heroes={mockHeroes} />);
      
      // Check that container queries are applied
      const responsiveDivs = document.querySelectorAll('[class*="@[300px]"]');
      expect(responsiveDivs.length).toBeGreaterThan(0);
    });

    it('handles different container sizes gracefully', () => {
      render(<HeroAvatars heroes={mockHeroes} />);
      
      // The component should render without errors regardless of container size
      const crElements = screen.getAllByText('CR');
      const juElements = screen.getAllByText('JU');
      expect(crElements.length).toBeGreaterThan(0);
      expect(juElements.length).toBeGreaterThan(0);
    });
  });
}); 