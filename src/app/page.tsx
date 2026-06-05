import { SiteHeader } from "@/components/layout/SiteHeader";
import { AppShell } from "@/components/layout/AppShell";
import { StatePlaceholder } from "@/components/ui/StatePlaceholder";
import { loadCitiesDataset } from "@/lib/cities";

export default function HomePage() {
  const result = loadCitiesDataset();

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        {result.ok ? (
          <AppShell data={result.data} />
        ) : (
          <div className="mx-auto max-w-lg px-4 py-16">
            <StatePlaceholder
              variant="error"
              title="City data failed validation"
              message={`${result.error} Regenerate the dataset with npm run data:fetch, then reload this page.`}
            />
          </div>
        )}
      </main>
    </>
  );
}
