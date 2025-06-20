import { Button } from "@/components/ui/button";
import { Heart, Star, Coffee, Dumbbell } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-cyan-50 to-yellow-50 flex items-center justify-center px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Main Hero Content */}
        <div className="mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 my-6 leading-tight">
            Your Complete
            <span className="block text-cyan-400 stroke-text">Wellness Hub</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto font-medium">
            Discover amazing workouts, delicious recipes, and inspiring quotes all in one place. 
            Create your personalized wellness journey today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button className="bg-cyan-400 hover:bg-cyan-500 text-black font-bold px-8 py-4 text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
              Start Exploring
            </Button>
            <Button variant="outline" className="border-4 border-black bg-white hover:bg-gray-100 text-black font-bold px-8 py-4 text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
              View Favorites
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
            <div className="w-16 h-16 bg-pink-400 border-4 border-black rounded-full flex items-center justify-center mb-4 mx-auto">
              <Dumbbell className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Workouts</h3>
            <p className="text-gray-600 font-medium">Find perfect exercises for every fitness level</p>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
            <div className="w-16 h-16 bg-yellow-400 border-4 border-black rounded-full flex items-center justify-center mb-4 mx-auto">
              <Coffee className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Recipes</h3>
            <p className="text-gray-600 font-medium">Delicious & healthy meals for every occasion</p>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
            <div className="w-16 h-16 bg-green-400 border-4 border-black rounded-full flex items-center justify-center mb-4 mx-auto">
              <Star className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Quotes</h3>
            <p className="text-gray-600 font-medium">Daily motivation to keep you inspired</p>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1">
            <div className="w-16 h-16 bg-purple-400 border-4 border-black rounded-full flex items-center justify-center mb-4 mx-auto">
              <Heart className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Favorites</h3>
            <p className="text-gray-600 font-medium">Save and organize your favorite content</p>
          </div>
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
              <div className="text-4xl font-black text-pink-400 mb-2">∞</div>
              <div className="text-lg font-bold">Inspiration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
