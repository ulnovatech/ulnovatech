'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { filterOptions } from '@agency/geo';

type SearchableSelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn('w-5 h-5 text-slate-500 transition-transform', open && 'rotate-180')}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  disabled = false,
}: SearchableSelectProps) {
  const id = useId();
  const listId = `${id}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlight, setHighlight] = useState(0);

  const filtered = filterOptions(options, open ? search : value);

  useEffect(() => {
    if (!open) setSearch(value);
  }, [value, open]);

  useEffect(() => {
    setHighlight(0);
  }, [search, open]);

  useEffect(() => {
    const onDocPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointer);
    return () => document.removeEventListener('pointerdown', onDocPointer);
  }, []);

  const select = (option: string) => {
    onChange(option);
    setSearch(option);
    setOpen(false);
    inputRef.current?.blur();
  };

  const openList = () => {
    if (disabled || options.length === 0) return;
    setSearch('');
    setOpen(true);
  };

  const toggleOpen = () => {
    if (disabled || options.length === 0) return;
    if (open) {
      setOpen(false);
    } else {
      openList();
    }
  };

  const showList = open && !disabled && options.length > 0;
  const listItems = showList ? (search.trim() ? filtered : options) : [];

  return (
    <div ref={rootRef} className="relative block min-w-0">
      <label htmlFor={id} className="text-sm font-medium text-slate-600">
        {label}
      </label>

      <div className="relative mt-1 flex">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-haspopup="listbox"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          readOnly={disabled}
          className={cn(
            'flex-1 min-w-0 border border-slate-300 rounded-l-md px-3 py-2.5 text-sm bg-white',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            disabled && 'bg-slate-100 text-slate-400 cursor-not-allowed',
          )}
          value={open ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!disabled && options.length > 0 && !open) {
              openList();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (!open) openList();
              else setHighlight((h) => Math.min(h + 1, listItems.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === 'Enter' && open && listItems.length > 0) {
              e.preventDefault();
              select(listItems[highlight] ?? listItems[0]);
            } else if (e.key === 'Escape') {
              setOpen(false);
              setSearch(value);
            }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled || options.length === 0}
          aria-label={`Open ${label} options`}
          aria-expanded={showList}
          className={cn(
            'shrink-0 flex items-center justify-center px-3 border border-l-0 border-slate-300 rounded-r-md bg-slate-50',
            'hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-0',
            (disabled || options.length === 0) && 'opacity-50 cursor-not-allowed',
          )}
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleOpen}
        >
          <ChevronDown open={open} />
        </button>
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-[200] mt-1 max-h-56 overflow-y-auto rounded-md border border-slate-300 bg-white py-1 shadow-xl"
        >
          {listItems.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
          ) : (
            listItems.map((option, i) => (
              <li
                key={option}
                role="option"
                aria-selected={option === value}
                className={cn(
                  'px-3 py-2.5 text-sm cursor-pointer select-none',
                  i === highlight
                    ? 'bg-brand-600 text-white'
                    : option === value
                      ? 'bg-brand-50 text-brand-900 font-medium'
                      : 'text-slate-800 hover:bg-slate-100',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => select(option)}
              >
                {option}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
