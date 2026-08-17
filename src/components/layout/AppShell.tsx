'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';
import { NavProgress } from './NavProgress';
import { GlobalActivityBar } from './GlobalActivityBar';

interface Props {
  orgId: string;
  children: React.ReactNode;
}

export function AppShell({ orgId, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex overflow-hidden" style={{ height: '100dvh' }}>
      <NavProgress />
      <GlobalActivityBar />
      <Sidebar orgId={orgId} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader orgId={orgId} onMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden app-main" style={{ background: 'var(--wis-canvas)' }}>
          {children}
        </main>

        <BottomNav orgId={orgId} />
      </div>
    </div>
  );
}
