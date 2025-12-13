/**
 * Search Input Component
 * 
 * Search input with debouncing for component search.
 * 
 * Stage 2 Module 6: Visual Library
 */

'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import debounce from 'lodash.debounce';

export interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [query, setQuery] = useState('');

  // Debounced search function
  const debouncedSearch = useEffect(() => {
    const debounced = debounce((value: string) => {
      onSearch(value);
    }, debounceMs);

    return () => {
      debounced.cancel();
    };
  }, [onSearch, debounceMs]);

  const handleChange = (value: string) => {
    setQuery(value);
    const debounced = debounce((v: string) => onSearch(v), debounceMs);
    debounced(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}








