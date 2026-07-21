'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/** "YYYY-MM-DD" -> Date, parsed as LOCAL midnight (avoids the UTC day-shift `new Date(str)` gives). */
function parseDateStr(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

/** Date -> "YYYY-MM-DD" in LOCAL time (not toISOString, which shifts to UTC). */
function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Single-date picker: a button showing the chosen date that opens a calendar popover. */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Escolhe uma data',
  className,
}: {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDateStr(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', !selected && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="h-4 w-4" />
          {selected ? formatDisplay(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(formatDateStr(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Date-range picker: pick a start and end date from a single calendar popover. */
export function DateRangePicker({
  startValue,
  endValue,
  onChange,
  placeholder = 'Escolhe o período',
  className,
}: {
  startValue: string | null;
  endValue: string | null;
  onChange: (range: { start: string; end: string }) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const from = parseDateStr(startValue);
  const to = parseDateStr(endValue);
  const range: DateRange | undefined = from ? { from, to } : undefined;

  function label() {
    if (from && to) return `${formatDisplay(from)} – ${formatDisplay(to)}`;
    if (from) return formatDisplay(from);
    return placeholder;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', !from && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="h-4 w-4" />
          {label()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          defaultMonth={from}
          numberOfMonths={2}
          onSelect={(next) => {
            if (!next?.from) return;
            onChange({
              start: formatDateStr(next.from),
              end: formatDateStr(next.to ?? next.from),
            });
            if (next.to) setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
