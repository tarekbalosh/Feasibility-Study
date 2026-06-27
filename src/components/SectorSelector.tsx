import React from 'react';
import { useRouter } from 'next/router';

interface SectorSelectorProps {
  selectedSector: string;
  onSelect: (sector: string) => void;
}

const sectors = [
  { value: 'commercial', label: 'تجاري' },
  { value: 'industrial', label: 'صناعي' },
  { value: 'service', label: 'خدمي' },
  { value: 'tech', label: 'تقني' },
  { value: 'other', label: 'أخرى' },
];

export const SectorSelector: React.FC<SectorSelectorProps> = ({ selectedSector, onSelect }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">اختر نوع النشاط</label>
      <select
        className="rounded border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={selectedSector}
        onChange={(e) => onSelect(e.target.value)}
      >
        {sectors.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
};
