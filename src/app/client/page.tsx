import type { Metadata } from "next";
import { ClientPublicPage } from "@/components/ClientPublicPage";

export const metadata: Metadata = {
  title: "Client estimate | Kalkulator Spawalniczy",
  description: "Rough TIG work estimate and welder contacts",
  robots: { index: false, follow: false },
};

export default function ClientPage() {
  return (
    <main className="flex-1">
      <ClientPublicPage />
    </main>
  );
}
