-- CreateTable
CREATE TABLE "DocumentStatusAudit" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "old_status" TEXT,
    "new_status" TEXT NOT NULL,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentStatusAudit_pkey" PRIMARY KEY ("id")
);

-- Trigger function: record an audit row whenever "Document"."status" actually
-- changes. NEW."id" is an integer (Document.id is Int), and "status" is the
-- DocumentStatus enum, so it is cast to text before insertion.
CREATE OR REPLACE FUNCTION log_document_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" IS DISTINCT FROM OLD."status" THEN
    INSERT INTO "DocumentStatusAudit" ("document_id", "old_status", "new_status")
    VALUES (NEW."id", OLD."status"::text, NEW."status"::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: fire the function after every row update on "Document".
CREATE TRIGGER trg_document_status_change
AFTER UPDATE ON "Document"
FOR EACH ROW
EXECUTE FUNCTION log_document_status_change();
