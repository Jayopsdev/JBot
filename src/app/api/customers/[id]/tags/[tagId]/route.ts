import { localStorageOnlyResponse } from "@/lib/local-db/disabled-route";

export function GET() {
  return localStorageOnlyResponse();
}

export function POST() {
  return localStorageOnlyResponse();
}

export function PATCH() {
  return localStorageOnlyResponse();
}

export function DELETE() {
  return localStorageOnlyResponse();
}
