import React from 'react';
import { useForm } from 'react-hook-form';
import { SECTORS, SectorField } from '@/config/sectors';

interface DynamicFormProps {
  sector: string;
  onSubmit: (data: Record<string, any>) => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ sector, onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const sectorConfig = SECTORS[sector];
  if (!sectorConfig) return null;

  const renderField = (field: SectorField) => (
    <div key={field.key} className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
      <input
        type="number"
        step="any"
        {...register(field.key, { required: true })}
        placeholder={field.placeholder}
        className="w-full rounded border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {errors[field.key] && <p className="text-xs text-red-600 mt-1">هذا الحقل مطلوب</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
      {sectorConfig.fields.map(renderField)}
      <button
        type="submit"
        className="mt-4 rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 transition"
      >
        احسب
      </button>
    </form>
  );
};
