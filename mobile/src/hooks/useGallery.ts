import { useQuery } from "@tanstack/react-query";
import { galleryApi } from "~/api/community";

/**
 * Gallery events from the Google Sheet (/api/sheet), oldest first as the API
 * returns them. Shared by the Gallery screen and the Home carousel, so both
 * use one cached request. The API itself is regenerated at most every 10 min.
 */
export function useGallery() {
  return useQuery({ queryKey: ["sheet-data"], queryFn: galleryApi.dates, staleTime: 10 * 60 * 1000 });
}
