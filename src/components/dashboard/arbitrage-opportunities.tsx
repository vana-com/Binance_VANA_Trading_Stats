import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { PairArbitrage, TriangularArbitrage } from "@/types";
import { formatSymbol } from '@/lib/utils';

interface ArbitrageOpportunitiesProps {
  pairOps: PairArbitrage[];
  triangularOps: TriangularArbitrage[];
}

const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(4)}%`;
}

const THRESHOLDS = {
    'low': 0.001,  // 0.1%
    'med': 0.0025, // 0.25%
    'high': 0.005  // 0.5%
};

const ArbitrageOpportunities: FC<ArbitrageOpportunitiesProps> = ({ pairOps, triangularOps }) => {
  const [thresholdKey, setThresholdKey] = useState<keyof typeof THRESHOLDS>('med');

  const filteredPairOps = useMemo(() => 
    pairOps.filter(op => op.spread > THRESHOLDS[thresholdKey]),
    [pairOps, thresholdKey]
  );

  const filteredTriangularOps = useMemo(() =>
    triangularOps.filter(op => op.profit > THRESHOLDS[thresholdKey]),
    [triangularOps, thresholdKey]
  );
  
  const hasPairOps = filteredPairOps.length > 0;
  const hasTriangularOps = filteredTriangularOps.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arbitrage Watch</CardTitle>
        <CardDescription>Calculated opportunities exceeding selected threshold.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
            <Label className="text-sm font-medium">Profit Threshold</Label>
            <RadioGroup
                defaultValue="med"
                onValueChange={(value) => setThresholdKey(value as keyof typeof THRESHOLDS)}
                className="flex items-center space-x-4"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low">0.1%</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="med" id="med" />
                    <Label htmlFor="med">0.25%</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high">0.5%</Label>
                </div>
            </RadioGroup>
        </div>

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
                        {filteredPairOps.map((op, index) => (
                            <TableRow key={index}>
                                <TableCell>{op.pair.map(formatSymbol).join(' / ')}</TableCell>
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
                        {filteredTriangularOps.map((op, index) => (
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
          <p className="text-sm text-muted-foreground text-center py-4">No significant arbitrage opportunities detected for this threshold.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ArbitrageOpportunities;
