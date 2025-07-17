import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-6">
          <Link href="/">
            <Image 
              src="/images/CK_Logo_Title-01.webp" 
              alt="Cowboy Kimono Logo" 
              width={200} 
              height={80}
              className="mx-auto"
            />
          </Link>
        </div>
        
        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-6">
          <Link href="/" className="hover:text-gray-300 transition-colors">
            Home
          </Link>
          <Link href="/shop" className="hover:text-gray-300 transition-colors">
            Shop
          </Link>
          <Link href="/blog" className="hover:text-gray-300 transition-colors">
            Blog
          </Link>
        </div>
        
        {/* Copyright */}
        <div className="text-sm text-gray-400 border-t border-gray-700 pt-4">
          <p>&copy; {new Date().getFullYear()} Cowboy Kimono. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
