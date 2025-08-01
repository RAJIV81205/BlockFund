'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  DollarSign,
  Users,
  Clock,
  Activity,
  Globe,
  ExternalLink,
  Search,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Types
interface CoinDetails {
  id: string;
  symbol: string;
  name: string;
  image: {
    large: string;
    small: string;
    thumb: string;
  };
  market_cap_rank: number;
  market_data: {
    current_price: {
      usd: number;
    };
    market_cap: {
      usd: number;
    };
    total_volume: {
      usd: number;
    };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    price_change_percentage_1y: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    ath: {
      usd: number;
    };
    atl: {
      usd: number;
    };
    high_24h: {
      usd: number;
    };
    low_24h: {
      usd: number;
    };
  };
  links: {
    homepage: string[];
  };
}

interface SearchCoin {
  id: string;
  name: string;
  symbol: string;
  large: string;
  thumb: string;
}

interface ChartData {
  prices: [number, number][];
}

type TimeRange = '7' | '30' | '90' | '365';

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

// Chart Component
const ComparisonChart = ({ chartData, coins, timeRange }: {
  chartData: { [key: string]: ChartData };
  coins: CoinDetails[];
  timeRange: TimeRange;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }
  }, [chartData]);

  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

  const chartDataset = useMemo(() => {
    if (!chartData || Object.keys(chartData).length === 0) return null;

    const allLabels = new Set<string>();
    const datasets: any[] = [];

    // Collect all unique timestamps
    Object.values(chartData).forEach(data => {
      data.prices.forEach(point => {
        const date = new Date(point[0]);
        const label = timeRange === '7' 
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        allLabels.add(label);
      });
    });

    const labels = Array.from(allLabels).sort();

    // Create datasets for each coin
    coins.forEach((coin, index) => {
      const data = chartData[coin.id];
      if (data && data.prices) {
        const prices = data.prices.map(point => point[1]);
        const color = colors[index % colors.length];

        datasets.push({
          label: coin.symbol.toUpperCase(),
          data: prices,
          borderColor: color,
          backgroundColor: `${color}20`,
          borderWidth: 3,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: color,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
          tension: 0.4,
        });
      }
    });

    return { labels: labels.slice(0, Math.max(...datasets.map(d => d.data.length))), datasets };
  }, [chartData, coins, timeRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 14,
            weight: 'bold' as const
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
          maxTicksLimit: 6,
        },
      },
      y: {
        display: true,
        position: 'right' as const,
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          callback: (value: any) => {
            return `$${parseFloat(value).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: value < 1 ? 6 : 2,
            })}`;
          },
        },
      },
    },
  };

  if (!chartDataset) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <div className="text-gray-400">No chart data available</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-80 relative">
      <Line data={chartDataset} options={chartOptions} />
    </div>
  );
};

