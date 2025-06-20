import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-cyan-50 to-yellow-50 flex items-center justify-center px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Main Hero Content */}
        <div className="mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-6 leading-tight">
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
      </div>
    </div>
  );
}