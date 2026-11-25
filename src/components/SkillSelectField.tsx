import React from 'react';
import { CUSTOM_SKILL_OPTION, SKILLS_LIST } from '../data/constants';

interface SkillSelectFieldProps {
  id: string;
  label: string;
  selectedSkill: string;
  customSkill: string;
  onSelectSkill: (skill: string) => void;
  onCustomSkillChange: (val: string) => void;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  required?: boolean;
}

export const SkillSelectField: React.FC<SkillSelectFieldProps> = ({
  id,
  label,
  selectedSkill,
  customSkill,
  onSelectSkill,
  onCustomSkillChange,
  includeAllOption = false,
  allOptionLabel = 'सभी काम (All Skills)',
  required = false,
}) => {
  const isCustom = selectedSkill === CUSTOM_SKILL_OPTION;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-slate-800"
      >
        {label}
        {required && <span className="text-orange-600 ml-1">*</span>}
      </label>
      <select
        id={id}
        value={selectedSkill}
        onChange={(e) => onSelectSkill(e.target.value)}
        className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      >
        {includeAllOption && <option value="ALL">{allOptionLabel}</option>}
        {SKILLS_LIST.map((skill) => (
          <option key={skill} value={skill}>
            {skill}
          </option>
        ))}
      </select>

      {isCustom && (
        <div>
          <label htmlFor={`${id}-custom`} className="sr-only">
            खुद का काम लिखें
          </label>
          <input
            id={`${id}-custom`}
            type="text"
            value={customSkill}
            onChange={(e) => onCustomSkillChange(e.target.value)}
            placeholder="जैसे: MIG वेल्डर, गैस कटर, रिगर, टाइल मिस्त्री"
            className="w-full min-h-[44px] rounded-xl border border-orange-300 bg-orange-50/40 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            required={required}
          />
        </div>
      )}
    </div>
  );
};
