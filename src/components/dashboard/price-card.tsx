import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSymbol } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface PriceCardProps {
  symbol: string;
  price: number;
  quoteVolume: number;
}

const PriceCard: FC<PriceCardProps> = ({ symbol, price, quoteVolume }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{formatSymbol(symbol)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
            ${price.toLocaleString(undefined, {
                minimumFractionDigits: 4,
                maximumFractionDigits: 4
            })}
        </div>
        <p className="text-xs text-muted-foreground">
          24h Volume: {formatCurrency(quoteVolume)}
        </p>
      </CardContent>
    </Card>
  );
};

export default PriceCard;
