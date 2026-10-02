import re

with open('src/components/tools/swot/tasks/TaskModal.tsx', 'r') as f:
    content = f.read()

# 1. Change onSave type in TaskModalProps
content = content.replace('(data: TaskFormData | TaskFormData[], addAnother: boolean) => Promise<void>;', '(data: TaskFormData, addAnother: boolean) => Promise<void>;')

# 2. Remove states
content = re.sub(r'const \[addMode, setAddMode\] = useState<"single" \| "multiple">.*?\n', '', content)
content = re.sub(r'const \[multiTitles, setMultiTitles\] = useState.*?\n', '', content)

# 3. Simplify weightAfterSave
content = re.sub(r'const weightAfterSave = currentWeightSum \+ \(addMode === "single" \? form\.weight : 0\);.*?\n', 'const weightAfterSave = currentWeightSum + form.weight;\n', content)

# 4. Simplify validate function
val_func = r'''  const validate = \(\) => \{
    const newErrors: Record<string, string> = \{\};
    if \(addMode === "single"\) \{
      if \(!form\.title\.trim\(\)\) newErrors\.title = "عنوان المهمة مطلوب";
      if \(form\.weight <= 0\) newErrors\.weight = "يجب أن يكون الوزن أكبر من 0";
      if \(weightAfterSave > 100\) newErrors\.weight = "مجموع الأوزان يتجاوز 100%";
    \} else \{
      if \(!multiTitles\.trim\(\)\) newErrors\.multiTitles = "يجب إدخال مهمة واحدة على الأقل";
      if \(remainingWeight <= 0\) newErrors\.weight = "لا يوجد وزن متبقي لإضافته للمهام الجديدة";
    \}
    setErrors\(newErrors\);
    return Object\.keys\(newErrors\)\.length === 0;
  \};'''

new_val_func = '''  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = "عنوان المهمة مطلوب";
    if (form.weight <= 0) newErrors.weight = "يجب أن يكون الوزن أكبر من 0";
    if (weightAfterSave > 100) newErrors.weight = "مجموع الأوزان يتجاوز 100%";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };'''
content = re.sub(r'  const validate = \(\) => \{.*?^\s*\}\;\n', new_val_func + '\n', content, flags=re.MULTILINE|re.DOTALL)

# 5. Simplify handleSave
handle_save_pattern = r'  const handleSave = async \(addAnother: boolean\) => \{.*?    } finally \{\n      setIsSubmitting\(false\);\n    \}\n  \};\n'

new_handle_save = '''  const handleSave = async (addAnother: boolean) => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSave(form, addAnother);
      if (addAnother) {
        setForm(prev => ({
          ...prev,
          title: "",
          weight: Math.min(10, remainingWeight - form.weight),
        }));
        titleRef.current?.focus();
      }
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };
'''
content = re.sub(handle_save_pattern, new_handle_save, content, flags=re.DOTALL)

# 6. Remove the mode switch buttons
mode_switch_pattern = r'\{\!isEdit && \(\s*<div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-lg mb-6 w-fit mx-auto">.*?</button>\s*</div>\s*\)\}'
content = re.sub(mode_switch_pattern, '', content, flags=re.DOTALL)

# 7. Remove {addMode === "single" && ( ... )} around title/weight/cost
content = content.replace('{addMode === "single" && (', '')
# Remove the corresponding closing ')}' for those sections (this is tricky with regex, so we'll just replace the specific sections)
content = re.sub(r'\{addMode === "multiple" && \(\s*<div.*?</textarea>\s*</div>\s*\)\}', '', content, flags=re.DOTALL)

content = re.sub(r'\}\)\}\s*\{addMode === "single" && \(\s*<div className="grid grid-cols-2 gap-4">', '} <div className="grid grid-cols-2 gap-4">', content, flags=re.DOTALL)
content = re.sub(r'\}\)\}\s*\{addMode === "multiple" && \(\s*<div className="p-3.*?</div>\s*\)\}', '', content, flags=re.DOTALL)

# Let's just fix the strings in the buttons
content = content.replace('{addMode === "single" ? "حفظ وإضافة مهمة أخرى" : "إضافة مهام أخرى"}', '"حفظ وإضافة مهمة أخرى"')
content = content.replace('{addMode === "single" ? "حفظ المهمة" : "حفظ المهام"}', '"حفظ المهمة"')

with open('src/components/tools/swot/tasks/TaskModal.tsx', 'w') as f:
    f.write(content)
