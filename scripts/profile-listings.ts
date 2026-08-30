import { profileMissingListings } from "../lib/listing-profile";

async function main() {
  const limit = Number(process.argv[2] ?? 8);
  if (!Number.isFinite(limit) || limit < 1) {
    throw new Error("Pass a positive limit.");
  }
  await profileMissingListings(limit);
  console.log(`Tried to profile up to ${limit} listings.`);
}

void main();
