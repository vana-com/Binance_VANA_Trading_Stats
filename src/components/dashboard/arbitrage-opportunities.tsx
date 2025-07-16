import type { FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PairArbitrage, TriangularArbitrage } from "@/types";
import { formatSymbol } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface ArbitrageOpportunitiesProps {
  pairOps: PairArbitrage[];
  triangularOps: TriangularArbitrage[];
}

const formatPercent = (value: number) => {
    const isNegative = value < 0;
    const sign = isNegative ? "" : "+";
    return `${sign}${(value * 100).toFixed(4)}%`;
}

const getBestOpportunity = <T extends { spread: number } | { profit: number }>(ops: T[]): T | null => {
    if (!ops || ops.length === 0) return null;
    return ops.reduce((best, current) => {
        const bestValue = 'spread' in best ? best.spread : best.profit;
        const currentValue = 'spread' in current ? current.spread : current.profit;
        return currentValue > bestValue ? current : best;
    }, ops[0]);
}

const OpportunityRow: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
        <span className="font-medium text-sm text-muted-foreground">{title}</span>
        {children}
    </div>
);

const ArbitrageOpportunities: FC<ArbitrageOpportunitiesProps> = ({ pairOps, triangularOps }) => {
    const bestPairOp = getBestOpportunity(pairOps);
    const bestTriangularOp = getBestOpportunity(triangularOps);

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
                <CardTitle>Arbitrage Watch</CardTitle>
                <CardDescription>Most profitable opportunities found, net of fees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {bestPairOp ? (
                    <OpportunityRow title="Best Pair">
                        <div className="text-right">
                            <p className="font-semibold">{bestPairOp.pair.map(formatSymbol).join(' / ')}</p>
                            {renderValue(bestPairOp.spread)}
                        </div>
                    </OpportunityRow>
                ) : (
                    <OpportunityRow title="Best Pair">
                        <p className="text-sm text-muted-foreground">None found</p>
                    </OpportunityRow>
                )}

                {bestTriangularOp ? (
                     <OpportunityRow title="Best Triangular">
                        <div className="text-right">
                            <p className="font-semibold">{bestTriangularOp.path.join(' → ')}</p>
                            {renderValue(bestTriangularOp.profit)}
                        </div>
                    </OpportunityRow>
                ) : (
                    <OpportunityRow title="Best Triangular">
                        <p className="text-sm text-muted-foreground">None found</p>
                    </OpportunityRow>
                )}
            </CardContent>
        </Card>
    );
};

export default ArbitrageOpportunities;
