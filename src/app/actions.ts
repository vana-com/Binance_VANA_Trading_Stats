"use server";

import { getDashboardData } from "@/lib/exchange";
import type { DashboardData } from "@/types";

export async function refreshData(): Promise<{
  data?: DashboardData;
  error?: string;
}> {
  try {
    const data = await getDashboardData();
    return { data };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred." };
  }
}
