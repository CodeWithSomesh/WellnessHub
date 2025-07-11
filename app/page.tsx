import { Button } from "@/components/ui/button";
import { Heart, Coffee, Dumbbell, MapPin, Infinity, SearchCheck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-cyan-50 to-yellow-50 flex items-center justify-center px-4">
      <div className="max-w-7xl mx-auto text-center">
        {/* Main Hero Content */}
        <div className="mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 my-6 leading-tight">
            Your Complete
            <span className="block text-cyan-400 stroke-text">Wellness Hub</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto font-medium">
          Discover amazing workouts, delicious recipes, and nearby gyms all in one place. Create your personalized wellness journey today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/workouts">
              <Button className="bg-cyan-400 hover:bg-green-400 cursor-pointer text-black font-bold px-8 py-4 text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <SearchCheck className="w-8 h-8 text-black stroke-3 " />
                Start Exploring
              </Button>
            </Link>

            <Link href="/favorites">
              <Button variant="outline" className="border-4 border-black cursor-pointer bg-white hover:bg-red-400 text-black font-bold px-8 py-4 text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <Heart className="w-8 h-8 text-black stroke-3" />
                View Favorites
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-5">
          <Link href="/workouts" className="bg-white rounded-md border-4 border-black p-6 hover:bg-pink-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
            <div className="w-16 h-16 bg-pink-400 border-4 border-black rounded-full flex items-center justify-center mb-4 mx-auto">
              <Dumbbell className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Workouts</h3>
            <p className="text-gray-600 font-medium">Find perfect exercises for every fitness level</p>
          </Link>

          <Link href="/classicRecipes" className="bg-white rounded-md border-4 border-black p-6 hover:bg-amber-200 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
            <div className="w-16 h-16 bg-yellow-400 border-4 border-black rounded-full flex items-center justify-center mb-4 mx-auto">
              <Coffee className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Recipes</h3>
            <p className="text-gray-600 font-medium">Delicious & healthy meals for every occasion</p>
          </Link>

          <Link href="/gyms" className="bg-white rounded-md border-4 border-black p-6 hover:bg-green-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
            <div className="w-16 h-16 bg-green-400 border-4 border-black rounded-full flex items-center justify-center mb-4 mx-auto">
              <MapPin className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Gyms</h3>
            <p className="text-gray-600 font-medium">Discover gyms and fitness centers in Malaysia near you</p>
          </Link>

          <Link href="/favorites" className="bg-white rounded-md border-4 border-black p-6 hover:bg-violet-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
            <div className="w-16 h-16 bg-purple-400 border-4 border-black rounded-full flex items-center justify-center mb-4 mx-auto">
              <Heart className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Favorites</h3>
            <p className="text-gray-600 font-medium">Save and organize your favorite content</p>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-black text-white p-8 border-4 border-black">
          <h2 className="text-3xl font-black mb-8">Join the Wellness Community</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-black text-cyan-400 mb-2">1000+</div>
              <div className="text-lg font-bold">Workouts</div>
            </div>
            <div>
              <div className="text-4xl font-black text-yellow-400 mb-2">500+</div>
              <div className="text-lg font-bold">Recipes</div>
            </div>
            <div>
              <div className="text-4xl font-black text-green-400 mb-2">200+</div>
              <div className="text-lg font-bold">Vegan Options</div>
            </div>
            <div>
              <div className="flex items-center justify-center text-pink-400 mb-2"><Infinity className="w-10 h-10 text-pink-400" /></div>
              <div className="text-lg font-bold">Inspiration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
