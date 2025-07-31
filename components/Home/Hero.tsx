"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
    return (
        <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center">
            {/* Enhanced Background with Pattern */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: "radial-gradient(125% 125% at 50% 10%, #000000 40%, #0d1a36 100%)",
                }}
            />
            
            {/* Animated Pattern Overlay */}
            <motion.div 
                className="absolute inset-0 z-1 opacity-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                transition={{ duration: 2 }}
            >
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-gray-500/20 to-cyan-500/20"
                    animate={{ 
                        background: [
                            "linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2), rgba(6, 182, 212, 0.2))",
                            "linear-gradient(90deg, rgba(147, 51, 234, 0.2), rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))",
                            "linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))"
                        ]
                    }}
                    transition={{ 
                        duration: 8, 
                        repeat: Infinity, 
                        repeatType: "reverse" 
                    }}
                />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
            </motion.div>

            {/* Main Content - Centered */}
            <div className="relative z-10 text-white px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
                
                <motion.h1 
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-sans mb-4 sm:mb-6 leading-tight"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                        duration: 1, 
                        delay: 0.4,
                        type: "spring",
                        stiffness: 100
                    }}
                >
                    <motion.span
                        className="block bg-clip-text text-transparent"
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ 
                            opacity: 1, 
                            x: 0,
                            backgroundImage: [
                                "linear-gradient(45deg, #ffffff, #06b6d4, #3b82f6)",
                                "linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)",
                                "linear-gradient(135deg, #06b6d4, #ffffff, #8b5cf6)",
                                "linear-gradient(180deg, #8b5cf6, #3b82f6, #ffffff)",
                                "linear-gradient(225deg, #ffffff, #06b6d4, #3b82f6)"
                            ]
                        }}
                        transition={{ 
                            x: { duration: 0.8, delay: 0.6 },
                            opacity: { duration: 0.8, delay: 0.6 },
                            backgroundImage: { 
                                duration: 4, 
                                repeat: Infinity, 
                                repeatType: "reverse",
                                delay: 1.5
                            }
                        }}
                        style={{
                            backgroundImage: "linear-gradient(45deg, #ffffff, #06b6d4, #3b82f6)",
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            backgroundSize: "200% 200%"
                        }}
                    >
                        Track Crypto Markets
                    </motion.span>
                    <motion.span 
                        className="block bg-clip-text text-transparent mt-2 sm:mt-4"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ 
                            opacity: 1, 
                            x: 0,
                            backgroundImage: [
                                "linear-gradient(45deg, #06b6d4, #8b5cf6, #ffffff)",
                                "linear-gradient(90deg, #ffffff, #3b82f6, #06b6d4)",
                                "linear-gradient(135deg, #8b5cf6, #06b6d4, #3b82f6)",
                                "linear-gradient(180deg, #3b82f6, #ffffff, #8b5cf6)",
                                "linear-gradient(225deg, #06b6d4, #8b5cf6, #ffffff)"
                            ]
                        }}
                        transition={{ 
                            x: { duration: 0.8, delay: 0.8 },
                            opacity: { duration: 0.8, delay: 0.8 },
                            backgroundImage: { 
                                duration: 4, 
                                repeat: Infinity, 
                                repeatType: "reverse",
                                delay: 2
                            }
                        }}
                        style={{
                            backgroundImage: "linear-gradient(45deg, #06b6d4, #8b5cf6, #ffffff)",
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            backgroundSize: "200% 200%"
                        }}
                    >
                        in Real-Time
                    </motion.span>
                </motion.h1>
                
                <motion.p 
                    className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 font-sans mb-8 sm:mb-12 leading-relaxed max-w-4xl mx-auto px-4 sm:px-0"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                >
                    Stay ahead of the crypto market with real-time prices, advanced charts, 
                    and comprehensive analysis tools for Bitcoin, Ethereum, and thousands of other cryptocurrencies.
                   
                </motion.p>

                {/* Simplified Action Buttons */}
                <motion.div 
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4 sm:px-0"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                >
                    <Link href="/dashboard" className="w-full sm:w-auto">
                    <motion.button 
                        className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold font-sans text-base sm:text-lg transition-all duration-200 flex items-center justify-center"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                        Dashboard
                    </motion.button>
                    </Link>

                    <Link href="/compare" className="w-full sm:w-auto">         
                    <motion.button 
                        className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-blue-400 hover:bg-blue-400 hover:text-black rounded-xl font-semibold font-sans text-base sm:text-lg transition-all duration-200 flex items-center justify-center"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                        Compare
                    </motion.button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default Hero;
