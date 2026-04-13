import { getEntries } from "~/lib/entries.server";

export async function loader() {
  try {
    const entries = await getEntries();
    return Response.json(entries);
  } catch (err) {
    console.error("Failed to load entries:", err);

    return Response.json(
      { error: "Failed to load entries" },
      { status: 500 }
    );
  }
}