// Asset management page. FR-AV-01 to FR-AV-05: DRRM Coordinator creates assets and rates vulnerability.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPrismaClient } from "@/lib/db";
import { canManageAssets } from "@/modules/user-roles/permissions";
import { AssetForm } from "./AssetForm";
import { AssetRatingForm } from "./AssetRatingForm";

export default async function AssetsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const db = createPrismaClient(process.env.DATABASE_URL!);
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { roles: { select: { role: true } } },
  });

  if (!user || !canManageAssets(user.roles.map((r) => r.role))) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>Only DRRM Coordinators can manage assets.</p>
      </div>
    );
  }

  // Get all assets with latest ratings
  const assets = await db.asset.findMany({
    include: {
      category: true,
      zone: true,
      ratings: {
        orderBy: { ratedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get zones for form
  const zones = await db.zone.findMany({
    orderBy: { name: "asc" },
  });

  // Get asset categories
  const categories = await db.assetCategory.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Asset Vulnerability Management</h1>

      {/* Asset List */}
      <section className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Assets ({assets.length})</h2>

        {assets.length === 0 ? (
          <p className="text-gray-600 mb-4">No assets recorded yet. Add your first asset below.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-auto mb-4">
            {assets.map((asset) => {
              const latestRating = asset.ratings[0];
              const vi = latestRating?.vulnerabilityIndex;
              return (
                <div key={asset.id} className="p-3 bg-gray-50 rounded border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{asset.name}</p>
                      <p className="text-sm text-gray-600">
                        {asset.zone.building} - {asset.zone.name}
                      </p>
                      <p className="text-xs text-gray-500">{asset.category.name}</p>
                    </div>
                    <div className="text-right">
                      {vi ? (
                        <div>
                          <p className="font-bold">{vi.toFixed(2)}</p>
                          <p className={`text-xs font-medium ${
                            vi >= 3.81 ? "text-red-600" : vi >= 2.21 ? "text-yellow-600" : "text-green-600"
                          }`}>
                            {vi >= 3.81 ? "HIGH" : vi >= 2.21 ? "MEDIUM" : "LOW"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Not rated</p>
                      )}
                    </div>
                  </div>
                  {latestRating && (
                    <p className="text-xs text-gray-500">
                      Last rated: {latestRating.ratedAt.toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Asset Form */}
      <section className="mb-8">
        <AssetForm zones={zones} categories={categories} />
      </section>

      {/* Rating Form */}
      <section className="mb-8">
        <AssetRatingForm assets={assets} userId={user.id} />
      </section>

      {/* Requirements */}
      <section className="p-4 bg-blue-50 border border-blue-200 rounded text-sm">
        <p className="font-medium mb-2">Module 3.2 Asset Vulnerability Requirements:</p>
        <ul className="list-disc ml-5 space-y-1 text-gray-700">
          <li>FR-AV-01: DRRM Coordinator creates and updates assets (FR-UR-02)</li>
          <li>FR-AV-03: Assets are categorized and zoned</li>
          <li>FR-AV-04: Five criterion ratings (1-5): physical condition, exposure, criticality, adaptive capacity, maintenance</li>
          <li>FR-AV-05: Vulnerability Index computed as mean of five ratings</li>
          <li>FR-AV-06: Upcoming inspection and service alerts (14-day window)</li>
        </ul>
      </section>
    </div>
  );
}
