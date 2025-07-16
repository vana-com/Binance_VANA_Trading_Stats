import type { FC } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiquidityData } from "@/types";

interface PriceTableProps {
  data: LiquidityData[];
}

const PriceTable: FC<PriceTableProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Prices</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.symbol}>
                <TableCell className="font-medium">{item.symbol}</TableCell>
                <TableCell className="text-right">
                  {item.price.toLocaleString(undefined, { 
                    minimumFractionDigits: 4, 
                    maximumFractionDigits: 4 
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PriceTable;