// Custom debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Coin Search Modal
const CoinSearchModal = ({ isOpen, onClose, onSelectCoin, excludeIds }: {
  isOpen: boolean;
  onClose: () => void;
  onSelectCoin: (coinId: string) => void;
  excludeIds: string[];
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Debounce search term with 800ms delay to respect API rate limits
  const debouncedSearchTerm = useDebounce(searchTerm, 800);

  // API Configuration
  const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API || process.env.COINGECKO_API;
  const BASE_URL = 'https://api.coingecko.com/api/v3';

  const api = axios.create({
    baseURL: BASE_URL,
    headers: API_KEY ? {
      'x-cg-demo-api-key': API_KEY,
    } : {},
  });

  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(modalRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  // Search effect using debounced value
  useEffect(() => {
    const searchCoins = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get('/search', {
          params: { query: debouncedSearchTerm }
        });
        
        const filteredResults = response.data.coins
          .filter((coin: SearchCoin) => !excludeIds.includes(coin.id))
          .slice(0, 10);
        
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching coins:', error);
      } finally {
        setLoading(false);
      }
    };

    searchCoins();
  }, [debouncedSearchTerm, excludeIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Add Cryptocurrency</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-400"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Searching...</div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => {
                    onSelectCoin(coin.id);
                    onClose();
                    setSearchTerm('');
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-all duration-300 text-left"
                >
                  <SimpleImage
                    src={coin.thumb}
                    alt={coin.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-white">{coin.name}</p>
                    <p className="text-sm text-gray-400 uppercase">{coin.symbol}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="text-center py-8 text-gray-400">No results found</div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Coin Comparison Card
const ComparisonCard = ({ coin, onRemove, canRemove }: {
  coin: CoinDetails;
  onRemove: () => void;
  canRemove: boolean;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );

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

  const currentPrice = coin.market_data.current_price.usd;
  const priceChange24h = coin.market_data.price_change_percentage_24h;
  const isPositivePrice = priceChange24h >= 0;

  return (
    <div
      ref={cardRef}
      className="relative bg-gray-900 border border-gray-800 rounded-xl p-6 overflow-hidden"
    >
      {/* Glow effect */}
      <div className="card-glow absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 rounded-xl"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <SimpleImage
              src={coin.image.large}
              alt={coin.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h3 className="text-lg font-semibold text-white">{coin.name}</h3>
              <p className="text-sm text-gray-400 uppercase">{coin.symbol}</p>
            </div>
          </div>
          
          {canRemove && (
            <button
              onClick={(e) => {
                gsap.to(e.currentTarget, {
                  scale: 1.2,
                  duration: 0.1,
                  yoyo: true,
                  repeat: 1,
                  ease: "power2.inOut"
                });
                onRemove();
              }}
              className="p-2 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <span className="text-2xl font-bold text-white">
            {formatPrice(currentPrice)}
          </span>
          <div className={`flex items-center space-x-1 mt-1 ${
            isPositivePrice ? 'text-green-400' : 'text-red-400'
          }`}>
            {isPositivePrice ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="font-medium">
              {formatPercentage(priceChange24h)}
            </span>
            <span className="text-gray-400 text-sm">24h</span>
          </div>
        </div>

        {/* Market Data */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Rank:</span>
            <span className="text-white font-medium">#{coin.market_cap_rank || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Market Cap:</span>
            <span className="text-white font-medium">{formatMarketCap(coin.market_data.market_cap.usd)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Volume:</span>
            <span className="text-white font-medium">{formatVolume(coin.market_data.total_volume.usd)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Circulating Supply:</span>
            <span className="text-white font-medium">{formatSupply(coin.market_data.circulating_supply)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">7d Change:</span>
            <span className={`font-medium ${
              (coin.market_data.price_change_percentage_7d || 0) >= 0 
                ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatPercentage(coin.market_data.price_change_percentage_7d || 0)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">30d Change:</span>
            <span className={`font-medium ${
              (coin.market_data.price_change_percentage_30d || 0) >= 0 
                ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatPercentage(coin.market_data.price_change_percentage_30d || 0)}
            </span>
          </div>
        </div>

        {/* Visit Website */}
        {coin.links.homepage[0] && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <a
              href={coin.links.homepage[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-300"
            >
              <Globe size={16} />
              <span>Visit Website</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// Add Coin Card
const AddCoinCard = ({ onAdd }: { onAdd: () => void }) => {
  const cardRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
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
    <button
      ref={cardRef}
      onClick={() => {
        gsap.to(cardRef.current, {
          scale: 0.95,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut"
        });
        onAdd();
      }}
      className="h-full min-h-[400px] bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-white hover:border-blue-500/50 hover:bg-gray-900/80 transition-all duration-300"
    >
      <Plus size={48} className="mb-4" />
      <p className="text-lg font-medium">Add Cryptocurrency</p>
      <p className="text-sm mt-2">Compare up to 4 coins</p>
    </button>
  );
};

// Loading Skeleton
const ComparisonSkeleton = () => {
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

    gsap.to(".compare-pulse", {
      opacity: 0.5,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          ref={(el) => { skeletonRefs.current[i] = el; }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gray-700 rounded-full compare-pulse"></div>
            <div>
              <div className="h-5 w-24 bg-gray-700 rounded compare-pulse mb-2"></div>
              <div className="h-4 w-16 bg-gray-700 rounded compare-pulse"></div>
            </div>
          </div>
          <div className="h-8 w-32 bg-gray-700 rounded compare-pulse mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="flex justify-between">
                <div className="h-4 w-20 bg-gray-700 rounded compare-pulse"></div>
                <div className="h-4 w-16 bg-gray-700 rounded compare-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
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

const formatSupply = (supply: number): string => {
  if (!supply && supply !== 0) return 'N/A';
  if (supply >= 1e12) {
    return `${(supply / 1e12).toFixed(2)}T`;
  } else if (supply >= 1e9) {
    return `${(supply / 1e9).toFixed(2)}B`;
  } else if (supply >= 1e6) {
    return `${(supply / 1e6).toFixed(2)}M`;
  } else if (supply >= 1e3) {
    return `${(supply / 1e3).toFixed(2)}K`;
  }
  return supply.toLocaleString();
};

const formatPercentage = (percentage: number): string => {
  if (!percentage && percentage !== 0) return 'N/A';
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
};

// Main Compare Component
export default function Compare() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [coins, setCoins] = useState<CoinDetails[]>([]);
  const [chartData, setChartData] = useState<{ [key: string]: ChartData }>({});
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Refs for animations
  const titleRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

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

    if (chartRef.current) {
      tl.fromTo(chartRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );
    }
  }, []);

  // Initialize with URL params or default coins
  useEffect(() => {
    const coinIds = searchParams?.get('coins')?.split(',') || ['bitcoin', 'ethereum'];
    fetchCoinsData(coinIds);
  }, []);

  // Fetch chart data when time range or coins change
  useEffect(() => {
    if (coins.length > 0) {
      fetchChartData();
    }
  }, [coins, timeRange]);

  const fetchCoinsData = async (coinIds: string[]) => {
    try {
      setLoading(true);
      setError(null);

      const promises = coinIds.map(id => 
        api.get(`/coins/${id}`, {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false
          }
        })
      );

      const responses = await Promise.all(promises);
      const coinsData = responses.map(response => response.data);
      
      setCoins(coinsData);
      
      // Update URL
      const newParams = new URLSearchParams();
      newParams.set('coins', coinIds.join(','));
      router.replace(`/compare?${newParams.toString()}`, { scroll: false });
      
    } catch (err) {
      console.error('Error fetching coins data:', err);
      setError('Failed to fetch cryptocurrency data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      setChartLoading(true);

      const promises = coins.map(coin =>
        api.get(`/coins/${coin.id}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: timeRange,
            interval: 'daily'
          }
        })
      );

      const responses = await Promise.all(promises);
      const newChartData: { [key: string]: ChartData } = {};

      responses.forEach((response, index) => {
        newChartData[coins[index].id] = response.data;
      });

      setChartData(newChartData);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setChartLoading(false);
    }
  };

  const addCoin = async (coinId: string) => {
    if (coins.length >= 4) return; // Max 4 coins

    try {
      const response = await api.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });

      const newCoins = [...coins, response.data];
      setCoins(newCoins);

      // Update URL
      const newParams = new URLSearchParams();
      newParams.set('coins', newCoins.map(c => c.id).join(','));
      router.replace(`/compare?${newParams.toString()}`, { scroll: false });

    } catch (err) {
      console.error('Error adding coin:', err);
    }
  };

  const removeCoin = (coinId: string) => {
    if (coins.length <= 1) return; // Keep at least 1 coin

    const newCoins = coins.filter(coin => coin.id !== coinId);
    setCoins(newCoins);

    // Update URL
    const newParams = new URLSearchParams();
    newParams.set('coins', newCoins.map(c => c.id).join(','));
    router.replace(`/compare?${newParams.toString()}`, { scroll: false });

    // Remove from chart data
    const newChartData = { ...chartData };
    delete newChartData[coinId];
    setChartData(newChartData);
  };

  if (error) {
    return (
      <div className="min-h-screen pt-30 bg-black text-white flex items-center justify-center">
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
      <div className="max-w-7xl mx-auto px-4 py-8 pt-30">
        {/* Header */}
        <div ref={titleRef} className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300"
            >
              <ArrowLeft size={20} />
              <span>Back to Markets</span>
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Compare Cryptocurrencies
          </h1>
          <p className="text-gray-400">
            Compare prices, market data, and performance of multiple cryptocurrencies
          </p>
        </div>

        {loading ? (
          <ComparisonSkeleton />
        ) : (
          <>
            {/* Price Chart */}
            <div ref={chartRef} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <h2 className="text-2xl font-bold mb-4 lg:mb-0 text-white">Price Comparison</h2>
                
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: '7', label: '7D' },
                    { value: '30', label: '30D' },
                    { value: '90', label: '90D' },
                    { value: '365', label: '1Y' }
                  ].map((range) => (
                    <button
                      key={range.value}
                      onClick={(e) => {
                        gsap.to(e.currentTarget, {
                          scale: 0.95,
                          duration: 0.1,
                          yoyo: true,
                          repeat: 1
                        });
                        setTimeRange(range.value as TimeRange);
                      }}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        timeRange === range.value
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white border border-gray-700/50'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {chartLoading ? (
                <div className="h-80 bg-gray-800/50 rounded-lg animate-pulse flex items-center justify-center border border-gray-700/30">
                  <div className="text-gray-400">Loading chart data...</div>
                </div>
              ) : (
                <ComparisonChart
                  chartData={chartData}
                  coins={coins}
                  timeRange={timeRange}
                />
              )}
            </div>

            {/* Comparison Cards */}
            <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {coins.map((coin) => (
                <ComparisonCard
                  key={coin.id}
                  coin={coin}
                  onRemove={() => removeCoin(coin.id)}
                  canRemove={coins.length > 1}
                />
              ))}
              
              {coins.length < 4 && (
                <AddCoinCard onAdd={() => setShowSearchModal(true)} />
              )}
            </div>
          </>
        )}

        {/* Search Modal */}
        <CoinSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSelectCoin={addCoin}
          excludeIds={coins.map(coin => coin.id)}
        />
      </div>
    </div>
  );
}
