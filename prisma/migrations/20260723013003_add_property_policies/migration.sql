-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pricePerNight" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "bookingUrl" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "checkInTime" TEXT NOT NULL DEFAULT 'From 14:00',
    "checkOutTime" TEXT NOT NULL DEFAULT 'Until 11:00',
    "cancellationPolicy" TEXT NOT NULL DEFAULT 'Free cancellation up to 48 hours before check-in. Cancellations made less than 48 hours before check-in, or no-shows, are subject to a charge equal to the first night''s stay. Please contact us directly if you need to change your dates.',
    "houseRules" TEXT NOT NULL DEFAULT 'No smoking inside the property. No parties or events. Pets are not allowed unless agreed in advance. Quiet hours are from 22:00 to 08:00. A valid ID is required at check-in.',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Property" ("address", "bookingUrl", "city", "createdAt", "currency", "description", "id", "name", "pricePerNight", "published", "shortDescription", "slug", "updatedAt") SELECT "address", "bookingUrl", "city", "createdAt", "currency", "description", "id", "name", "pricePerNight", "published", "shortDescription", "slug", "updatedAt" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
