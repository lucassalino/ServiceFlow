'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';

interface Props {
  orgId: string;
  children: React.ReactNode;
}

export function AppShell({ orgId, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgId={orgId} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader orgId={orgId} onMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0" style={{ background: '#000000' }}>
          {children}
        </main>

        <BottomNav orgId={orgId} />
      </div>
    </div>
  );
}
