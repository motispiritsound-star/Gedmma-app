import { getTranslator } from "@/modules/i18n/server";
import { Skeleton } from "@/components/ui/primitives";

export default async function Loading() {
  const { t } = await getTranslator();
  return (
    <div className="q-container py-8">
      <p role="status" className="q-visually-hidden">
        {t("common.loading")}
      </p>
      <Skeleton className="h-9 w-64" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton key={index} className="h-72 w-full" />
        ))}
      </div>
    </div>
  );
}
