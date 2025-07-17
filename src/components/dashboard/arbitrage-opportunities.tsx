import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { CrossExchangeArbitrage } from "@/types";
import { ArrowDown, ArrowUp, ArrowRight } from 'lucide-react';
import { formatSymbol } from '@/lib/utils';

interface ArbitrageOpportunitiesProps {
  opportunities: CrossExchangeArbitrage[];
}

const formatPercent = (value: number) => {
    const isNegative = value < 0;
    const sign = isNegative ? "" : "+";
    return `${sign}${(value * 100).toFixed(4)}%`;
}

const getBestOpportunity = (ops: CrossExchangeArbitrage[]): CrossExchangeArbitrage | null => {
    if (!ops || ops.length === 0) return null;
    return ops.reduce((best, current) => current.profit > best.profit ? current : best, ops[0]);
}


const ArbitrageOpportunities: FC<ArbitrageOpportunitiesProps> = ({ opportunities }) => {
    const bestOp = getBestOpportunity(opportunities);

    const renderProfit = (value: number) => {
        const isProfitable = value > 0;
        return (
            <div className={`flex items-center text-lg font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isProfitable ? <ArrowUp className="h-5 w-5 mr-1" /> : <ArrowDown className="h-5 w-5 mr-1" />}
                {formatPercent(value)}
            </div>
        );
    };

    const InfoColumn: FC<{ title: string; symbol: string; exchange: string; price: number; className?: string }> = ({ title, symbol, exchange, price, className }) => (
        <div className={className}>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="font-bold text-lg">{formatSymbol(symbol)}</p>
            <p className="text-sm">on {exchange}</p>
            <p className="text-xs font-mono mt-1">Price: ${price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</p>
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Arbitrage Watch</CardTitle>
                <CardDescription>Most promising arbitrage opportunity based on pure price difference.</CardDescription>
            </CardHeader>
            <CardContent>
                {bestOp ? (
                     <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                        <InfoColumn title="Buy" symbol={bestOp.buySymbol} exchange={bestOp.buyOn} price={bestOp.buyPrice} />
                        <ArrowRight className="h-6 w-6 text-muted-foreground mx-4 shrink-0" />
                        <InfoColumn title="Sell" symbol={bestOp.sellSymbol} exchange={bestOp.sellOn} price={bestOp.sellPrice} className="text-right" />
                        <div className="w-px bg-border h-16 mx-6"></div>
                        <div className="flex flex-col items-center">
                            <p className="text-sm text-muted-foreground">Profit</p>
                            {renderProfit(bestOp.profit)}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center p-3 rounded-lg bg-card border h-24">
                        <p className="text-sm text-muted-foreground">No arbitrage opportunities found.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ArbitrageOpportunities;
