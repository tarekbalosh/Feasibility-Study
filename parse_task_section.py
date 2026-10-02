import re

with open('src/components/tools/swot/strategies/TaskManagementSection.tsx', 'r') as f:
    content = f.read()

# Replace ReviewGoalsSection with TaskManagementSection
content = content.replace('ReviewGoalsSection', 'TaskManagementSection')

# Remove SMART goals generation button
content = re.sub(r'\{/\* زر صياغة الأهداف بطريقة SMART \*/\}.*?</button>\n\s*</div>', '', content, flags=re.DOTALL)

# Remove isGenerating state and handleGenerateSmart
content = re.sub(r'const \[isGenerating, setIsGenerating\] = useState\(false\);\n', '', content)
content = re.sub(r'const handleGenerateSmart = async \(\) => \{.*?\};\n', '', content, flags=re.DOTALL)

# Change header text
content = content.replace('استعراض الأهداف', 'إدارة المهام الاستراتيجية')
content = content.replace('قائمة بجميع الأهداف الاستراتيجية التي تم استخراجها وصياغتها من التحليل (الاستراتيجيات التقليدية والتقاطعية).', 'هنا يمكنك تقسيم أهدافك الاستراتيجية إلى مهام تنفيذية قابلة للقياس، وتوزيع المهام على فريق العمل ومتابعة الإنجاز.')

with open('src/components/tools/swot/strategies/TaskManagementSection.tsx', 'w') as f:
    f.write(content)
