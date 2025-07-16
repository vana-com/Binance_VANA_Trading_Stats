import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PriceCardProps {
  symbol: string;
  price: number;
}

const PriceCard: FC<PriceCardProps> = ({ symbol, price }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{symbol}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
            {price.toLocaleString(undefined, {
                minimumFractionDigits: 4,
                maximumFractionDigits: 4
            })}
        </div>
        <p className="text-xs text-muted-foreground">
          Current trading price
        </p>
      </CardContent>
    </Card>
  );
};

export default PriceCard;
