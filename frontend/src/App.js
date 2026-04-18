import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { Search, ExternalLink, Star, Truck, X, Sparkles, TrendingUp, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Product Card Component
const ProductCard = ({ product, onClick }) => {
  return (
    <Card
      data-testid={`product-card-${product.id}`}
      className="group cursor-pointer overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10"
      onClick={() => onClick(product)}
    >
      <div className="aspect-square overflow-hidden bg-zinc-800 relative">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full ${product.thumbnail ? 'hidden' : 'flex'} items-center justify-center text-zinc-600`}
          style={{ display: product.thumbnail ? 'none' : 'flex' }}
        >
          <Sparkles className="w-12 h-12" />
        </div>
        {product.rating && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-white font-medium">{product.rating}</span>
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-medium text-zinc-100 line-clamp-2 text-sm leading-tight group-hover:text-white transition-colors">
          {product.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-emerald-400">
            {product.price || "Price unavailable"}
          </span>
          {product.source && (
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">
              {product.source}
            </Badge>
          )}
        </div>
        {product.delivery && (
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Truck className="w-3 h-3" />
            <span className="line-clamp-1">{product.delivery}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

// Product Detail Modal
const ProductModal = ({ product, isOpen, onClose }) => {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        data-testid="product-modal"
        className="max-w-2xl bg-zinc-900 border-zinc-800 text-white p-0 overflow-hidden"
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Product Image */}
          <div className="aspect-square bg-zinc-800 relative overflow-hidden">
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <Sparkles className="w-16 h-16" />
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="p-6 flex flex-col">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-white leading-tight">
                {product.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 flex-1">
              {/* Price */}
              <div className="text-3xl font-bold text-emerald-400">
                {product.price || "Price unavailable"}
              </div>
              
              {/* Store */}
              {product.source && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-sm">Sold by</span>
                  <Badge className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
                    {product.source}
                  </Badge>
                </div>
              )}
              
              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-zinc-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-zinc-300 text-sm">
                    {product.rating} {product.reviews && `(${product.reviews.toLocaleString()} reviews)`}
                  </span>
                </div>
              )}
              
              {/* Delivery */}
              {product.delivery && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Truck className="w-4 h-4" />
                  <span className="text-sm">{product.delivery}</span>
                </div>
              )}
            </div>
            
            {/* CTA Button */}
            <Button
              data-testid="go-to-website-btn"
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-6 text-lg rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
              onClick={() => window.open(product.link, "_blank")}
              disabled={!product.link}
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Go to Website
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Loading Skeleton Grid
const LoadingGrid = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {[...Array(10)].map((_, i) => (
      <Card key={i} className="overflow-hidden bg-zinc-900/50 border-zinc-800">
        <Skeleton className="aspect-square bg-zinc-800" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-4 w-full bg-zinc-800" />
          <Skeleton className="h-4 w-2/3 bg-zinc-800" />
          <Skeleton className="h-6 w-1/2 bg-zinc-800" />
        </div>
      </Card>
    ))}
  </div>
);

// Main App Component
function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [trending, setTrending] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  // Fetch trending searches on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await axios.get(`${API}/trending`);
        setTrending(response.data.trending || []);
      } catch (e) {
        console.error("Failed to fetch trending", e);
      }
    };
    fetchTrending();
  }, []);

  // Search function
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const response = await axios.get(`${API}/search`, {
        params: { q: query, num: 40 }
      });
      setProducts(response.data.products || []);
    } catch (e) {
      console.error("Search failed", e);
      setError(e.response?.data?.detail || "Search failed. Please try again.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  // Handle trending click
  const handleTrendingClick = (term) => {
    setSearchQuery(term);
    handleSearch(term);
  };

  // Handle product click
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-6">
            {/* Logo/Brand */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                Thread<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Mart</span>
              </h1>
            </div>
            
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Discover amazing clothing from thousands of stores. Search, compare, and shop smarter.
            </p>
            
            {/* Search Bar */}
            <form 
              onSubmit={handleSubmit}
              className="max-w-2xl mx-auto mt-8"
            >
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <Input
                    data-testid="search-input"
                    type="text"
                    placeholder="Search for clothing, shoes, accessories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-6 text-lg bg-zinc-900/80 border-zinc-700 rounded-2xl focus:border-purple-500 focus:ring-purple-500/20 text-white placeholder:text-zinc-500"
                  />
                </div>
                <Button
                  data-testid="search-button"
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </form>
            
            {/* Trending Tags */}
            {!hasSearched && trending.length > 0 && (
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Trending searches</span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {trending.map((term, idx) => (
                    <button
                      key={idx}
                      data-testid={`trending-tag-${idx}`}
                      onClick={() => handleTrendingClick(term)}
                      className="px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full text-sm text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white transition-all duration-200"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Results Section */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-300 text-center">
            {error}
          </div>
        )}
        
        {/* Loading State */}
        {loading && <LoadingGrid />}
        
        {/* Results */}
        {!loading && products.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-200">
                {products.length} results for "{searchQuery}"
              </h2>
            </div>
            
            <div 
              data-testid="product-grid"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* No Results */}
        {!loading && hasSearched && products.length === 0 && !error && (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-zinc-900 flex items-center justify-center">
              <Search className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-300">No results found</h3>
            <p className="text-zinc-500">Try a different search term or check out our trending searches</p>
          </div>
        )}
        
        {/* Initial State - Feature Cards */}
        {!hasSearched && !loading && (
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">Smart Search</h3>
              <p className="text-zinc-500 text-sm">Find clothing from thousands of stores with our Google Shopping powered search.</p>
            </Card>
            
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">Compare Prices</h3>
              <p className="text-zinc-500 text-sm">See prices from multiple retailers and find the best deals on your favorite items.</p>
            </Card>
            
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                <ExternalLink className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">Shop Direct</h3>
              <p className="text-zinc-500 text-sm">Click through to buy directly from trusted retailers with secure checkout.</p>
            </Card>
          </div>
        )}
      </main>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-zinc-600 text-sm">
          <p>ThreadMart - Your clothing marketplace aggregator</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
