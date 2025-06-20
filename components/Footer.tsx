import { Heart, Github, Twitter, Instagram } from "lucide-react";


const Footer = () => {
  return (
    <footer className="bg-white border-t-4 border-black py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-black text-gray-900 mb-4">WellnessHub</h3>
            <p className="text-gray-600 font-medium mb-4 max-w-md">
              Your one-stop destination for workouts, healthy recipes, and daily inspiration. 
              Build your wellness journey one step at a time.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-cyan-400 border-2 border-black flex items-center justify-center hover:bg-cyan-500 transition-colors cursor-pointer">
                <Twitter className="w-5 h-5 text-black" />
              </div>
              <div className="w-10 h-10 bg-pink-400 border-2 border-black flex items-center justify-center hover:bg-pink-500 transition-colors cursor-pointer">
                <Instagram className="w-5 h-5 text-black" />
              </div>
              <div className="w-10 h-10 bg-gray-900 border-2 border-black flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer">
                <Github className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-black text-gray-900 mb-4">Explore</h4>
            <ul className="space-y-2">
              <li><a href="/workouts" className="text-gray-600 font-medium hover:text-black transition-colors">Workouts</a></li>
              <li><a href="/classicRecipes" className="text-gray-600 font-medium hover:text-black transition-colors">Classic Recipes</a></li>
              <li><a href="/veganRecipes" className="text-gray-600 font-medium hover:text-black transition-colors">Vegan Recipes</a></li>
              <li><a href="/gyms" className="text-gray-600 font-medium hover:text-black transition-colors">Gyms</a></li>
              <li><a href="/favorites" className="text-gray-600 font-medium hover:text-black transition-colors">Favorites</a></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-lg font-black text-gray-900 mb-4">Features</h4>
            <div className="space-y-2">
              <span className="inline-block bg-pink-400 text-black px-3 py-1 border-2 border-black font-bold text-sm mr-2 mb-2">Track Workouts</span>
              <span className="inline-block bg-purple-400 text-black px-3 py-1 border-2 border-black font-bold text-sm mr-2 mb-2">Browse Classic & Vegan Recipes</span>
              <span className="inline-block bg-yellow-400 text-black px-3 py-1 border-2 border-black font-bold text-sm mr-2 mb-2">Find Nearby Gyms</span>
              <span className="inline-block bg-green-400 text-black px-3 py-1 border-2 border-black font-bold text-sm mr-2 mb-2">Save Favorites</span>
              <span className="inline-block bg-blue-400 text-black px-3 py-1 border-2 border-black font-bold text-sm mr-2 mb-2">Add Comments</span>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t-4 border-black pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 font-medium mb-4 md:mb-0">
            © 2025 WellnessHub. Made with <Heart className="inline w-4 h-4 mb-1 text-red-500" /> for your wellness journey.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-600 font-medium hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-600 font-medium hover:text-black transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-600 font-medium hover:text-black transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;