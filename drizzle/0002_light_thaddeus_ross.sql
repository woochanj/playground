ALTER TABLE "sheets" ALTER COLUMN "rows" SET DEFAULT 100;--> statement-breakpoint
ALTER TABLE "sheets" ALTER COLUMN "cols" SET DEFAULT 26;--> statement-breakpoint
ALTER TABLE "sheets" ADD COLUMN "col_widths" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "sheets" ADD COLUMN "row_heights" jsonb DEFAULT '{}'::jsonb NOT NULL;