"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";

export function CancellationChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: cancellations, error } = await supabase
        .from("daily_cancellations")
        .select("*");

      if (error) {
        console.error("Error fetching trend:", error);
      } else {
        // Format date for display (e.g., "Feb 18")
        const formattedData = (cancellations || []).map((item: any) => {
          const date = new Date(item.day);
          return {
            name: date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            cancellations: item.cancellations,
          };
        });
        setData(formattedData);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[300px] bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Cancellations (Last 30 Days)
      </h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#374151"
              opacity={0.2}
            />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                borderRadius: "8px",
                color: "#fff",
              }}
              itemStyle={{ color: "#fff" }}
              cursor={{ fill: "transparent" }}
            />
            <Bar dataKey="cancellations" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-zinc-500">
          No cancellations recorded yet
        </div>
      )}
    </div>
  );
}
