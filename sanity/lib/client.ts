import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2023-08-01",
  token: process.env.NEXT_PUBLIC_SANITY_TOKEN, // Añade esta línea
  useCdn: false, // Importante para datos en tiempo real,
  stega: {
    studioUrl:
      process.env.NODE_ENV === "production"
        ? `https://${process.env.VERCEL_URL}/studio`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/studio`,
  },
});