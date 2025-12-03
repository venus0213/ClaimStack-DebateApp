import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  FaYoutube, 
  FaLinkedin, 
  FaInstagram, 
  FaTwitter, 
  FaTelegram, 
  FaDiscord 
} from 'react-icons/fa'

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    { 
      name: 'YouTube', 
      icon: FaYoutube, 
      href: 'https://youtube.com', 
      ariaLabel: 'Visit our YouTube channel' 
    },
    { 
      name: 'LinkedIn', 
      icon: FaLinkedin, 
      href: 'https://linkedin.com', 
      ariaLabel: 'Visit our LinkedIn page' 
    },
    { 
      name: 'Instagram', 
      icon: FaInstagram, 
      href: 'https://instagram.com', 
      ariaLabel: 'Visit our Instagram page' 
    },
    { 
      name: 'X (Twitter)', 
      icon: FaTwitter, 
      href: 'https://x.com', 
      ariaLabel: 'Visit our X (Twitter) page' 
    },
    { 
      name: 'Telegram', 
      icon: FaTelegram, 
      href: 'https://telegram.org', 
      ariaLabel: 'Join our Telegram channel' 
    },
    { 
      name: 'Discord', 
      icon: FaDiscord, 
      href: 'https://discord.com', 
      ariaLabel: 'Join our Discord server' 
    },
  ]

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 dark:text-gray-400 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center space-x-6 mt-5 mb-10">
          <Image
            src="/images/logo.png"
            alt="ClaimStack Logo"
            width={32}
            height={32}
            className="w-12 h-12"
          />
          <h3 className="text-white text-4xl sm:text-xl font-semibold">ClaimStack</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <p className="text-xs sm:text-sm leading-relaxed">
              Join the conversation. Share your perspective. Build your argument.
            </p>
            <p className="text-xs sm:text-sm">© {currentYear} Digital Marketing School, LLC.</p>
          </div>

          {/* Company Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 mb-8">
            <div>
              <h4 className="text-white font-medium mb-3 sm:mb-4 text-sm sm:text-lg">Company</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-white transition-colors">
                    How it Works
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Section */}
            <div>
              <h4 className="text-white font-medium mb-3 sm:mb-4 text-sm sm:text-lg">Support</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Section */}
            <div>
              <h4 className="text-white font-medium mb-3 sm:mb-4 text-sm sm:text-lg">Legal</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/community-guidelines" className="hover:text-white transition-colors">
                    Community Guidelines
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="border-t border-gray-800 dark:border-gray-800 pt-6 mb-6">
          <div className="flex flex-col sm:flex-col items-center sm:items-start justify-between gap-4 sm:py-3">
            <h4 className="text-white font-medium text-sm sm:text-lg">Follow Us</h4>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.ariaLabel}
                    className="
                      w-10 h-10 
                      flex items-center justify-center 
                      bg-gray-800 dark:bg-gray-800 
                      hover:bg-gray-700 dark:hover:bg-gray-700 
                      rounded-lg 
                      text-gray-300 dark:text-gray-400 
                      hover:text-white 
                      transition-all duration-200 
                      hover:scale-110
                    "
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="border-t border-gray-800 dark:border-gray-800 pt-6">
          <p className="text-center text-xs sm:text-sm text-gray-400 dark:text-gray-500">
            All rights reserved. ClaimStack © {currentYear}
          </p>
        </div>
      </div>
    </footer>
  )
}

