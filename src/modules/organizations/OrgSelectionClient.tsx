'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Organization, OrganizationMember } from '@/types/models';

interface OrgSelectionClientProps {
  initialMemberships: (OrganizationMember & { organization: Organization })[];
}

export function OrgSelectionClient({ initialMemberships }: OrgSelectionClientProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Selecionar Organização</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Escolhe uma organização para continuar
          </p>
        </div>

        <div className="space-y-3">
          {initialMemberships.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">
              Ainda não pertences a nenhuma organização.
            </p>
          ) : (
            initialMemberships.map((membership) => (
              <button
                key={membership.id}
                onClick={() => router.push(`/${membership.org_id}/dashboard`)}
                className="w-full flex items-center justify-between rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-3">
                  {membership.organization.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={membership.organization.logo_url}
                      alt={membership.organization.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {membership.organization.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{membership.organization.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{membership.role}</p>
                  </div>
                </div>
                <span className="text-muted-foreground">›</span>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/new-org"
            className="flex items-center justify-center rounded-lg border border-dashed bg-background p-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            + Criar organização
          </Link>
          <Link
            href="/join-org"
            className="flex items-center justify-center rounded-lg border border-dashed bg-background p-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Entrar numa organização
          </Link>
        </div>
      </div>
    </div>
  );
}
