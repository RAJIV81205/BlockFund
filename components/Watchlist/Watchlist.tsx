'use client';

import { useState, useEffect, useRef } from 'react';
import { Trash2, TrendingUp, TrendingDown, Star, ArrowLeft, BarChart3, DollarSign } from 'lucide-react';
import axios from 'axios';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Types
interface WatchlistCoin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

interface StoredWatchlistItem {
  id: string;
  name: string;
  symbol: string;
  image: string;
}

// Simple Image Component (matching Dashboard)
const SimpleImage = ({ src, alt, className, onError }: {
  src: string;
  alt: string;
  className?: string;
  onError?: (e: React.SyntheticEvent) => void;
}) => {
  const [error, setError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageRef.current) {
      gsap.fromTo(imageRef.current,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out"
        }
      );
    }
  }, [src]);

  const handleError = (e: React.SyntheticEvent) => {
    setError(true);
    if (onError) {
      onError(e);
    }
  };

  const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2MzY2RjEiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9zdmc+Cjwvc3ZnPgo=';

  return (
    <img
      ref={imageRef}
      src={error ? defaultImage : src}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

// Watchlist Card Component
const WatchlistCard = ({ coin, onRemove }: {
  coin: WatchlistCoin;
  onRemove: (coinId: string) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const changeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      ScrollTrigger.refresh();
      
      gsap.fromTo(cardRef.current,
        {
          y: 30,
          opacity: 0,
          scale: 0.95,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play none none reverse",
          }
        }
      );

      // Hover animations
      const handleMouseEnter = () => {
        gsap.to(cardRef.current, {
          y: -8,
          scale: 1.02,
          duration: 0.3,
          ease: "power2.out"
        });
        
        const glow = cardRef.current?.querySelector('.card-glow');
        if (glow) {
          gsap.to(glow, {
            opacity: 1,
            duration: 0.3
          });
        }
      };

      const handleMouseLeave = () => {
        gsap.to(cardRef.current, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
        
        const glow = cardRef.current?.querySelector('.card-glow');
        if (glow) {
          gsap.to(glow, {
            opacity: 0,
            duration: 0.3
          });
        }
      };

      cardRef.current.addEventListener('mouseenter', handleMouseEnter);
      cardRef.current.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        if (cardRef.current) {
          cardRef.current.removeEventListener('mouseenter', handleMouseEnter);
          cardRef.current.removeEventListener('mouseleave', handleMouseLeave);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (priceRef.current && changeRef.current) {
      gsap.fromTo([priceRef.current, changeRef.current],
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          }
        }
      );
    }
  }, [coin.current_price, coin.price_change_percentage_24h]);

  return (
    <Link href={`/coin/${coin.id}`}>
      <div
        ref={cardRef}
        className="relative bg-gray-900 rounded-xl border border-gray-800 p-6 transition-all duration-300 hover:border-blue-500/30 overflow-hidden cursor-pointer"
      >
        {/* Glow effect */}
        <div className="card-glow absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 rounded-xl"></div>
        
        <div className="relative z-10">
          {/* Header with coin info and remove button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <SimpleImage
                src={coin.image}
                alt={coin.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="text-lg font-semibold text-white">{coin.name}</h3>
                <p className="text-sm text-gray-400 uppercase">{coin.symbol}</p>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                gsap.to(e.currentTarget, {
                  scale: 1.2,
                  duration: 0.1,
                  yoyo: true,
                  repeat: 1,
                  ease: "power2.inOut"
                });
                onRemove(coin.id);
              }}
              className="p-2 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Price */}
          <div ref={priceRef} className="mb-3">
            <span className="text-2xl font-bold text-white">
              {formatPrice(coin.current_price)}
            </span>
          </div>

          {/* 24h Change */}
          <div 
            ref={changeRef}
            className={`flex items-center space-x-1 mb-4 ${
              coin.price_change_percentage_24h >= 0
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {coin.price_change_percentage_24h >= 0 ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <span className="font-medium">
              {formatPercentage(coin.price_change_percentage_24h)}
            </span>
            <span className="text-gray-400 text-sm">24h</span>
          </div>

          {/* Market data */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Rank:</p>
              <p className="text-white font-medium">#{coin.market_cap_rank || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400">Market Cap:</p>
              <p className="text-white font-medium">{formatMarketCap(coin.market_cap)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400">Volume:</p>
              <p className="text-white font-medium">{formatVolume(coin.total_volume)}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Loading Skeleton Component
const WatchlistSkeleton = () => {
  const skeletonRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.fromTo(skeletonRefs.current.filter(Boolean),
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.1
      }
    );

    // Pulsing animation
    gsap.to(".watchlist-pulse", {
      opacity: 0.5,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          ref={(el) => { skeletonRefs.current[i] = el; }}
          className="bg-gray-900 rounded-xl border border-gray-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full watchlist-pulse"></div>
              <div>
                <div className="h-5 w-24 bg-gray-700 rounded watchlist-pulse mb-2"></div>
                <div className="h-4 w-16 bg-gray-700 rounded watchlist-pulse"></div>
              </div>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-full watchlist-pulse"></div>
          </div>
          <div className="h-8 w-32 bg-gray-700 rounded watchlist-pulse mb-3"></div>
          <div className="h-5 w-24 bg-gray-700 rounded watchlist-pulse mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-4 w-12 bg-gray-700 rounded watchlist-pulse mb-1"></div>
              <div className="h-5 w-16 bg-gray-700 rounded watchlist-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-20 bg-gray-700 rounded watchlist-pulse mb-1"></div>
              <div className="h-5 w-20 bg-gray-700 rounded watchlist-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Empty State Component
const EmptyWatchlist = () => {
  const emptyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (emptyRef.current) {
      gsap.fromTo(emptyRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power2.out" }
      );
    }
  }, []);

  return (
    <div ref={emptyRef} className="text-center py-16">
      <div className="text-6xl mb-6">⭐</div>
      <h2 className="text-2xl font-bold text-white mb-4">Your Watchlist is Empty</h2>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Start adding cryptocurrencies to your watchlist to track their prices and performance.
      </p>
      <Link
        href="/"
        className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-300 text-white"
      >
        <span>Browse Markets</span>
      </Link>
    </div>
  );
};

// Statistics Card Component
const StatsCard = ({ icon: Icon, label, value, color }: {
  icon: any;
  label: string;
  value: string;
  color?: string;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className="bg-gray-900 border border-gray-800 rounded-xl p-6 transition-all duration-300 hover:border-blue-500/30"
    >
      <div className="flex items-center space-x-3">
        <Icon className={`${color || 'text-blue-400'}`} size={24} />
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-white text-xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Utility functions (matching Dashboard)
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

// Main Watchlist Component
export default function Watchlist() {
  const [watchlistCoins, setWatchlistCoins] = useState<WatchlistCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storedWatchlist, setStoredWatchlist] = useState<StoredWatchlistItem[]>([]);

  // Refs for animations
  const titleRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // API Configuration
  const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API || process.env.COINGECKO_API;
  const BASE_URL = 'https://api.coingecko.com/api/v3';

  const api = axios.create({
    baseURL: BASE_URL,
    headers: API_KEY ? {
      'x-cg-demo-api-key': API_KEY,
    } : {},
  });

  // Initial animations
  useEffect(() => {
    const tl = gsap.timeline();

    if (titleRef.current) {
      tl.fromTo(titleRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
    }

    if (statsRef.current) {
      tl.fromTo(statsRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );
    }
  }, []);

  // Load watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('crypto-watchlist');
    if (savedWatchlist) {
      const parsedWatchlist = JSON.parse(savedWatchlist);
      setStoredWatchlist(parsedWatchlist);
      
      if (parsedWatchlist.length > 0) {
        fetchWatchlistData(parsedWatchlist);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch current price data for watchlist coins
  const fetchWatchlistData = async (watchlist: StoredWatchlistItem[]) => {
    try {
      setLoading(true);
      setError(null);

      const coinIds = watchlist.map(coin => coin.id).join(',');
      
      const response = await api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: coinIds,
          order: 'market_cap_desc',
          per_page: watchlist.length,
          page: 1,
          sparkline: false,
        }
      });

      setWatchlistCoins(response.data);
    } catch (err) {
      console.error('Error fetching watchlist data:', err);
      setError('Failed to fetch watchlist data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Remove coin from watchlist
  const removeFromWatchlist = (coinId: string) => {
    const newWatchlist = storedWatchlist.filter(coin => coin.id !== coinId);
    setStoredWatchlist(newWatchlist);
    localStorage.setItem('crypto-watchlist', JSON.stringify(newWatchlist));
    
    // Update displayed coins
    const newWatchlistCoins = watchlistCoins.filter(coin => coin.id !== coinId);
    setWatchlistCoins(newWatchlistCoins);

    // Animate removal
    gsap.to('.grid-container', {
      scale: 0.98,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut"
    });
  };

  // Calculate statistics
  const totalValue = watchlistCoins.reduce((sum, coin) => sum + coin.current_price, 0);
  const gainers = watchlistCoins.filter(coin => coin.price_change_percentage_24h > 0).length;
  const losers = watchlistCoins.filter(coin => coin.price_change_percentage_24h < 0).length;

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4  pt-25 py-8">
        {/* Header */}
        <div ref={titleRef} className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300"
              >
                <ArrowLeft size={20} />
                <span>Back to Markets</span>
              </Link>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              My Watchlist
            </h1>
            <p className="text-gray-400 mt-2">
              Track your favorite cryptocurrencies and their performance
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Star className="text-yellow-400 fill-current" size={24} />
            <span className="text-xl font-semibold">{watchlistCoins.length} coins</span>
          </div>
        </div>

        {/* Statistics Cards */}
        {watchlistCoins.length > 0 && (
          <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              icon={DollarSign}
              label="Total Coins"
              value={watchlistCoins.length.toString()}
              color="text-blue-400"
            />
            <StatsCard
              icon={TrendingUp}
              label="24h Gainers"
              value={gainers.toString()}
              color="text-green-400"
            />
            <StatsCard
              icon={TrendingDown}
              label="24h Losers"
              value={losers.toString()}
              color="text-red-400"
            />
          </div>
        )}

        {/* Watchlist Grid */}
        <div ref={gridRef} className="grid-container">
          {loading ? (
            <WatchlistSkeleton />
          ) : watchlistCoins.length === 0 ? (
            <EmptyWatchlist />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlistCoins.map((coin) => (
                <WatchlistCard
                  key={coin.id}
                  coin={coin}
                  onRemove={removeFromWatchlist}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
