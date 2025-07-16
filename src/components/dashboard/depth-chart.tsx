"use client"

import type { FC } from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceArea, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { LiquidityData } from '@/types';

interface DepthChartProps {
  data: LiquidityData;
}

const DepthChart: FC<DepthChartProps> = ({ data }) => {
    const { orderBook, midPrice } = data;

    const chartData = [
        ...orderBook.bids.map(item => ({ price: item.price, bids: item.size })).reverse(),
        ...orderBook.asks.map(item => ({ price: item.price, asks: item.size })),
    ];

    const lowerBound = midPrice * 0.98;
    const upperBound = midPrice * 1.02;

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-background/80 backdrop-blur-sm p-2 border rounded-md shadow-lg">
            <p className="label font-bold">{`Price: ${label.toLocaleString(undefined, {minimumFractionDigits: 4})}`}</p>
            {payload.map((pld: any) => (
                 <p key={pld.dataKey} style={{ color: pld.color }}>
                    {`${pld.dataKey.charAt(0).toUpperCase() + pld.dataKey.slice(1)} Volume: ${pld.value.toLocaleString()}`}
                </p>
            ))}
          </div>
        );
      }
      return null;
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Book Depth</CardTitle>
        <CardDescription>
            Visual representation of bids and asks. The shaded area indicates the ±2% range from the mid-price used for liquidity calculations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{
                top: 5, right: 30, left: 20, bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="price" 
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => value.toFixed(4)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
               />
              <YAxis
                tickFormatter={(value) => value.toLocaleString()}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceArea x1={lowerBound} x2={upperBound} strokeOpacity={0.3} fill="hsl(var(--accent))" fillOpacity={0.1} />
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
