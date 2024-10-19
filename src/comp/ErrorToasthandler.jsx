"use client";

import { useErrorToast } from "../../hooks/useToast";

// import { useErrorToast } from "../hooks/useErrorToast";

export function ErrorToastHandler() {
  useErrorToast();
  return null;
}
