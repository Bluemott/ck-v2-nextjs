import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-[#c5e8f9] text-gray-800 z-50">
      {/* Logo */}
      <div className="text-lg font-bold">
        <Link href="/">
          <Image src="/images/CK_Logo_Title-01.png" alt="Logo" width={200} height={80} />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex space-x-4">
        <Link href="/shop" className="hover:underline">
          Shop
        </Link>
        <Link href="/blog" className="hover:underline">
          Blog
        </Link>
        <Link href="/about" className="hover:underline">
          About
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
