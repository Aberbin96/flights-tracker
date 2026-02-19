# Data Structure Recommendations

For a flight tracker and transparency application, a structured data model is crucial. Since we are using TypeScript, defining interfaces early is recommended.

## Recommended Interfaces

### Flight

```typescript
interface Flight {
  id: string;
  flightNumber: string;
  departingAirport: string; // IATA code
  arrivingAirport: string; // IATA code
  departureTime: Date;
  arrivalTime: Date;
  distanceKm: number;
  aircraftType?: string;
  co2EmissionsKg: number;
}
```

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  trackedFlights: Flight[];
  totalEmissions: number;
}
```

## Database Schema (Conceptual)

If using a relational database (like PostgreSQL with Prisma), the schema would likely mirror these interfaces:

- **User**: `id`, `email`, `name`, `created_at`
- **Flight**: `id`, `flight_number`, `origin`, `destination`, `departure_time`, `arrival_time`, `emissions`
- **UserFlight**: Join table linking Users and Flights (many-to-many relationship)

## State Management

- Use React Context or Zustand for global state if needed (e.g., user session, current tracking list).
- Use Server Components for fetching data directly from the DB/API where possible to reduce client-side state complexity.
