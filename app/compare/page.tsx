import React, { Suspense } from 'react'
import Compare from '@/components/compare/compare'

const page = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-30 bg-black text-white flex items-center justify-center font-roboto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading comparison...</p>
        </div>
      </div>
    }>
      <Compare />
    </Suspense>
  )
}

export default page