import { useQuery } from "@tanstack/react-query";
import { Sermon } from "@/data/sermons";

export function useSermons() {
  return useQuery<Sermon[]>({
    queryKey: ["sermons"],
    queryFn: async () => {
      const response = await fetch("/api/sermons");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
  });
}
