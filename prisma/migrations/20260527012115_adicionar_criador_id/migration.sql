-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_entregas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "criador_id" INTEGER,
    CONSTRAINT "entregas_criador_id_fkey" FOREIGN KEY ("criador_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_entregas" ("created_at", "descricao", "destino", "id", "origem", "status", "updated_at") SELECT "created_at", "descricao", "destino", "id", "origem", "status", "updated_at" FROM "entregas";
DROP TABLE "entregas";
ALTER TABLE "new_entregas" RENAME TO "entregas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
