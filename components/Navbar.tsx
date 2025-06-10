'use client';

import React, { useState } from 'react';
import { Heart, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';

const Navbar = () => {
  const pathname = usePathname();
  const { userId } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="w-full border-b border-primary/20 top-0 z-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Wellness Hub
              </h1>
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-6">
              {[
                { href: '/workouts', label: 'Workouts', bg: 'bg-[#D433F8]' },
                { href: '/recipes', label: 'Recipes', bg: 'bg-[#33d1f8]' },
                { href: '/restaurants', label: 'Restaurants', bg: 'bg-[#f83333]' },
                { href: '/quotes', label: 'Quotes', bg: 'bg-[#33f875]' },
              ].map(({ href, label, bg }) => (
                <a
                  key={href}
                  href={href}
                  className={`${
                    isActive(href) ? `${bg} text-white font-bold underline italic` : 'text-foreground font-medium'
                  } hover:text-primary hover:bg-primary/10 transition-all duration-200 px-3 py-2 rounded-md text-sm`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Right Side: Login / User */}
          <div className="flex items-center gap-4">
            {!userId ? (
              <Link href="/sign-up">
                <Button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold p-4 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
                  <User size={16} />
                  <span className="hidden sm:inline">Log In</span>
                </Button>
              </Link>
            ) : (
              <>
                <Button className="flex items-center gap-1.5 bg-yellow-400 hover:bg-red-500 text-black font-bold border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
                  <Heart strokeWidth={2.5} />
                </Button>
                <UserButton />
              </>
            )}

            {/* Mobile menu toggle button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-primary/20">
              {[
                { href: '/workouts', label: 'Workouts' },
                { href: '/recipes', label: 'Recipes' },
                { href: '/restaurants', label: 'Restaurants' },
                { href: '/quotes', label: 'Quotes' },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu after clicking
                  className="block text-foreground hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-md text-base font-medium transition-all duration-200"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
