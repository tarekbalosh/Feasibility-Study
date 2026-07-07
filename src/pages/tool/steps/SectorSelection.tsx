import React from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { Utensils, ShoppingCart, Briefcase, Cpu, Factory, PlusCircle } from 'lucide-react';

const sectors = [
  { id: 'مطاعم وأغذية', label: 'مطاعم وأغذية', icon: Utensils },
  { id: 'تجارة وتجزئة', label: 'تجارة وتجزئة', icon: ShoppingCart },
  { id: 'خدمات', label: 'خدمات', icon: Briefcase },
  { id: 'تقني وناشئ', label: 'تقني وناشئ', icon: Cpu },
  { id: 'صناعي', label: 'صناعي', icon: Factory },
  { id: 'مجال آخر', label: 'مجال آخر', icon: PlusCircle },
];

export default function SectorSelection() {
  const { form, nextStep } = useFeasibilityTool();
  const { setValue, watch } = form;
  const currentSector = watch('sector');

  const handleSelect = (sectorId: string) => {
    setValue('sector', sectorId, { shouldValidate: true });
    nextStep();
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">لنبدأ. ما مجال مشروعك؟</h2>
        <p className="text-gray-500">اختيارك يجهّز لك أمثلة وبنوداً تناسب مجالك — وكل شيء قابل للتعديل لاحقاً.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {sectors.map((sector) => {
          const Icon = sector.icon;
          const isSelected = currentSector === sector.id;
          return (
            <button
              key={sector.id}
              onClick={() => handleSelect(sector.id)}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Icon className={`w-8 h-8 mb-3 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className="font-medium">{sector.label}</span>
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-400">بلا تسجيل، وبلا بطاقة دفع — دراستك تُبنى الآن مباشرةً.</p>
      </div>
    </div>
  );
}
