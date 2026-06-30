'use client';

import { useState } from 'react';
import { Pencil, Trash2, PowerOff, Power, Download, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { useOrgStore } from '@/stores/orgStore';
import {
  useMinistries, useDeleteMinistry,
  useToggleMinistryActive, useImportPresetMinistries,
} from '@/hooks/useMinistries';
import { MEMBER_FUNCTIONS } from '@/lib/constants';
import type { Ministry } from '@/types/models';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MinistryDialog } from './MinistryDialog';

type Tab = 'active' | 'inactive' | 'all';

const TABS: { value: Tab; label: string }[] = [
  { value: 'active',   label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'all',      label: 'Todos' },
];

export function MinistriesClient() {
  const { activeOrg, activeMembership } = useOrgStore();
  const isAdmin = activeMembership?.role === 'admin';
  const { data: ministries = [], isLoading } = useMinistries();
  const deleteMinistry = useDeleteMinistry();
  const toggleActive = useToggleMinistryActive();
  const importPresets = useImportPresetMinistries();

  const [tab, setTab] = useState<Tab>('active');
  const [editTarget, setEditTarget] = useState<Ministry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ministry | null>(null);

  async function handleToggle(m: Ministry) {
    try {
      await toggleActive.mutateAsync({ id: m.id, isActive: !m.is_active });
      toast.success(m.is_active ? `"${m.name}" desactivado` : `"${m.name}" activado`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao actualizar');
    }
  }

  async function handleImport() {
    try {
      const count = await importPresets.mutateAsync();
      if (count === 0) {
        toast.info('Todos os ministérios já foram carregados.');
      } else {
        toast.success(`${count} ministério${count !== 1 ? 's' : ''} carregado${count !== 1 ? 's' : ''}.`);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMinistry.mutateAsync(deleteTarget.id);
      toast.success('Ministério removido');
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao remover');
    }
  }

  const filtered = ministries.filter((m) => {
    if (tab === 'active') return m.is_active;
    if (tab === 'inactive') return !m.is_active;
    return true;
  });

  const activeCount   = ministries.filter((m) =>  m.is_active).length;
  const inactiveCount = ministries.filter((m) => !m.is_active).length;

  return (
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 space-y-6">

        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              Organização
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1">
              Ministérios
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {ministries.length > 0
                ? `${activeCount} activo${activeCount !== 1 ? 's' : ''} · ${inactiveCount} inactivo${inactiveCount !== 1 ? 's' : ''}`
                : 'Grupos e equipas da organização'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={handleImport}
              disabled={importPresets.isPending}
              className="dark-primary-btn"
            >
              <Download className="h-4 w-4" />
              {importPresets.isPending ? 'A carregar…' : 'Carregar ministérios'}
            </button>
          )}
        </div>

        {/* ── Tab filter ──────────────────────────────── */}
        <div style={{
          display: 'inline-flex', gap: '0.25rem', padding: '0.25rem',
          borderRadius: '0.625rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {TABS.map(({ value, label }) => {
            const isActive = tab === value;
            const count = value === 'active' ? activeCount : value === 'inactive' ? inactiveCount : ministries.length;
            return (
              <button
                key={value}
                onClick={() => setTab(value)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.375rem 0.875rem',
                  borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: isActive ? 600 : 500,
                  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.38)',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget.style.color = 'rgba(255,255,255,0.65)'); }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget.style.color = 'rgba(255,255,255,0.38)'); }}
              >
                {label}
                {count > 0 && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700,
                    padding: '0.1rem 0.4rem', borderRadius: '9999px',
                    background: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Grid ────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="events-dark-empty">
            <LayoutGrid className="h-10 w-10 mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {tab === 'inactive' ? 'Nenhum ministério inactivo.' :
               tab === 'active'   ? 'Nenhum ministério activo.' :
               'Nenhum ministério carregado.'}
            </p>
            {isAdmin && tab !== 'inactive' && (
              <button onClick={handleImport} disabled={importPresets.isPending} className="dark-primary-btn mt-4">
                <Download className="h-4 w-4" /> Carregar ministérios
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((ministry) => (
              <MinistryCard
                key={ministry.id}
                ministry={ministry}
                onEdit={() => setEditTarget(ministry)}
                onToggle={() => handleToggle(ministry)}
                onDelete={() => setDeleteTarget(ministry)}
                togglePending={toggleActive.isPending && toggleActive.variables?.id === ministry.id}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}

      </div>

      <MinistryDialog
        orgId={activeOrg?.id ?? ''}
        ministry={editTarget}
        open={!!editTarget}
        onOpenChange={(v) => { if (!v) setEditTarget(null); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover ministério?</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres remover <strong>{deleteTarget?.name}</strong>? Esta acção não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteMinistry.isPending}
            >
              {deleteMinistry.isPending ? 'A remover…' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Ministry Card ─────────────────────────────────────────────────────────────

function MinistryCard({
  ministry, onEdit, onToggle, onDelete, togglePending, isAdmin,
}: {
  ministry: Ministry;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  togglePending: boolean;
  isAdmin: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const fnLabels = ministry.functions
    .map((k) => MEMBER_FUNCTIONS.find((f) => f.key === k))
    .filter(Boolean)
    .slice(0, 5);

  const color = ministry.color ?? '#a5b4fc';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1.25rem 1rem',
        borderRadius: '0.875rem',
        background: hovered ? 'rgba(35,35,40,0.9)' : 'rgba(22,22,26,0.85)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        opacity: ministry.is_active ? 1 : 0.5,
        overflow: 'hidden',
      }}
    >
      {/* Top colour accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${color}99, ${color}33)`,
        borderRadius: '0.875rem 0.875rem 0 0',
      }} />

      {/* Status dot */}
      <div style={{
        position: 'absolute', top: '0.625rem', right: '0.625rem',
        width: '0.5rem', height: '0.5rem',
        borderRadius: '50%',
        background: ministry.is_active ? color : 'rgba(255,255,255,0.2)',
        boxShadow: ministry.is_active ? `0 0 6px ${color}88` : 'none',
      }} />

      {/* Inactive badge */}
      {!ministry.is_active && (
        <span style={{
          position: 'absolute', top: '0.5rem', left: '0.5rem',
          fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.4rem',
          borderRadius: '9999px', letterSpacing: '0.04em',
          background: 'rgba(239,68,68,0.12)', color: '#f87171',
          border: '1px solid rgba(248,113,113,0.2)',
        }}>
          INACTIVO
        </span>
      )}

      {/* Icon */}
      <span style={{ fontSize: '2.5rem', lineHeight: 1, marginTop: '0.5rem' }}>
        {ministry.icon}
      </span>

      {/* Name */}
      <span style={{
        fontSize: '0.8rem', fontWeight: 600, color: '#ffffff',
        textAlign: 'center', lineHeight: 1.3,
      }}>
        {ministry.name}
      </span>

      {/* Function emojis */}
      {fnLabels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
          {fnLabels.map((f) => f && (
            <span key={f.key} title={f.label} style={{ fontSize: '0.875rem' }}>{f.emoji}</span>
          ))}
          {ministry.functions.length > 5 && (
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>
              +{ministry.functions.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Actions — admin only, fade in on hover */}
      {isAdmin && <div style={{
        display: 'flex', gap: '0.25rem', marginTop: '0.25rem',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.15s',
      }}>
        <button
          className="dark-icon-btn"
          onClick={onEdit}
          title="Gerir membros"
        >
          <Pencil style={{ width: '0.75rem', height: '0.75rem' }} />
        </button>
        <button
          className="dark-icon-btn"
          onClick={onToggle}
          disabled={togglePending}
          title={ministry.is_active ? 'Desactivar' : 'Activar'}
          style={{
            color: ministry.is_active ? '#fcd34d' : '#6ee7b7',
          }}
        >
          {ministry.is_active
            ? <PowerOff style={{ width: '0.75rem', height: '0.75rem' }} />
            : <Power style={{ width: '0.75rem', height: '0.75rem' }} />}
        </button>
        <button
          className="dark-icon-btn danger"
          onClick={onDelete}
          title="Remover"
        >
          <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
        </button>
      </div>}
    </div>
  );
}
