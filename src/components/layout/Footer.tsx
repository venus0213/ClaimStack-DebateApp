import React from 'react'
import Link from 'next/link'

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          <div>
            <h3 className="text-white text-base sm:text-lg font-semibold mb-3 sm:mb-4">ClaimStack</h3>
            <p className="text-xs sm:text-sm">© {currentYear} Digital Marketing School, LLC.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Company</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  {/* <Link href="/legal" className="hover:text-white transition-colors"> */}
                    Legal
                  {/* </Link> */}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Explore</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                <li>
                  {/* <Link href="/browse" className="hover:text-white transition-colors"> */}
                    Category
                  {/* </Link> */}
                </li>
                <li>
                  {/* <Link href="/browse?sort=trending" className="hover:text-white transition-colors"> */}
                    Trending
                  {/* </Link> */}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

