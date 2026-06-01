import { SquareClient, SquareEnvironment } from "square";

function buildSquareClient(): SquareClient {
  const token = process.env.SQUARE_ACCESS_TOKEN;

  if (!token) {
    // Fail loudly at startup rather than sending unauthenticated
    // requests that return cryptic 401s later.
    throw new Error(
      "SQUARE_ACCESS_TOKEN is not set. Copy .env.example to .env.local and fill in your sandbox credentials."
    );
  }

  const rawEnv = process.env.SQUARE_ENVIRONMENT ?? "sandbox";

  
  let environment: any;
  try {
    if (typeof SquareEnvironment === "object" && SquareEnvironment?.Sandbox) {
      environment =
        rawEnv === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox;
    } else {
      environment = rawEnv === "production" ? "production" : "sandbox";
    }
  } catch {
    environment = rawEnv === "production" ? "production" : "sandbox";
  }

  return new SquareClient({
    token: token,
    environment,
  });
}

// Module-level singleton — constructed once per worker lifetime
let _client: SquareClient | null = null;

export function getSquareClient(): SquareClient {
  if (!_client) {
    _client = buildSquareClient();
  }
  return _client;
}
