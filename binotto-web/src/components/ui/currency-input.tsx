import * as React from "react";
import { cn } from "@/lib/utils";

// Colunas de valor no backend são decimal(10,2): 10 dígitos ao todo, 2 deles
// depois da vírgula. Em dígitos brutos (sem separador) isso dá no máximo
// 10 caracteres, equivalente a 99.999.999,99.
const MAX_DIGITS = 10;

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number;
  onChange: (value: number) => void;
}

// O símbolo do euro fica fora do texto editável (span decorativo) em vez de
// embutido no value formatado — com o símbolo dentro do value (sufixo, como
// no padrão pt-PT "12,34 €"), o backspace no fim do campo apagava o "€" em
// vez do último dígito, dando a impressão de que não era possível apagar.
function formatAmount(value: number): string {
  return value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, disabled, ...props }, ref) => {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const digits = e.target.value.replace(/\D/g, "").slice(0, MAX_DIGITS);
      const cents = digits ? parseInt(digits, 10) : 0;
      onChange(cents / 100);
    }

    return (
      <div className="relative">
        <span
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground md:text-sm",
            disabled && "opacity-50",
          )}
        >
          €
        </span>
        <input
          type="text"
          inputMode="numeric"
          ref={ref}
          value={formatAmount(value)}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
