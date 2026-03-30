import { useQuery } from "@tanstack/react-query";
import { ChurchEvent } from "@/data/events";

export function useEvents() {
  return useQuery<ChurchEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
  });
}
