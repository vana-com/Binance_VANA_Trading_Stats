"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DashboardData } from "@/types";
import { refreshData } from "@/app/actions";

import PriceCard from "@/components/dashboard/price-card";
import PriceTable from "@/components/dashboard/price-table";
import LiquidityCard from "@/components/dashboard/liquidity-card";
import ArbitrageOpportunities from "@/components/dashboard/arbitrage-opportunities";
import DepthChart from "@/components/dashboard/depth-chart";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleRefresh = () => {
    startTransition(async () => {
      setError(null);
      const result = await refreshData();
      if (result.error) {
        setError(result.error);
        toast({
          variant: "destructive",
          title: "Error fetching data",
          description: result.error,
        });
      } else if (result.data) {
        setData(result.data);
      }
    });
  };

  useEffect(() => {
    handleRefresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderSkeletons = () => (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
        <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background/80 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary font-headline">OrderFlow Insights</h1>
          <Button onClick={handleRefresh} disabled={isPending} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {isPending && !data ? (
          renderSkeletons()
        ) : error ? (
          <Card className="text-center p-8">
            <p className="text-destructive">{error}</p>
          </Card>
        ) : data ? (
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.liquidityData.map((item) => (
                <PriceCard key={item.symbol} symbol={item.symbol} price={item.price} />
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.liquidityData.map((item) => (
                <LiquidityCard key={item.symbol} data={item} />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Tabs defaultValue={data.liquidityData[0]?.symbol} className="lg:col-span-2">
                <TabsList>
                  {data.liquidityData.map((item) => (
                    <TabsTrigger key={item.symbol} value={item.symbol}>
                      {item.symbol} Depth
                    </TabsTrigger>
                  ))}
                </TabsList>
                {data.liquidityData.map((item) => (
                  <TabsContent key={item.symbol} value={item.symbol}>
                    <DepthChart data={item} />
                  </TabsContent>
                ))}
              </Tabs>

              <div className="space-y-6">
                <ArbitrageOpportunities 
                  pairOps={data.pairArbitrage} 
                  triangularOps={data.triangularArbitrage} 
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
