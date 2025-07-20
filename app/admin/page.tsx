import { Metadata } from 'next';
import AdminRedirect from './AdminRedirect';

export const metadata: Metadata = {
  title: 'Admin - Cowboy Kimono',
  description: 'WordPress admin portal for Cowboy Kimono content management',
  robots: 'noindex, nofollow', // Prevent indexing of admin page
};

export default function AdminPage() {
  return <AdminRedirect />;
} 