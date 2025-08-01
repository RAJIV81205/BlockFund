'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  ExternalLink,
  ChevronDown,
  Activity,
  DollarSign,
  BarChart3,
  Users,
  Clock
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

// Types (same as before)
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
    price_change_24h: number;
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
  description: {
    en: string;
  };
  links: {
    homepage: string[];
    blockchain_site: string[];
  };
  genesis_date: string;
}

interface WatchlistItem {
  id: string;
  name: string;
  symbol: string;
  image: string;
}

interface ChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

type TimeRange = '1' | '7' | '30' | '90' | '365';

// Chart Component using Chart.js
const PriceChart = ({ data, timeRange, isPositive }: { 
  data: [number, number][]; 
  timeRange: TimeRange;
  isPositive: boolean;
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
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const labels = data.map(point => {
      const date = new Date(point[0]);
      if (timeRange === '1') {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (timeRange === '7') {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    });

    const prices = data.map(point => point[1]);

    return {
      labels,
      datasets: [
        {
          label: 'Price (USD)',
          data: prices,
          borderColor: isPositive ? '#22c55e' : '#ef4444',
          backgroundColor: isPositive 
            ? 'rgba(34, 197, 94, 0.1)' 
            : 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: isPositive ? '#22c55e' : '#ef4444',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
          tension: 0.4,
        },
      ],
    };
  }, [data, timeRange, isPositive]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            return `$${context.parsed.y.toLocaleString('en-US', {
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
              minimumFractionDigits: 2,
              maximumFractionDigits: value < 1 ? 6 : 2,
            })}`;
          },
        },
      },
    },
  };

  if (!chartData) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <div className="text-gray-400">No chart data available</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-80 relative">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

