export async function GET() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "SQUARE_ACCESS_TOKEN is not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch("https://connect.squareupsandbox.com/v2/locations", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": process.env.SQUARE_API_VERSION || "2024-11-20",
      "Content-Type": "application/json",
    },
  });

  const body = await res.text();
  const status = res.ok ? 200 : res.status;

  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

