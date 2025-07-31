'use client';

import { useState, useEffect, useMemo } from 'react';
import { Filter, Star, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';

// Types
interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

interface WatchlistItem {
  id: string;
  name: string;
  symbol: string;
  image: string;
}

// Utility functions
const formatPrice = (price: number): string => {
  if (!price && price !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: price < 1 ? 6 : 2,
  }).format(price);
};

const formatMarketCap = (marketCap: number): string => {
  if (!marketCap && marketCap !== 0) return 'N/A';
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  } else if (marketCap >= 1e3) {
    return `$${(marketCap / 1e3).toFixed(2)}K`;
  }
  return `$${marketCap.toFixed(2)}`;
};

const formatVolume = (volume: number): string => {
  return formatMarketCap(volume);
};

const formatPercentage = (percentage: number): string => {
  if (!percentage && percentage !== 0) return 'N/A';
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
};

// Loading Skeleton Component
const LoadingSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
            <div className="h-4 w-8 bg-gray-800 rounded"></div>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-800 rounded"></div>
                <div className="h-3 w-16 bg-gray-800 rounded"></div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-800 rounded ml-auto"></div>
              <div className="h-3 w-16 bg-gray-800 rounded ml-auto"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Markets Component
export default function Markets() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('market_cap_desc');
  const [priceFilter, setPriceFilter] = useState('all');
  const [changeFilter, setChangeFilter] = useState('all');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  // API Configuration
  const API_KEY = 'CG-Ly8AKYNqnydQ4BFEPPfamH95';
  const BASE_URL = 'https://api.coingecko.com/api/v3';

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'x-cg-demo-api-key': API_KEY,
    },
  });

  // Watchlist functions
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('crypto-watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  const addToWatchlist = (coin: WatchlistItem) => {
    const newWatchlist = [...watchlist, coin];
    setWatchlist(newWatchlist);
    localStorage.setItem('crypto-watchlist', JSON.stringify(newWatchlist));
  };

  const removeFromWatchlist = (coinId: string) => {
    const newWatchlist = watchlist.filter(coin => coin.id !== coinId);
    setWatchlist(newWatchlist);
    localStorage.setItem('crypto-watchlist', JSON.stringify(newWatchlist));
  };

  const isInWatchlist = (coinId: string) => {
    return watchlist.some(coin => coin.id === coinId);
  };

  const toggleWatchlist = (coin: WatchlistItem) => {
    if (isInWatchlist(coin.id)) {
      removeFromWatchlist(coin.id);
    } else {
      addToWatchlist(coin);
    }
  };

  // API fetch function
  const fetchCoinsMarkets = async (
    page: number = 1,
    perPage: number = 50,
    order: string = 'market_cap_desc'
  ): Promise<Coin[]> => {
    try {
      const response = await api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order,
          per_page: perPage,
          page,
          sparkline: false,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching coins:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadCoins();
  }, [currentPage, sortBy]);

  const loadCoins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCoinsMarkets(currentPage, 50, sortBy);
      setCoins(data);
    } catch (err) {
      setError('Failed to fetch cryptocurrency data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCoins = useMemo(() => {
    return coins.filter(coin => {
      const matchesSearch = coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           coin.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPrice = priceFilter === 'all' ||
        (priceFilter === 'under-1' && coin.current_price < 1) ||
        (priceFilter === '1-100' && coin.current_price >= 1 && coin.current_price < 100) ||
        (priceFilter === 'over-100' && coin.current_price >= 100);
      
      const matchesChange = changeFilter === 'all' ||
        (changeFilter === 'positive' && coin.price_change_percentage_24h > 0) ||
        (changeFilter === 'negative' && coin.price_change_percentage_24h < 0);
      
      return matchesSearch && matchesPrice && matchesChange;
    });
  }, [coins, searchTerm, priceFilter, changeFilter]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-8 text-center">
            <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={loadCoins}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="max-w-7xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Cryptocurrency Markets</h1>
          <p className="text-gray-400">Track and discover the latest cryptocurrency prices and trends</p>
        </div>

        {/* Filters Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search and Sort in same row */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search cryptocurrencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80 pl-4 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="market_cap_desc">Market Cap (High to Low)</option>
                <option value="market_cap_asc">Market Cap (Low to High)</option>
                <option value="volume_desc">Volume (High to Low)</option>
                <option value="price_desc">Price (High to Low)</option>
                <option value="price_asc">Price (Low to High)</option>
              </select>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-300">Filters:</span>
              </div>
              
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="all">All Prices</option>
                <option value="under-1">Under $1</option>
                <option value="1-100">$1 - $100</option>
                <option value="over-100">Over $100</option>
              </select>

              <select
                value={changeFilter}
                onChange={(e) => setChangeFilter(e.target.value)}
                className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="all">All Changes</option>
                <option value="positive">Gainers</option>
                <option value="negative">Losers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full font-googl">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">#</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Coin</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Price</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">24h %</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Market Cap</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Volume (24h)</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Watch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredCoins.map((coin) => (
                      <tr key={coin.id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4 text-gray-400 font-medium">
                          {coin.market_cap_rank || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={coin.image}
                              alt={coin.name}
                              className="h-8 w-8 rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2MzY2RjEiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9zdmc+Cjwvc3ZnPgo=';
                              }}
                            />
                            <div>
                              <div className="font-semibold text-white">{coin.name}</div>
                              <div className="text-gray-400 text-sm uppercase">
                                {coin.symbol}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-white">
                          {formatPrice(coin.current_price)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`flex items-center justify-end space-x-1 ${
                            coin.price_change_percentage_24h >= 0 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}>
                            {coin.price_change_percentage_24h >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="font-medium">
                              {formatPercentage(coin.price_change_percentage_24h)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-300">
                          {formatMarketCap(coin.market_cap)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-300">
                          {formatVolume(coin.total_volume)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleWatchlist({
                              id: coin.id,
                              name: coin.name,
                              symbol: coin.symbol,
                              image: coin.image
                            })}
                            className={`p-2 rounded-full transition-colors ${
                              isInWatchlist(coin.id)
                                ? 'text-yellow-400 hover:text-yellow-300'
                                : 'text-gray-500 hover:text-yellow-400'
                            }`}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                isInWatchlist(coin.id) ? 'fill-current' : ''
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
              <div className="text-gray-400">
                Showing {filteredCoins.length} of {coins.length} results (Page {currentPage})
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="flex items-center space-x-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-white"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && filteredCoins.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-500 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No cryptocurrencies found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
