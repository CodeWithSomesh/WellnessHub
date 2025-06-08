import React from 'react';
import { Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';

const Navbar = async () => {

  const { userId } = await auth();

  return (
    <nav className="w-full  border-b border-primary/20  top-0 z-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Wellness Hub
                </h1>
            </Link>
          </div>

          {/* Navigation Links - Hidden on mobile, shown on md+ */}
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-6">
              <a
                href="/workouts"
                className="text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Workouts
              </a>
              <a
                href="/recipes"
                className="text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Recipes
              </a>
              <a
                href="/restaurants"
                className="text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Restaurants
              </a>
              <a
                href="/quotes"
                className="text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Quotes
              </a>
            </div>
          </div>

          {/* Login Button */}
          <div className="flex items-center">
            {!userId ? (
              <Link href='/sign-up'>
                  <Button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold p-4 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
                      <User size={16} />
                      <span className="hidden sm:inline">Log In</span>
                  </Button>
              </Link>
            ) : (
              <>
                <li className="flex items-center gap-4"> 
                  <Button className="flex items-center gap-1.5 bg-yellow-400 hover:bg-red-500 text-black font-bold border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
                    <Heart strokeWidth={2.5} />
                  </Button>

                  <UserButton />
                </li>
              </>
            )}
          </div>

          {/* Mobile menu button - shown on mobile, hidden on md+ */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" className="hover:bg-primary/10">
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-primary/20 mr-10">
            <a
              href="/workouts"
              className="text-foreground hover:text-primary hover:bg-primary/10 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200"
            >
              Workouts
            </a>
            <a
              href="/recipes"
              className="text-foreground hover:text-primary hover:bg-primary/10 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200"
            >
              Recipes
            </a>
            <a
              href="/restaurants"
              className="text-foreground hover:text-primary hover:bg-primary/10 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200"
            >
              Restaurants
            </a>
            <a
              href="/quotes"
              className="text-foreground hover:text-primary hover:bg-primary/10 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200"
            >
              Quotes
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;