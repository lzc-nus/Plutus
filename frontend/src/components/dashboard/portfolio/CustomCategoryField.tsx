"use client";

interface CustomCategoryFieldProps {
  id: string;
  value: string;
  suggestions?: string[];
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
}

const INPUT_CLS =
  "w-full rounded-lg border border-[#d9d0c1] bg-white px-3.5 py-2.5 text-sm text-[#1d211c] placeholder-[#b0a898] outline-none transition-colors focus:border-[#7a6332] focus:ring-2 focus:ring-[#7a6332]/20";

export function CustomCategoryField({
  id,
  value,
  suggestions = [],
  placeholder,
  error,
  onChange,
}: CustomCategoryFieldProps) {
  const uniqueSuggestions = Array.from(
    new Set(
      suggestions
        .map(item => item.trim())
        .filter(Boolean)
    )
  );

  const listId = 
    uniqueSuggestions.length > 0 
      ? `${id}-suggestions` 
      : undefined;

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#4a4238]" htmlFor={id}>
        Custom category <span className="ml-1.5 font-normal text-[#9a8f7a]">(optional)</span>
      </label>

      <input
        id={id}
        type="text"
        list={listId}
        placeholder={placeholder}
        value={value}
        onChange={event => onChange(event.target.value)}
        className={INPUT_CLS}
      />

      {listId ? (
        <datalist id={listId}>
          {uniqueSuggestions.map(suggestion => (
            <option 
              key={suggestion} 
              value={suggestion} 
            />
          ))}
        </datalist>
      ) : null}

      {error 
        ? <p className="mt-1 text-xs text-[#993c1d]">
            {error}
          </p> 
        : null}
    </div>
  );
}
