"use client"

import React from 'react'
import Link from 'next/link'
import { Home, ListChecks, Eye, LayoutDashboard } from 'lucide-react'
import { motion } from 'framer-motion'

const navLinks = [
  { href: '/', label: 'Home', icon: <Home size={18} /> },
  { href: '/compare', label: 'Compare', icon: <ListChecks size={18} /> },
  { href: '/watchlist', label: 'Watch List', icon: <Eye size={18} /> },
];

const Header = () => {
  return (
    <header className="fixed top-0 left-0 flex justify-center w-full z-20 pointer-events-none">
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="w-[80vw] max-w-6xl mt-4 pointer-events-auto bg-black border border-[#222631] rounded-xl shadow-xl flex items-center justify-between px-8 py-3"
      >
        {/* Logo */}
        <Link href="/" >
          <div className="flex items-center space-x-3 group focus:outline-none">
            <span className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-700">
              <span className="text-white font-extrabold text-base font-sans tracking-tight">PC</span>
            </span>
            <span className="text-xl font-semibold text-gray-100 font-sans tracking-tight group-hover:text-blue-400 transition-colors select-none">GeckoView</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map(({ href, label, icon }) => (
            <Link key={label} href={href}>
              <div className="flex items-center gap-2 text-gray-200 hover:text-blue-400 transition-colors font-medium font-sans rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600">
                {icon}
                {label}
              </div>
            </Link>
          ))}
        </nav>

        {/* Dashboard Button */}
        <Link href="/dashboard">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold font-sans shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
            <LayoutDashboard size={18} />
            Dashboard
          </div>
        </Link>
      </motion.div>
    </header>
  )
}

export default Header
