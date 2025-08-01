"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { Home, ListChecks, Eye, LayoutDashboard, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const navLinks = [
  { href: '/', label: 'Home', icon: <Home size={18} /> },
  { href: '/compare', label: 'Compare', icon: <ListChecks size={18} /> },
  { href: '/watchlist', label: 'Watch List', icon: <Eye size={18} /> },
];

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className="fixed top-0 left-0 flex justify-center w-full z-20 pointer-events-none">
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="w-[95vw] sm:w-[90vw] lg:w-[80vw] max-w-6xl mt-2 sm:mt-4 pointer-events-auto bg-black border border-[#222631] rounded-xl shadow-xl flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3"
        >
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 sm:space-x-3 group focus:outline-none">
              <Image
                src="/logo.png"
                alt="GeckoView Logo"
                width={32}
                height={32}
                className="sm:w-9 sm:h-9"
              />
              <span className="text-lg sm:text-xl font-semibold text-gray-100 font-sans tracking-tight group-hover:text-blue-400 transition-colors select-none">
                GeckoView
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map(({ href, label, icon }) => (
              <Link key={label} href={href}>
                <div className="flex items-center gap-2 text-gray-200 hover:text-blue-400 transition-colors font-medium font-sans rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600">
                  {icon}
                  {label}
                </div>
              </Link>
            ))}
          </nav>

          {/* Desktop Dashboard Button & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {/* Dashboard Button - Hidden on very small screens */}
            <Link href="/dashboard" className="hidden sm:block">
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold font-sans shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base">
                <LayoutDashboard size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden md:inline">Dashboard</span>
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-gray-200 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-lg"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </motion.div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={toggleMobileMenu}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 right-0 h-full w-64 bg-black border-l border-[#222631] z-40 lg:hidden"
          >
            <div className="flex flex-col p-6 pt-20">
              {/* Mobile Navigation Links */}
              <nav className="flex flex-col space-y-4 mb-8">
                {navLinks.map(({ href, label, icon }) => (
                  <Link key={label} href={href} onClick={toggleMobileMenu}>
                    <div className="flex items-center gap-3 text-gray-200 hover:text-blue-400 transition-colors font-medium font-sans rounded-lg px-3 py-3 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
                      {icon}
                      {label}
                    </div>
                  </Link>
                ))}
              </nav>

              {/* Mobile Dashboard Button */}
              <Link href="/dashboard" onClick={toggleMobileMenu}>
                <div className="flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold font-sans shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 w-full justify-center">
                  <LayoutDashboard size={18} />
                  Dashboard
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header