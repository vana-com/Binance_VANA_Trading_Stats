import type { FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { CrossExchangeArbitrage } from "@/types";
import { ArrowDown, ArrowUp } from 'lucide-react';
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
    // Filter for positive net profit before reducing
    const profitableOps = ops.filter(op => op.profit > 0);
    if (profitableOps.length === 0) return null;

    return profitableOps.reduce((best, current) => current.profit > best.profit ? current : best, profitableOps[0]);
}

const OpportunityRow: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
        <span className="font-medium text-sm text-muted-foreground">{title}</span>
        {children}
    </div>
);

const ArbitrageOpportunities: FC<ArbitrageOpportunitiesProps> = ({ opportunities }) => {
    const bestOp = getBestOpportunity(opportunities);

    const renderValue = (value: number) => {
        const isProfitable = value > 0;
        return (
            <div className={`flex items-center font-mono text-sm ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isProfitable ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                {formatPercent(value)}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cross-Exchange Arbitrage Watch</CardTitle>
                <CardDescription>Most profitable opportunity found, net of fees, across all stablecoin pairs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {bestOp ? (
                    <OpportunityRow title="Best Opportunity">
                        <div className="text-right">
                            <p className="font-semibold">{`Buy ${formatSymbol(bestOp.buySymbol)} on ${bestOp.buyOn}`}</p>
                            <p className="font-semibold">{`Sell ${formatSymbol(bestOp.sellSymbol)} on ${bestOp.sellOn}`}</p>
                            {renderValue(bestOp.profit)}
                        </div>
                    </OpportunityRow>
                ) : (
                    <OpportunityRow title="Best Opportunity">
                        <p className="text-sm text-muted-foreground">None found</p>
                    </OpportunityRow>
                )}
            </CardContent>
        </Card>
    );
};

export default ArbitrageOpportunities;
