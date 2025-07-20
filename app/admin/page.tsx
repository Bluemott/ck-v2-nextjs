import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getWordPressAdminUrl } from '../lib/wordpress';

export const metadata: Metadata = {
  title: 'Admin - Cowboy Kimono',
  description: 'WordPress admin portal for Cowboy Kimono content management',
  robots: 'noindex, nofollow', // Prevent indexing of admin page
};

export default function AdminPage() {
  // Redirect to WordPress admin
  redirect(getWordPressAdminUrl());
} 