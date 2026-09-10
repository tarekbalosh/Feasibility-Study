import React from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { Utensils, ShoppingCart, Briefcase, Cpu, Factory, PlusCircle } from 'lucide-react';

const sectors = [
  { id: 'مطاعم وأغذية', label: 'مطاعم وأغذية', icon: Utensils },
  { id: 'تجارة وتجزئة', label: 'تجارة وتجزئة', icon: ShoppingCart },
  { id: 'خدمات', label: 'خدمات', icon: Briefcase },
  { id: 'تقني وناشئ', label: 'تقني وناشئ', icon: Cpu },
  { id: 'صناعي', label: 'صناعي', icon: Factory },
];

const OTHER_SECTOR_LABEL = 'مجال آخر';

export const getServerSideProps = async () => ({ props: {} });

export default function SectorSelection() {
  const { form, nextStep } = useFeasibilityTool();
  const { setValue, watch } = form;
  const currentSector = watch('sector');
  const [otherMode, setOtherMode] = React.useState(
    () => !!currentSector && !sectors.some((s) => s.id === currentSector)
  );

  const handleSelect = (sectorId: string) => {
    setOtherMode(false);
    setValue('sector', sectorId, { shouldValidate: true });
    nextStep();
  };

  const handleSelectOther = () => {
    setOtherMode(true);
    setValue('sector', '', { shouldValidate: true });
  };

  const handleOtherContinue = () => {
    if (currentSector?.trim()) nextStep();
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
          const isSelected = !otherMode && currentSector === sector.id;
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

        {otherMode ? (
          <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-indigo-600 bg-indigo-50">
            <input
              autoFocus
              type="text"
              value={currentSector || ''}
              onChange={(e) => setValue('sector', e.target.value, { shouldValidate: true })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleOtherContinue();
                }
              }}
              placeholder="اكتب نشاط مشروعك"
              maxLength={60}
              className="w-full px-2 py-1.5 text-sm text-center text-gray-900 placeholder-gray-400 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => {
                setOtherMode(false);
                setValue('sector', '', { shouldValidate: true });
              }}
              className="text-[11px] text-gray-400 hover:text-gray-600 underline"
            >
              رجوع للقائمة
            </button>
          </div>
        ) : (
          <button
            onClick={handleSelectOther}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50 text-gray-700 transition-all duration-200"
          >
            <PlusCircle className="w-8 h-8 mb-3 text-gray-400" />
            <span className="font-medium">{OTHER_SECTOR_LABEL}</span>
          </button>
        )}
      </div>

      {otherMode && (
        <div className="text-center mb-8 -mt-4">
          <button
            type="button"
            disabled={!currentSector?.trim()}
            onClick={handleOtherContinue}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          >
            متابعة
          </button>
        </div>
      )}

      <div className="text-center">
        <p className="text-sm text-gray-400">بلا بطاقة دفع — دراستك تُبنى الآن مباشرةً داخل مساحة عملك.</p>
      </div>
    </div>
  );
}
