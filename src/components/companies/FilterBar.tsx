'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FilterState {
  search: string;
  priorities: string[];
  fiscalYears: string[];
  scoreMin: number;
  scoreMax: number;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableFiscalYears: string[];
  totalCount: number;
  filteredCount: number;
}

interface MultiSelectDropdownProps {
  label: string;
  icon: React.ReactNode;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function MultiSelectDropdown({ label, icon, options, selected, onChange }: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-10 px-3 border-gray-200 hover:border-[#1e3a5f]/30 hover:bg-gray-50 rounded-lg gap-2 min-w-[140px] justify-between',
          selected.length > 0 && 'border-[#1e3a5f]/30 bg-[#1e3a5f]/5'
        )}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm">{label}</span>
          {selected.length > 0 && (
            <Badge className="bg-[#1e3a5f] text-white text-xs px-1.5 py-0 h-5 min-w-[20px]">
              {selected.length}
            </Badge>
          )}
        </div>
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleOption(option.value)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
            >
              <span className={selected.includes(option.value) ? 'text-[#1e3a5f] font-medium' : 'text-gray-700'}>
                {option.label}
              </span>
              {selected.includes(option.value) && <Check className="h-4 w-4 text-[#1e3a5f]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ScoreRangeDropdownProps {
  min: number;
  max: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}

function ScoreRangeDropdown({ min, max, onMinChange, onMaxChange }: ScoreRangeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasFilter = min > 0 || max < 100;

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-10 px-3 border-gray-200 hover:border-[#1e3a5f]/30 hover:bg-gray-50 rounded-lg gap-2 min-w-[140px] justify-between',
          hasFilter && 'border-[#1e3a5f]/30 bg-[#1e3a5f]/5'
        )}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" />
          <span className="text-sm">Score Range</span>
          {hasFilter && (
            <Badge className="bg-[#1e3a5f] text-white text-xs px-1.5 py-0 h-5">
              {min}-{max}
            </Badge>
          )}
        </div>
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase">Min Score</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={min}
                onChange={(e) => onMinChange(Math.min(Number(e.target.value), max))}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase">Max Score</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={max}
                onChange={(e) => onMaxChange(Math.max(Number(e.target.value), min))}
                className="h-9"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  filters,
  onFilterChange,
  availableFiscalYears,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const priorityOptions = [
    { value: 'A', label: 'Tier A (High)' },
    { value: 'B', label: 'Tier B (Medium)' },
    { value: 'C', label: 'Tier C (Low)' },
  ];

  const fiscalYearOptions = availableFiscalYears.map((year) => ({
    value: year,
    label: year,
  }));

  const hasActiveFilters =
    filters.search ||
    filters.priorities.length > 0 ||
    filters.fiscalYears.length > 0 ||
    filters.scoreMin > 0 ||
    filters.scoreMax < 100;

  const clearAllFilters = () => {
    onFilterChange({
      search: '',
      priorities: [],
      fiscalYears: [],
      scoreMin: 0,
      scoreMax: 100,
    });
  };

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.priorities.length +
    filters.fiscalYears.length +
    (filters.scoreMin > 0 || filters.scoreMax < 100 ? 1 : 0);

  return (
    <div className="bg-white rounded-xl shadow-tp border-0 p-4 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, RCS number, or parent company..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-10 h-10 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-2">
          <MultiSelectDropdown
            label="Priority"
            icon={<Filter className="h-4 w-4 text-gray-400" />}
            options={priorityOptions}
            selected={filters.priorities}
            onChange={(priorities) => onFilterChange({ ...filters, priorities })}
          />

          {fiscalYearOptions.length > 0 && (
            <MultiSelectDropdown
              label="Fiscal Year"
              icon={<Filter className="h-4 w-4 text-gray-400" />}
              options={fiscalYearOptions}
              selected={filters.fiscalYears}
              onChange={(fiscalYears) => onFilterChange({ ...filters, fiscalYears })}
            />
          )}

          <ScoreRangeDropdown
            min={filters.scoreMin}
            max={filters.scoreMax}
            onMinChange={(scoreMin) => onFilterChange({ ...filters, scoreMin })}
            onMaxChange={(scoreMax) => onFilterChange({ ...filters, scoreMax })}
          />

          {/* Clear All */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="h-10 px-3 text-gray-500 hover:text-red-600 hover:bg-red-50 gap-2"
            >
              <X className="h-4 w-4" />
              Clear all
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Active filter summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            Showing <span className="font-semibold text-[#1e3a5f]">{filteredCount}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> companies
          </span>
        </div>
      )}
    </div>
  );
}
