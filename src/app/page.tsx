import { SiteHeader } from "@/components/layout/SiteHeader";
import { AppShell } from "@/components/layout/AppShell";
import { StatePlaceholder } from "@/components/ui/StatePlaceholder";
import { loadCitiesDataset } from "@/lib/cities";

export default function HomePage() {
  const result = loadCitiesDataset();

  return (
    <>
      <SiteHeader />
      <main>
        {result.ok ? (
          <AppShell data={result.data} />
        ) : (
          <div className="mx-auto max-w-lg px-4 py-16">
            <StatePlaceholder variant="error" title="Failed to load city data" message={result.error} />
          </div>
        )}
      </main>
    </>
  );
}
