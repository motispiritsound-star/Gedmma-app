import { config } from "dotenv";

// Loaded before any module reads process.env, so `@/lib/env` sees the test
// configuration rather than the developer's .env.
config({ path: ".env.test", override: true });
