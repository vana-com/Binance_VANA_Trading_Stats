import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import type { LiquidityData } from "@/types";
import { formatSymbol, formatCurrency } from '@/lib/utils';

interface LiquidityCardProps {
  data: LiquidityData;
}

const LiquidityCard: FC<LiquidityCardProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatSymbol(data.symbol)}</CardTitle>
        <CardDescription>Liquidity within ±2% of mid-price</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-300">Bids</span>
            </div>
            <div className="text-right">
                <p className="font-semibold text-lg text-green-800 dark:text-green-300">{formatCurrency(data.depthUSD.bids)}</p>
                {data.lowLiquidity.bids && (
                    <Badge variant="destructive" className="mt-1">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        LOW
                    </Badge>
                )}
            </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-800 dark:text-red-300">Asks</span>
            </div>
            <div className="text-right">
                <p className="font-semibold text-lg text-red-800 dark:text-red-300">{formatCurrency(data.depthUSD.asks)}</p>
                {data.lowLiquidity.asks && (
                    <Badge variant="destructive" className="mt-1">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        LOW
                    </Badge>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiquidityCard;
