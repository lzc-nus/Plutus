type PasswordValidatorProps = {
  value: string;
};

const checks = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "One number",
    test: (value: string) => /[0-9]/.test(value),
  },
  {
    id: "symbol",
    label: "One special symbol",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
];

export default function PasswordValidator({ value }: PasswordValidatorProps) {
  const passedCount = checks
    .reduce(
      (count, check) => count + (check.test(value) ? 1 : 0), 
      0 
    );

  let strengthLabel = "Empty"; 
  let strengthColor = "bg-[#3a3d37]"; 
  
  if (value.length > 0) { 
    if (passedCount <= 2) { 
      strengthLabel = "Weak"; 
      strengthColor = "bg-[#b85b50]"; 
    } else if (passedCount === 3) { 
      strengthLabel = "Fair"; 
      strengthColor = "bg-[#d8bd75]"; 
    } else if (passedCount === 4) { 
      strengthLabel = "Good"; 
      strengthColor = "bg-[#8ea56f]"; 
    } else { 
      strengthLabel = "Strong"; 
      strengthColor = "bg-[#4f9d69]"; 
    } 
  }

  const strengthPercent = 
    value.length === 0 
      ? 0 
      : (passedCount / checks.length) * 100;

  return (
    <div className="mt-3 rounded-md border border-[#d8bd75]/15 bg-[#151811]/45 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#bdb4a4]">
          Password strength
        </p>

        <p className="text-xs font-bold text-[#d8bd75]">
          {strengthLabel}
        </p>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#2a2e27]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
          style={{ width: `${strengthPercent}%` }}
        />
      </div>

      <ul className="mt-4 grid gap-2 text-sm">
        {checks.map(check => {
          const passed = check.test(value);

          return (
            <li
              key={check.id}
              className={`flex items-center gap-2 ${
                passed ? "text-[#9fcd9a]" : "text-[#8a8173]"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${
                  passed ? "bg-[#9fcd9a]" : "bg-[#5b554d]"
                }`}
              />
              {check.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
