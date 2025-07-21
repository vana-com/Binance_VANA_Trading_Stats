"use client"

import type { FC } from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceArea, CartesianGrid, Label } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { VanaPairData } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DepthChartProps {
  data: VanaPairData;
}

const DepthChart: FC<DepthChartProps> = ({ data }) => {
    const { orderBook, midPrice } = data;

    // The shaded reference area remains at ±2%
    const refAreaLowerBound = midPrice * 0.98;
    const refAreaUpperBound = midPrice * 1.02;

    // The visible chart range is now ±5%
    const chartLowerBound = midPrice * 0.95;
    const chartUpperBound = midPrice * 1.05;

    const fullChartData = [
        ...orderBook.bids.map(item => ({ price: item.price, bids: item.size })).reverse(),
        ...orderBook.asks.map(item => ({ price: item.price, asks: item.size })),
    ];
    
    const chartData = fullChartData.filter(item => item.price >= chartLowerBound && item.price <= chartUpperBound);


    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const price = label;
        return (
          <div className="bg-background/80 backdrop-blur-sm p-2 border rounded-md shadow-lg text-sm">
            <p className="label font-bold mb-2">{`Price: $${price.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})}`}</p>
            {payload.map((pld: any) => {
                const volumeVana = pld.value;
                const volumeUsd = price * volumeVana;
                return (
                    <div key={pld.dataKey} className="mb-1">
                        <p style={{ color: pld.color }}>
                            {`${pld.dataKey.charAt(0).toUpperCase() + pld.dataKey.slice(1)} Volume (VANA): ${volumeVana.toLocaleString()}`}
                        </p>
                        <p className="text-muted-foreground text-xs pl-2">
                           {`≈ ${formatCurrency(volumeUsd)}`}
                        </p>
                    </div>
                )
            })}
          </div>
        );
      }
      return null;
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Book Depth (±5% View)</CardTitle>
        <CardDescription>
            Visual representation of bids and asks volume (in VANA). The shaded area indicates the ±2% range from the mid-price.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{
                top: 5, right: 30, left: 30, bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="price" 
                type="number"
                domain={[chartLowerBound, chartUpperBound]}
                tickFormatter={(value) => value.toFixed(4)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
               />
              <YAxis
                tickFormatter={(value) => value.toLocaleString()}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                >
                 <Label value="Volume (VANA)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }} />
                </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceArea x1={refAreaLowerBound} x2={refAreaUpperBound} strokeOpacity={0.3} fill="hsl(var(--accent))" fillOpacity={0.1} />
              <Bar dataKey="bids" fill="#16a34a" barSize={30} />
              <Bar dataKey="asks" fill="#dc2626" barSize={30} />
            </BarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepthChart;
