'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Filter, Star, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Grid3X3, List } from 'lucide-react';
import axios from 'axios';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

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

type ViewMode = 'grid' | 'list';

// Simple Image Component
const SimpleImage = ({ src, alt, className, onError }: {
  src: string;
  alt: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
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

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
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

// Coin Card Component
const CoinCard = ({ coin, watchlist, toggleWatchlist }: {
  coin: Coin;
  watchlist: WatchlistItem[];
  toggleWatchlist: (coin: WatchlistItem) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const changeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      // Refresh ScrollTrigger after component mounts
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
            markers: false, // Set to true for debugging
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

  const isInWatchlist = (coinId: string) => {
    return watchlist.some(coin => coin.id === coinId);
  };

  return (
    <Link href={`/coin/${coin.id}`}>
      <div
        ref={cardRef}
        className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6 hover:border-gray-700/80 transition-all duration-300 cursor-pointer relative overflow-hidden"
      >
        <div className="card-glow absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl opacity-0 transition-opacity duration-500" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <SimpleImage
                src={coin.image}
                alt={coin.name}
                className="h-10 w-10 rounded-full ring-2 ring-gray-700/50"
              />
              <div>
                <div className="font-semibold text-white text-sm">{coin.name}</div>
                <div className="text-gray-400 text-xs uppercase tracking-wider">{coin.symbol}</div>
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
                toggleWatchlist({
                  id: coin.id,
                  name: coin.name,
                  symbol: coin.symbol,
                  image: coin.image
                });
              }}
              className={`p-2 rounded-full transition-all duration-300 ${isInWatchlist(coin.id)
                ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-400/10'
                : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10'
                }`}
            >
              <Star
                className={`h-5 w-5 ${isInWatchlist(coin.id) ? 'fill-current' : ''
                  }`}
              />
            </button>
          </div>

          <div className="space-y-3">
            <div ref={priceRef} className="text-xl font-bold text-white">
              {formatPrice(coin.current_price)}
            </div>

            <div ref={changeRef} className={`flex items-center space-x-1 ${coin.price_change_percentage_24h >= 0
              ? 'text-green-400'
              : 'text-red-400'
              }`}>
              {coin.price_change_percentage_24h >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-bold text-sm">
                {formatPercentage(coin.price_change_percentage_24h)}
              </span>
            </div>

            <div className="text-sm text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Rank:</span>
                <span className="text-gray-300 font-bold">#{coin.market_cap_rank || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Market Cap:</span>
                <span className="text-gray-300 font-bold">{formatMarketCap(coin.market_cap)}</span>
              </div>
              <div className="flex justify-between">
                <span>Volume:</span>
                <span className="text-gray-300 font-bold">{formatVolume(coin.total_volume)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// List Item Component
const ListItem = ({ coin, watchlist, toggleWatchlist }: {
  coin: Coin;
  watchlist: WatchlistItem[];
  toggleWatchlist: (coin: WatchlistItem) => void;
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      ScrollTrigger.refresh();

      gsap.fromTo(listRef.current,
        {
          x: -30,
          opacity: 0,
        },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 90%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          }
        }
      );

      // Hover animation
      const handleMouseEnter = () => {
        gsap.to(listRef.current, {
          x: 8,
          duration: 0.3,
          ease: "power2.out"
        });
      };

      const handleMouseLeave = () => {
        gsap.to(listRef.current, {
          x: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      };

      listRef.current.addEventListener('mouseenter', handleMouseEnter);
      listRef.current.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        if (listRef.current) {
          listRef.current.removeEventListener('mouseenter', handleMouseEnter);
          listRef.current.removeEventListener('mouseleave', handleMouseLeave);
        }
      };
    }
  }, []);

  const isInWatchlist = (coinId: string) => {
    return watchlist.some(coin => coin.id === coinId);
  };

  return (
    <Link href={`/coin/${coin.id}`}>
      <div
        ref={listRef}
        className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4 hover:border-gray-700/80 transition-all duration-300 relative overflow-hidden cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-gray-500/5 to-cyan-500/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-gray-400 font-medium text-sm w-8">
                #{coin.market_cap_rank || 'N/A'}
              </div>
              <SimpleImage
                src={coin.image}
                alt={coin.name}
                className="h-8 w-8 rounded-full ring-2 ring-gray-700/50"
              />
              <div>
                <div className="font-semibold text-white">{coin.name}</div>
                <div className="text-gray-400 text-sm uppercase tracking-wider">{coin.symbol}</div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="font-semibold text-white">
                  {formatPrice(coin.current_price)}
                </div>
                <div className={`flex items-center justify-end space-x-1 text-sm ${coin.price_change_percentage_24h >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
                  }`}>
                  {coin.price_change_percentage_24h >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{formatPercentage(coin.price_change_percentage_24h)}</span>
                </div>
              </div>

              <div className="text-right text-sm text-gray-400 hidden sm:block">
                <div>Cap: {formatMarketCap(coin.market_cap)}</div>
                <div>Vol: {formatVolume(coin.total_volume)}</div>
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  gsap.to(e.currentTarget, {
                    scale: 1.15,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    ease: "power2.inOut"
                  });
                  toggleWatchlist({
                    id: coin.id,
                    name: coin.name,
                    symbol: coin.symbol,
                    image: coin.image
                  });
                }}
                className={`p-2 rounded-full transition-all duration-300 ${isInWatchlist(coin.id)
                  ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-400/10'
                  : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10'
                  }`}
              >
                <Star
                  className={`h-5 w-5 ${isInWatchlist(coin.id) ? 'fill-current' : ''
                    }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Utility functions (keeping the same as before)
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

// Loading Skeleton Components (keeping the same)
const GridLoadingSkeleton = () => {
  const skeletonRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.fromTo(skeletonRefs.current,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.05
      }
    );

    gsap.to(".grid-pulse", {
      opacity: 0.5,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          ref={(el) => { skeletonRefs.current[i] = el; }}
          className="bg-gray-900 rounded-xl border border-gray-800 p-6"
        >
          <div className="grid-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-800 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-800 rounded"></div>
                  <div className="h-3 w-16 bg-gray-800 rounded"></div>
                </div>
              </div>
              <div className="h-6 w-6 bg-gray-800 rounded-full"></div>
            </div>
            <div className="space-y-3">
              <div className="h-6 w-24 bg-gray-800 rounded"></div>
              <div className="h-4 w-16 bg-gray-800 rounded"></div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-800 rounded"></div>
                <div className="h-3 w-full bg-gray-800 rounded"></div>
                <div className="h-3 w-3/4 bg-gray-800 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ListLoadingSkeleton = () => {
  const skeletonRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.fromTo(skeletonRefs.current,
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.05
      }
    );

    gsap.to(".list-pulse", {
      opacity: 0.5,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
  }, []);

  return (
    <div className="space-y-4">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          ref={(el) => { skeletonRefs.current[i] = el; }}
          className="bg-gray-900 rounded-xl border border-gray-800 p-4"
        >
          <div className="list-pulse flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-800 rounded"></div>
                <div className="h-3 w-16 bg-gray-800 rounded"></div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-800 rounded"></div>
                <div className="h-3 w-16 bg-gray-800 rounded"></div>
              </div>
              <div className="h-6 w-6 bg-gray-800 rounded-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// View Components
const GridView = ({ coins, watchlist, toggleWatchlist }: {
  coins: Coin[];
  watchlist: WatchlistItem[];
  toggleWatchlist: (coin: WatchlistItem) => void;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Refresh ScrollTrigger when coins change
    ScrollTrigger.refresh();
  }, [coins]);

  return (
    <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {coins.map((coin, index) => (
        <CoinCard
          key={`${coin.id}-${index}`} // Unique key to force re-render
          coin={coin}
          watchlist={watchlist}
          toggleWatchlist={toggleWatchlist}
        />
      ))}
    </div>
  );
};

const ListView = ({ coins, watchlist, toggleWatchlist }: {
  coins: Coin[];
  watchlist: WatchlistItem[];
  toggleWatchlist: (coin: WatchlistItem) => void;
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Refresh ScrollTrigger when coins change
    ScrollTrigger.refresh();
  }, [coins]);

  return (
    <div ref={listRef} className="space-y-4">
      {coins.map((coin, index) => (
        <ListItem
          key={`${coin.id}-${index}`} // Unique key to force re-render
          coin={coin}
          watchlist={watchlist}
          toggleWatchlist={toggleWatchlist}
        />
      ))}
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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Refs for animations
  const titleRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const viewToggleRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  // API Configuration
  const API_KEY = process.env.COINGECKO_API;
  const BASE_URL = 'https://api.coingecko.com/api/v3';

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'x-cg-demo-api-key': API_KEY,
    },
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

    if (filtersRef.current) {
      tl.fromTo(filtersRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );
    }

    if (viewToggleRef.current) {
      tl.fromTo(viewToggleRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" },
        "-=0.3"
      );
    }
  }, []);

  // Refresh ScrollTrigger when data changes
  useEffect(() => {
    if (!loading && coins.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
    }
  }, [loading, coins, viewMode]);

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

  // Animate pagination when it appears
  useEffect(() => {
    if (!loading && paginationRef.current) {
      gsap.fromTo(paginationRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          delay: 0.2
        }
      );
    }
  }, [loading, filteredCoins]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-8 text-center backdrop-blur-sm">
            <div className="text-red-400 text-xl mb-4">
              ⚠️ Error
            </div>
            <p className="text-red-300 mb-4">
              {error}
            </p>
            <button
              onClick={loadCoins}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-roboto">


      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(120, 180, 255, 0.25), transparent 70%), #000000",
        }}
      />

      <div className="py-20 pt-40">
        <div className="max-w-7xl mx-auto p-6">
          {/* Title */}
          <div ref={titleRef} className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Cryptocurrency Markets
            </h1>
            <p className="text-gray-400">
              Track and discover the latest cryptocurrency prices and trends
            </p>
          </div>

          {/* Filters Section */}
          <div ref={filtersRef} className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search cryptocurrencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-80 pl-4 pr-4 py-3 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all duration-300"
                >
                  <option value="market_cap_desc">Market Cap (High to Low)</option>
                  <option value="market_cap_asc">Market Cap (Low to High)</option>
                  <option value="volume_desc">Volume (High to Low)</option>
                  <option value="price_desc">Price (High to Low)</option>
                  <option value="price_asc">Price (Low to High)</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Filters:</span>
                </div>

                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all duration-300"
                >
                  <option value="all">All Prices</option>
                  <option value="under-1">Under $1</option>
                  <option value="1-100">$1 - $100</option>
                  <option value="over-100">Over $100</option>
                </select>

                <select
                  value={changeFilter}
                  onChange={(e) => setChangeFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all duration-300"
                >
                  <option value="all">All Changes</option>
                  <option value="positive">Gainers</option>
                  <option value="negative">Losers</option>
                </select>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div ref={viewToggleRef} className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 bg-gray-900/80 backdrop-blur-sm rounded-xl p-1 border border-gray-700/50">
              <button
                onClick={(e) => {
                  gsap.to(e.currentTarget, {
                    scale: 0.95,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1
                  });
                  setViewMode('grid');
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="text-sm">Grid</span>
              </button>
              <button
                onClick={(e) => {
                  gsap.to(e.currentTarget, {
                    scale: 0.95,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1
                  });
                  setViewMode('list');
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
              >
                <List className="h-4 w-4" />
                <span className="text-sm">List</span>
              </button>
            </div>

            <div className="text-sm text-gray-400">
              Showing {filteredCoins.length} of {coins.length} results
            </div>
          </div>

          {/* Content Views */}
          {loading ? (
            viewMode === 'grid' ? <GridLoadingSkeleton /> : <ListLoadingSkeleton />
          ) : (
            <>
              {viewMode === 'grid' && (
                <GridView
                  coins={filteredCoins}
                  watchlist={watchlist}
                  toggleWatchlist={toggleWatchlist}
                />
              )}
              {viewMode === 'list' && (
                <ListView
                  coins={filteredCoins}
                  watchlist={watchlist}
                  toggleWatchlist={toggleWatchlist}
                />
              )}

              {/* Pagination */}
              <div ref={paginationRef} className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
                <div className="text-gray-400">
                  Showing {filteredCoins.length} of {coins.length} results (Page {currentPage})
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      gsap.to(e.currentTarget, {
                        x: -5,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 1
                      });
                      setCurrentPage(prev => Math.max(prev - 1, 1));
                    }}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-1 px-4 py-2 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800/80 transition-all duration-300 text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-lg">
                    {currentPage}
                  </span>
                  <button
                    onClick={(e) => {
                      gsap.to(e.currentTarget, {
                        x: 5,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 1
                      });
                      setCurrentPage(prev => prev + 1);
                    }}
                    className="flex items-center space-x-1 px-4 py-2 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg hover:bg-gray-800/80 transition-all duration-300 text-white"
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
              <div className="text-gray-500 text-6xl mb-4">
                🔍
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No cryptocurrencies found
              </h3>
              <p className="text-gray-400">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
