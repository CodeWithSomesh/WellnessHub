'use client';

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Edit, Trash2, X, Save } from 'lucide-react';

interface NutritionFood {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
}

interface FavoriteFood extends NutritionFood {
  comment: string;
  dateAdded: string;
}

const NutritionPage = () => {
  const [foods, setFoods] = useState<NutritionFood[]>([]);
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'favorites'>('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    food: NutritionFood | null;
    comment: string;
  }>({
    isOpen: false,
    food: null,
    comment: ''
  });
  const [editingComment, setEditingComment] = useState<{
    id: string;
    comment: string;
  } | null>(null);

  useEffect(() => {
    fetchNutritionData();
    loadFavorites();
  }, []);

  const fetchNutritionData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/nutrition');
      if (!response.ok) throw new Error('Failed to fetch nutrition data');
      const data = await response.json();
      
      // Transform the API data to match our interface
      let transformedFoods = [];
      
      if (Array.isArray(data)) {
        // If data is directly an array
        transformedFoods = data.map((food: any, index: number) => ({
          id: food.id || food._id || `food-${index}`,
          name: food.name || food.food_name || food.description || 'Unknown Food',
          category: food.category || food.food_category || food.group || food.food_group || 'General',
          calories: parseFloat(food.calories || food.nf_calories || food.energy || food.kcal || 0),
          protein: parseFloat(food.protein || food.nf_protein || food.proteins || 0),
          carbs: parseFloat(food.carbs || food.carbohydrates || food.nf_total_carbohydrate || food.carbohydrate || 0),
          fat: parseFloat(food.fat || food.fats || food.nf_total_fat || food.total_fat || 0),
          fiber: parseFloat(food.fiber || food.fibre || food.nf_dietary_fiber || food.dietary_fiber || 0),
          sugar: parseFloat(food.sugar || food.sugars || food.nf_sugars || food.total_sugars || 0),
          sodium: parseFloat(food.sodium || food.nf_sodium || food.salt || 0),
          servingSize: food.serving_size || food.serving_unit || food.portion || food.serving || '100g'
        }));
      } else if (data.foods && Array.isArray(data.foods)) {
        // If data has foods property
        transformedFoods = data.foods.map((food: any, index: number) => ({
          id: food.id || food._id || `food-${index}`,
          name: food.name || food.food_name || food.description || 'Unknown Food',
          category: food.category || food.food_category || food.group || food.food_group || 'General',
          calories: parseFloat(food.calories || food.nf_calories || food.energy || food.kcal || 0),
          protein: parseFloat(food.protein || food.nf_protein || food.proteins || 0),
          carbs: parseFloat(food.carbs || food.carbohydrates || food.nf_total_carbohydrate || food.carbohydrate || 0),
          fat: parseFloat(food.fat || food.fats || food.nf_total_fat || food.total_fat || 0),
          fiber: parseFloat(food.fiber || food.fibre || food.nf_dietary_fiber || food.dietary_fiber || 0),
          sugar: parseFloat(food.sugar || food.sugars || food.nf_sugars || food.total_sugars || 0),
          sodium: parseFloat(food.sodium || food.nf_sodium || food.salt || 0),
          servingSize: food.serving_size || food.serving_unit || food.portion || food.serving || '100g'
        }));
      } else if (data.data && Array.isArray(data.data)) {
        // If data has data property
        transformedFoods = data.data.map((food: any, index: number) => ({
          id: food.id || food._id || `food-${index}`,
          name: food.name || food.food_name || food.description || 'Unknown Food',
          category: food.category || food.food_category || food.group || food.food_group || 'General',
          calories: parseFloat(food.calories || food.nf_calories || food.energy || food.kcal || 0),
          protein: parseFloat(food.protein || food.nf_protein || food.proteins || 0),
          carbs: parseFloat(food.carbs || food.carbohydrates || food.nf_total_carbohydrate || food.carbohydrate || 0),
          fat: parseFloat(food.fat || food.fats || food.nf_total_fat || food.total_fat || 0),
          fiber: parseFloat(food.fiber || food.fibre || food.nf_dietary_fiber || food.dietary_fiber || 0),
          sugar: parseFloat(food.sugar || food.sugars || food.nf_sugars || food.total_sugars || 0),
          sodium: parseFloat(food.sodium || food.nf_sodium || food.salt || 0),
          servingSize: food.serving_size || food.serving_unit || food.portion || food.serving || '100g'
        }));
      } else {
        // If data structure is different, try to extract any array
        const possibleArrays = Object.values(data).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          const foods = possibleArrays[0] as any[];
          transformedFoods = foods.map((food: any, index: number) => ({
            id: food.id || food._id || `food-${index}`,
            name: food.name || food.food_name || food.description || 'Unknown Food',
            category: food.category || food.food_category || food.group || food.food_group || 'General',
            calories: parseFloat(food.calories || food.nf_calories || food.energy || food.kcal || 0),
            protein: parseFloat(food.protein || food.nf_protein || food.proteins || 0),
            carbs: parseFloat(food.carbs || food.carbohydrates || food.nf_total_carbohydrate || food.carbohydrate || 0),
            fat: parseFloat(food.fat || food.fats || food.nf_total_fat || food.total_fat || 0),
            fiber: parseFloat(food.fiber || food.fibre || food.nf_dietary_fiber || food.dietary_fiber || 0),
            sugar: parseFloat(food.sugar || food.sugars || food.nf_sugars || food.total_sugars || 0),
            sodium: parseFloat(food.sodium || food.nf_sodium || food.salt || 0),
            servingSize: food.serving_size || food.serving_unit || food.portion || food.serving || '100g'
          }));
        }
      }
      
      console.log('Raw API response:', data);
      console.log('Transformed foods:', transformedFoods);
      
      setFoods(transformedFoods);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('nutritionFavorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const saveFavorites = (newFavorites: FavoriteFood[]) => {
    localStorage.setItem('nutritionFavorites', JSON.stringify(newFavorites));
    setFavorites(newFavorites);
  };

  const isFoodFavorited = (foodId: string) => {
    return favorites.some(fav => fav.id === foodId);
  };

  const handleAddToFavorites = (food: NutritionFood) => {
    setCommentModal({
      isOpen: true,
      food,
      comment: ''
    });
  };

  const handleSaveToFavorites = () => {
    if (commentModal.food) {
      const newFavorite: FavoriteFood = {
        ...commentModal.food,
        comment: commentModal.comment,
        dateAdded: new Date().toISOString()
      };
      
      const newFavorites = [...favorites, newFavorite];
      saveFavorites(newFavorites);
      
      setCommentModal({ isOpen: false, food: null, comment: '' });
    }
  };

  const handleRemoveFromFavorites = (foodId: string) => {
    const newFavorites = favorites.filter(fav => fav.id !== foodId);
    saveFavorites(newFavorites);
  };

  const handleUpdateComment = (foodId: string, newComment: string) => {
    const newFavorites = favorites.map(fav =>
      fav.id === foodId ? { ...fav, comment: newComment } : fav
    );
    saveFavorites(newFavorites);
    setEditingComment(null);
  };

  const getUniqueCategories = () => {
    const categories = foods.map(food => food.category);
    return ['all', ...Array.from(new Set(categories))];
  };

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading nutrition data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Nutrition Database</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore nutritional information for various foods and track your favorites with personal notes.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              Browse Foods
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              My Favorites ({favorites.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'browse' ? (
          <>
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search foods..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {getUniqueCategories().map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Foods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFoods.map((food) => (
                <div key={food.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm text-emerald-600 font-medium">{food.category}</span>
                      <button
                        onClick={() => 
                          isFoodFavorited(food.id) 
                            ? handleRemoveFromFavorites(food.id)
                            : handleAddToFavorites(food)
                        }
                        className={`p-2 rounded-full transition-colors ${
                          isFoodFavorited(food.id)
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isFoodFavorited(food.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {food.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      Serving size: {food.servingSize}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <span className="text-emerald-700 font-medium">Calories</span>
                        <p className="text-gray-800 font-semibold">{food.calories}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <span className="text-blue-700 font-medium">Protein</span>
                        <p className="text-gray-800 font-semibold">{food.protein}g</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <span className="text-orange-700 font-medium">Carbs</span>
                        <p className="text-gray-800 font-semibold">{food.carbs}g</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <span className="text-yellow-700 font-medium">Fat</span>
                        <p className="text-gray-800 font-semibold">{food.fat}g</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Fiber: {food.fiber}g</span>
                        <span>Sugar: {food.sugar}g</span>
                        <span>Sodium: {food.sodium}mg</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredFoods.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500">No foods found matching your criteria.</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {favorites.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No favorites yet</h3>
                <p className="text-gray-500">Start browsing foods and add them to your favorites!</p>
              </div>
            ) : (
              favorites.map((food) => (
                <div key={food.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-emerald-600 font-medium">{food.category}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingComment({ id: food.id, comment: food.comment })}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveFromFavorites(food.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {food.name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        Serving size: {food.servingSize}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <span className="text-emerald-700 font-medium">Calories</span>
                          <p className="text-gray-800 font-semibold">{food.calories}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <span className="text-blue-700 font-medium">Protein</span>
                          <p className="text-gray-800 font-semibold">{food.protein}g</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3">
                          <span className="text-orange-700 font-medium">Carbs</span>
                          <p className="text-gray-800 font-semibold">{food.carbs}g</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <span className="text-yellow-700 font-medium">Fat</span>
                          <p className="text-gray-800 font-semibold">{food.fat}g</p>
                        </div>
                      </div>
                      
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span>Fiber: {food.fiber}g</span>
                          <span>Sugar: {food.sugar}g</span>
                          <span>Sodium: {food.sodium}mg</span>
                        </div>
                      </div>
                      
                      {editingComment?.id === food.id ? (
                        <div className="mb-4">
                          <textarea
                            value={editingComment.comment}
                            onChange={(e) => setEditingComment({ ...editingComment, comment: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            rows={3}
                            placeholder="Update your comment..."
                          />
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handleUpdateComment(food.id, editingComment.comment)}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                            >
                              <Save className="w-4 h-4" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => setEditingComment(null)}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <MessageCircle className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Your Comment</span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            {food.comment || 'No comment added.'}
                          </p>
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-500">
                        <span>Added on {formatDate(food.dateAdded)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Comment Modal */}
        {commentModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Add to Favorites</h3>
                <button
                  onClick={() => setCommentModal({ isOpen: false, food: null, comment: '' })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">{commentModal.food?.name}</h4>
                <p className="text-sm text-gray-600">{commentModal.food?.category} • {commentModal.food?.servingSize}</p>
                <div className="mt-2 flex space-x-4 text-sm">
                  <span className="text-emerald-600 font-medium">{commentModal.food?.calories} cal</span>
                  <span className="text-blue-600">{commentModal.food?.protein}g protein</span>
                  <span className="text-orange-600">{commentModal.food?.carbs}g carbs</span>
                  <span className="text-yellow-600">{commentModal.food?.fat}g fat</span>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a comment (optional)
                </label>
                <textarea
                  value={commentModal.comment}
                  onChange={(e) => setCommentModal({ ...commentModal, comment: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={3}
                  placeholder="Why do you want to save this food? Diet goals, recipe ideas, etc."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setCommentModal({ isOpen: false, food: null, comment: '' })}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveToFavorites}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <Heart className="w-4 h-4" />
                  <span>Add to Favorites</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionPage;