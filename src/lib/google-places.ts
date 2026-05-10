export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url: string;
}

export interface PlaceInfo {
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
}

export async function fetchGoogleReviews(): Promise<PlaceInfo | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;
  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", "rating,user_ratings_total,reviews");
    url.searchParams.set("language", "es");
    url.searchParams.set("reviews_sort", "most_relevant");
    url.searchParams.set("key", apiKey);
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK" || !data.result) return null;
    const result = data.result as PlaceInfo;
    result.reviews = (result.reviews ?? []).filter((r) => r.text?.trim());
    return result;
  } catch {
    return null;
  }
}
