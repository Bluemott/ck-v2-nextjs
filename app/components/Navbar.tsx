import Image from 'next/image';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav
      className="fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-[#c5e8f9] text-gray-800 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="text-lg font-bold">
        <Link href="/" aria-label="Go to homepage">
          <Image
            src="/images/CK_Logo_Title-01.webp"
            alt="Cowboy Kimono Logo"
            width={200}
            height={80}
            priority
            sizes="200px"
            quality={85}
            className="transition-transform hover:scale-105 focus:outline-none rounded"
          />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex space-x-4" role="menubar">
        <Link
          href="/shop"
          className="hover:underline serif font-bold text-lg transition-colors focus:outline-none rounded px-2 py-1"
          role="menuitem"
          aria-label="Visit our shop"
        >
          Shop
        </Link>
        <Link
          href="/blog"
          className="hover:underline serif font-bold text-lg transition-colors focus:outline-none rounded px-2 py-1"
          role="menuitem"
          aria-label="Read our blog"
        >
          Blog
        </Link>
        <Link
          href="/downloads"
          className="hover:underline serif font-bold text-lg transition-colors focus:outline-none rounded px-2 py-1"
          role="menuitem"
          aria-label="Download free resources"
        >
          Downloads
        </Link>
        <Link
          href="/custom-kimonos"
          className="hover:underline serif font-bold text-lg transition-colors focus:outline-none rounded px-2 py-1"
          role="menuitem"
          aria-label="Customize kimonos"
        >
          Customize
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
