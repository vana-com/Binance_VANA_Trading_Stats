import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PairArbitrage, TriangularArbitrage } from "@/types";

interface ArbitrageOpportunitiesProps {
  pairOps: PairArbitrage[];
  triangularOps: TriangularArbitrage[];
}

const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(4)}%`;
}

const ArbitrageOpportunities: FC<ArbitrageOpportunitiesProps> = ({ pairOps, triangularOps }) => {
  const hasPairOps = pairOps.length > 0;
  const hasTriangularOps = triangularOps.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arbitrage Watch</CardTitle>
        <CardDescription>Calculated opportunities exceeding threshold.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPairOps && (
            <div>
                <h4 className="font-semibold mb-2">Pair Arbitrage</h4>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pair</TableHead>
                            <TableHead className="text-right">Spread</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pairOps.map((op, index) => (
                            <TableRow key={index}>
                                <TableCell>{op.pair.join(' / ')}</TableCell>
                                <TableCell className="text-right font-mono text-accent">{formatPercent(op.spread)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}

        {hasTriangularOps && (
            <div>
                <h4 className="font-semibold mb-2">Triangular Arbitrage</h4>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Path</TableHead>
                            <TableHead className="text-right">Profit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {triangularOps.map((op, index) => (
                            <TableRow key={index}>
                                <TableCell>{op.path.join(' → ')}</TableCell>
                                <TableCell className="text-right font-mono text-accent">{formatPercent(op.profit)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}
        
        {!hasPairOps && !hasTriangularOps && (
          <p className="text-sm text-muted-foreground text-center py-4">No significant arbitrage opportunities detected.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ArbitrageOpportunities;
