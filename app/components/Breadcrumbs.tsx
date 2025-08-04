import Link from 'next/link';
import { decodeHtmlEntities } from '../lib/api';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-[#1e2939] transition-colors"
            >
              {decodeHtmlEntities(item.label)}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{decodeHtmlEntities(item.label)}</span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs; 