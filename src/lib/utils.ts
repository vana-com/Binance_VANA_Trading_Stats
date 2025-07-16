import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSymbol(symbol: string): string {
  if (symbol.startsWith('VANA')) {
    const quote = symbol.substring(4);
    return `VANA / ${quote}`;
  }
  return symbol;
}
