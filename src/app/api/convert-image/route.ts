export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("imageUrl");

    if (!imageUrl) {
      return new Response("Missing imageUrl", { status: 400 });
    }

    // Fetch image from remote URL
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return new Response("Image fetch failed", { status: 404 });
    }

    const mimeType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();

    // Convert binary → Base64
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const base64DataUrl = `data:${mimeType};base64,${base64}`;

    return new Response(base64DataUrl, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Server Error", { status: 500 });
  }
}
