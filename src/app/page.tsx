"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DashboardData, ExchangeData } from "@/types";
import { refreshData } from "@/app/actions";
import { formatSymbol } from "@/lib/utils";

import PriceCard from "@/components/dashboard/price-card";
import LiquidityCard from "@/components/dashboard/liquidity-card";
import ArbitrageOpportunities from "@/components/dashboard/arbitrage-opportunities";
import DepthChart from "@/components/dashboard/depth-chart";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
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
        setLastUpdated(new Date());
      }
    });
  };

  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderSkeletons = () => (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 w-full" />
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

  const renderExchangeTab = (exchangeData: ExchangeData) => (
    <div className="space-y-8 mt-4">
      <div className="grid gap-6 md:grid-cols-1">
        <PriceCard
          symbol={exchangeData.symbol}
          price={exchangeData.price}
          quoteVolume={exchangeData.quoteVolume}
          exchange={exchangeData.exchange}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
         <LiquidityCard data={exchangeData} />
         <DepthChart data={exchangeData} />
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background/80 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary font-headline">VANA Trading Insights</h1>
          <div className="flex items-center space-x-4">
            {lastUpdated && !isPending && (
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <Button onClick={handleRefresh} disabled={isPending} variant="outline">
              <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
              {isPending ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {isPending && !data ? (
          renderSkeletons()
        ) : error ? (
          <Card className="text-center p-8">
            <p className="text-destructive">{error}</p>
          </Card>
        ) : data ? (
          <div className="space-y-8">
            <ArbitrageOpportunities opportunities={data.arbitrage} />

            <Tabs defaultValue={data.exchangeData[0]?.exchange} className="w-full">
              <TabsList>
                {data.exchangeData.map((item) => (
                  <TabsTrigger key={item.exchange} value={item.exchange}>
                    {item.exchange}
                  </TabsTrigger>
                ))}
              </TabsList>
              {data.exchangeData.map((item) => (
                <TabsContent key={item.exchange} value={item.exchange}>
                  {renderExchangeTab(item)}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        ) : null}
      </div>
    </main>
  );
}
