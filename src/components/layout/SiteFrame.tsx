'use client';

import { usePathname } from 'next/navigation';
import CartDrawer from '@/components/cart/CartDrawer';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import type { ReactNode } from 'react';

export default function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth/');
  const isAdminPage = pathname.startsWith('/admin');
  const isStandalonePage = isAuthPage || isAdminPage;

  return (
    <>
      {!isStandalonePage && <Navbar />}
      {!isStandalonePage && <CartDrawer />}
      <main className={`flex-grow ${isStandalonePage ? '' : 'pt-20 md:pt-0'}`}>
        {children}
      </main>
      {!isStandalonePage && <Footer />}
    </>
  );
}
