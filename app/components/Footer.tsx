import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 px-4" role="contentinfo">
      <div className="max-w-6xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-6">
          <Link href="/" aria-label="Go to homepage">
            <Image 
              src="/images/CK_Logo_Title-01.webp" 
              alt="Cowboy Kimono Logo" 
              width={200} 
              height={80}
              className="mx-auto transition-transform hover:scale-105 focus:outline-none rounded"
            />
          </Link>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-6" role="navigation" aria-label="Footer navigation">
          <Link href="/" className="hover:text-gray-300 transition-colors focus:outline-none rounded px-2 py-1">
            Home
          </Link>
          <Link href="/shop" className="hover:text-gray-300 transition-colors focus:outline-none rounded px-2 py-1">
            Shop
          </Link>
          <Link href="/blog" className="hover:text-gray-300 transition-colors focus:outline-none rounded px-2 py-1">
            Blog
          </Link>
        </nav>
        
        {/* Copyright */}
        <div className="text-sm text-gray-400 border-t border-gray-700 pt-4">
          <p>&copy; {new Date().getFullYear()} Cowboy Kimono. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
