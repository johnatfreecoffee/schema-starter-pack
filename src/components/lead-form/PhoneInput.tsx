import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const formatPhone = (input: string) => {
      const numbers = input.replace(/\D/g, '');
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numbers = e.target.value.replace(/\D/g, '');
      onChange(numbers);
    };

    return (
      <Input
        ref={ref}
        type="tel"
        value={formatPhone(value)}
        onChange={handleChange}
        className={cn("placeholder:italic placeholder:font-light", className)}
        maxLength={14}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