// Statistics Card Component (matching Dashboard theme)
const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  isPositive 
}: {
  icon: any;
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
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

  return (
    <div 
      ref={cardRef}
      className="relative bg-gray-900 border border-gray-800 rounded-xl p-6 transition-all duration-300 hover:border-blue-500/30 overflow-hidden"
    >
      {/* Glow effect */}
      <div className="card-glow absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 rounded-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <Icon className="text-blue-400" size={24} />
          {change && (
            <span className={`text-sm flex items-center ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="ml-1">{change}</span>
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        <p className="text-white text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
};

// Utility functions (same as Dashboard)
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

const formatVolume = (volume: number): string => {
  return formatMarketCap(volume);
};

const formatPercentage = (percentage: number): string => {
  if (!percentage && percentage !== 0) return 'N/A';
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
};

const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

// Loading Skeleton matching Dashboard theme
const CoinDetailsSkeleton = () => {
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
    gsap.to(".coin-pulse", {
      opacity: 0.5,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div 
          ref={(el) => { skeletonRefs.current[0] = el; }}
          className="flex items-center justify-between mb-8"
        >
          <div className="h-8 w-32 bg-gray-800 rounded-lg coin-pulse"></div>
          <div className="h-10 w-40 bg-gray-800 rounded-lg coin-pulse"></div>
        </div>

        {/* Price Section Skeleton */}
        <div 
          ref={(el) => { skeletonRefs.current[1] = el; }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-6 mb-6 lg:mb-0">
              <div className="h-20 w-20 bg-gray-700 rounded-full coin-pulse"></div>
              <div>
                <div className="h-10 w-64 bg-gray-700 rounded-lg coin-pulse mb-3"></div>
                <div className="h-6 w-32 bg-gray-700 rounded-lg coin-pulse"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-12 w-48 bg-gray-700 rounded-lg coin-pulse mb-3"></div>
              <div className="h-6 w-24 bg-gray-700 rounded-lg coin-pulse ml-auto"></div>
            </div>
          </div>
        </div>

        {/* Chart Skeleton */}
        <div 
          ref={(el) => { skeletonRefs.current[2] = el; }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 w-32 bg-gray-700 rounded-lg coin-pulse"></div>
            <div className="flex space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-12 bg-gray-700 rounded-lg coin-pulse"></div>
              ))}
            </div>
          </div>
          <div className="h-80 bg-gray-700 rounded-lg coin-pulse"></div>
        </div>

        {/* Stats Skeleton */}
        <div 
          ref={(el) => { skeletonRefs.current[3] = el; }}
          className="mb-8"
        >
          <div className="h-8 w-48 bg-gray-700 rounded-lg coin-pulse mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="h-6 w-6 bg-gray-700 rounded coin-pulse mb-3"></div>
                <div className="h-4 w-24 bg-gray-700 rounded coin-pulse mb-2"></div>
                <div className="h-6 w-32 bg-gray-700 rounded coin-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Coin Details Component
export default function Coin() {
  const params = useParams();
  const router = useRouter();
  const coinId = params?.id as string;

  const [coinDetails, setCoinDetails] = useState<CoinDetails | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Refs for animations (matching Dashboard style)
  const headerRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // API Configuration (matching Dashboard)
  const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API || process.env.COINGECKO_API;
  const BASE_URL = 'https://api.coingecko.com/api/v3';

  const api = axios.create({
    baseURL: BASE_URL,
    headers: API_KEY ? {
      'x-cg-demo-api-key': API_KEY,
    } : {},
  });

  // Load watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('crypto-watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  // Initial animations matching Dashboard
  useEffect(() => {
    const tl = gsap.timeline();

    if (headerRef.current) {
      tl.fromTo(headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
    }

    if (priceRef.current) {
      tl.fromTo(priceRef.current,
        { y: 30, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );
    }

    if (chartRef.current) {
      tl.fromTo(chartRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.3"
      );
    }
  }, [coinDetails]);

  // Fetch coin details
  useEffect(() => {
    if (coinId) {
      fetchCoinDetails();
    }
  }, [coinId]);

  // Fetch chart data when time range changes
  useEffect(() => {
    if (coinId) {
      fetchChartData();
    }
  }, [coinId, timeRange]);

  const fetchCoinDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      setCoinDetails(response.data);
    } catch (err) {
      console.error('Error fetching coin details:', err);
      setError('Failed to fetch coin details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      setChartLoading(true);
      
      const response = await api.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: timeRange,
          interval: timeRange === '1' ? 'hourly' : 'daily'
        }
      });
      
      setChartData(response.data);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setChartLoading(false);
    }
  };

  // Watchlist functions (matching Dashboard)
  const isInWatchlist = (coinId: string): boolean => {
    return watchlist.some(coin => coin.id === coinId);
  };

  const toggleWatchlist = () => {
    if (!coinDetails) return;

    const watchlistItem: WatchlistItem = {
      id: coinDetails.id,
      name: coinDetails.name,
      symbol: coinDetails.symbol,
      image: coinDetails.image.small
    };

    let newWatchlist: WatchlistItem[];
    
    if (isInWatchlist(coinDetails.id)) {
      newWatchlist = watchlist.filter(coin => coin.id !== coinDetails.id);
    } else {
      newWatchlist = [...watchlist, watchlistItem];
    }
    
    setWatchlist(newWatchlist);
    localStorage.setItem('crypto-watchlist', JSON.stringify(newWatchlist));
  };

  // Get chart data and trend
  const { chartPrices, isPositiveTrend } = useMemo(() => {
    if (!chartData || !chartData.prices || chartData.prices.length === 0) {
      return { chartPrices: [], isPositiveTrend: true };
    }

    const prices = chartData.prices;
    const firstPrice = prices[0][1];
    const lastPrice = prices[prices.length - 1][1];
    
    return {
      chartPrices: prices,
      isPositiveTrend: lastPrice >= firstPrice
    };
  }, [chartData]);

  if (loading) {
    return <CoinDetailsSkeleton />;
  }

  if (error || !coinDetails) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4 text-white">Error</h1>
          <p className="text-gray-400 mb-6">{error || 'Coin not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-300"
          >
            Back to Markets
          </button>
        </div>
      </div>
    );
  }

  const currentPrice = coinDetails.market_data.current_price.usd;
  const priceChange24h = coinDetails.market_data.price_change_percentage_24h;
  const isPositivePrice = priceChange24h >= 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 pt-25 py-8 font-roboto">
        {/* Header - matching Dashboard style */}
        <div ref={headerRef} className="flex items-center justify-between mb-8">
          <Link 
            href="/dashboard"
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300"
          >
            <ArrowLeft size={20} />
            <span>Back to Markets</span>
          </Link>
          
          <button
            onClick={(e) => {
              gsap.to(e.currentTarget, {
                scale: 1.1,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
              });
              toggleWatchlist();
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
              isInWatchlist(coinDetails.id)
                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20'
                : 'bg-gray-900/80 border-gray-700/50 text-gray-300 hover:bg-yellow-400/10 hover:border-yellow-400/30 hover:text-yellow-400'
            }`}
          >
            <Star size={18} className={isInWatchlist(coinDetails.id) ? 'fill-current' : ''} />
            <span>{isInWatchlist(coinDetails.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}</span>
          </button>
        </div>

        {/* Price Section - matching Dashboard card style */}
        <div ref={priceRef} className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8 overflow-hidden">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                <div className="relative">
                  <img 
                    src={coinDetails.image.large} 
                    alt={coinDetails.name}
                    className="w-20 h-20 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiM2MzY2RjEiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9zdmc+Cjwvc3ZnPgo=';
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-white">
                    {coinDetails.name}
                    <span className="text-gray-400 ml-3 text-xl uppercase">
                      {coinDetails.symbol}
                    </span>
                  </h1>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-400">Rank #{coinDetails.market_cap_rank || 'N/A'}</span>
                    {coinDetails.links.homepage[0] && (
                      <a
                        href={coinDetails.links.homepage[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors duration-300"
                      >
                        <Globe size={16} />
                        <span>Website</span>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-4xl lg:text-5xl font-bold mb-2 text-white">
                  {formatPrice(currentPrice)}
                </div>
                <div className={`text-lg flex items-center justify-end space-x-2 ${
                  isPositivePrice ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isPositivePrice ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  <span>{formatPercentage(priceChange24h)}</span>
                  <span className="text-gray-400">24h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section - matching Dashboard theme */}
        <div ref={chartRef} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <h2 className="text-2xl font-bold mb-4 lg:mb-0 text-white">Price Chart</h2>
            
            <div className="flex flex-wrap gap-2">
              {[
                { value: '1', label: '24H' },
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
            <PriceChart 
              data={chartPrices} 
              timeRange={timeRange}
              isPositive={isPositiveTrend}
            />
          )}
        </div>

        {/* Market Statistics - matching Dashboard grid */}
        <div ref={statsRef} className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white">Market Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={DollarSign}
              label="Market Cap"
              value={formatMarketCap(coinDetails.market_data.market_cap.usd)}
            />
            
            <StatCard
              icon={BarChart3}
              label="24h Volume"
              value={formatMarketCap(coinDetails.market_data.total_volume.usd)}
            />
            
            <StatCard
              icon={TrendingUp}
              label="24h High"
              value={formatPrice(coinDetails.market_data.high_24h.usd)}
              change={formatPercentage(coinDetails.market_data.price_change_percentage_24h)}
              isPositive={coinDetails.market_data.price_change_percentage_24h >= 0}
            />
            
            <StatCard
              icon={TrendingDown}
              label="24h Low"
              value={formatPrice(coinDetails.market_data.low_24h.usd)}
            />
            
            <StatCard
              icon={Activity}
              label="All Time High"
              value={formatPrice(coinDetails.market_data.ath.usd)}
            />
            
            <StatCard
              icon={Activity}
              label="All Time Low"
              value={formatPrice(coinDetails.market_data.atl.usd)}
            />
            
            <StatCard
              icon={Users}
              label="Circulating Supply"
              value={formatSupply(coinDetails.market_data.circulating_supply)}
            />
            
            <StatCard
              icon={Clock}
              label={coinDetails.market_data.max_supply ? "Max Supply" : "Total Supply"}
              value={formatSupply(coinDetails.market_data.max_supply || coinDetails.market_data.total_supply)}
            />
          </div>
        </div>

        {/* Additional Statistics - matching Dashboard layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4 text-white">Price Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">7 days</span>
                  <span className={`font-semibold ${
                    (coinDetails.market_data.price_change_percentage_7d || 0) >= 0 
                      ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(coinDetails.market_data.price_change_percentage_7d || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">30 days</span>
                  <span className={`font-semibold ${
                    (coinDetails.market_data.price_change_percentage_30d || 0) >= 0 
                      ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(coinDetails.market_data.price_change_percentage_30d || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">1 year</span>
                  <span className={`font-semibold ${
                    (coinDetails.market_data.price_change_percentage_1y || 0) >= 0 
                      ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(coinDetails.market_data.price_change_percentage_1y || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4 text-white">Supply Information</h3>
            <div className="space-y-4">
              <div>
                <span className="text-gray-400 block text-sm">Circulating</span>
                <span className="font-semibold text-white">{formatSupply(coinDetails.market_data.circulating_supply)}</span>
              </div>
              {coinDetails.market_data.total_supply && (
                <div>
                  <span className="text-gray-400 block text-sm">Total</span>
                  <span className="font-semibold text-white">{formatSupply(coinDetails.market_data.total_supply)}</span>
                </div>
              )}
              {coinDetails.market_data.max_supply && (
                <div>
                  <span className="text-gray-400 block text-sm">Max</span>
                  <span className="font-semibold text-white">{formatSupply(coinDetails.market_data.max_supply)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description - matching Dashboard styling */}
        {coinDetails.description.en && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4 text-white">About {coinDetails.name}</h3>
            <div className="text-gray-300 leading-relaxed">
              <p>
                {showFullDescription 
                  ? stripHtmlTags(coinDetails.description.en)
                  : `${stripHtmlTags(coinDetails.description.en).slice(0, 500)}...`
                }
              </p>
              {stripHtmlTags(coinDetails.description.en).length > 500 && (
                <button
                  onClick={(e) => {
                    gsap.to(e.currentTarget, {
                      scale: 0.95,
                      duration: 0.1,
                      yoyo: true,
                      repeat: 1
                    });
                    setShowFullDescription(!showFullDescription);
                  }}
                  className="mt-4 text-blue-400 hover:text-blue-300 transition-colors duration-300 flex items-center space-x-1"
                >
                  <span>{showFullDescription ? 'Show Less' : 'Read More'}</span>
                  <ChevronDown 
                    size={16} 
                    className={`transform transition-transform duration-300 ${
                      showFullDescription ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
