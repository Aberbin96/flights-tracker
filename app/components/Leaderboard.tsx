import { supabase } from "@/utils/supabase/client";

async function getLeaderboardData() {
  const { data, error } = await supabase
    .from("airline_delay_rankings")
    .select("*")
    .order("avg_delay_minutes", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
  return data;
}

export async function Leaderboard() {
  const rankings = await getLeaderboardData();

  return (
    <div className="w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Most Delayed Airlines
        </h2>
        <p className="text-sm text-zinc-500">Ranked by average delay minutes</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-3">Airline</th>
              <th className="px-6 py-3 text-right">Total Flights</th>
              <th className="px-6 py-3 text-right">Avg Delay</th>
              <th className="px-6 py-3 text-right">On-Time %</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((airline, index) => (
              <tr
                key={airline.airline}
                className="bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                  {index + 1}. {airline.airline}
                </td>
                <td className="px-6 py-4 text-right text-zinc-600 dark:text-zinc-400">
                  {airline.total_flights}
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`font-bold ${airline.avg_delay_minutes > 15 ? "text-red-500" : "text-yellow-600"}`}
                  >
                    {Math.round(airline.avg_delay_minutes)} min
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      airline.on_time_percentage >= 80
                        ? "bg-green-100 text-green-800"
                        : airline.on_time_percentage >= 60
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {Math.round(airline.on_time_percentage)}%
                  </span>
                </td>
              </tr>
            ))}
            {rankings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                  No data available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
