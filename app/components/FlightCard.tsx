import { FlightRecord, FlightStatus } from "../types/flight";
import {
  Plane,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface FlightCardProps {
  flight: FlightRecord;
}

export function FlightCard({ flight }: FlightCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "landed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "incident":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "diverted":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "scheduled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusColor = getStatusColor(flight.status);

  return (
    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Plane className="w-4 h-4" />
            {flight.airline}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
            {flight.flight_num}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${statusColor}`}
        >
          {flight.status}
        </span>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="text-left">
          <p className="text-xs text-zinc-500 uppercase">Origin</p>
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">
            {flight.origin}
          </p>
        </div>

        {flight.delay_minutes > 0 && (
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
            <Clock className="w-3 h-3" />
            <span className="text-xs font-bold">
              +{flight.delay_minutes} min
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
