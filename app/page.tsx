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
        </div>
      </div>
    </div>
  );
}