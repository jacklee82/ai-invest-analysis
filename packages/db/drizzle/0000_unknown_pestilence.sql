CREATE TABLE "project" (
	"project_id" varchar(255) PRIMARY KEY NOT NULL,
	"project_name" varchar(255) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"contract_start_date" varchar(10) NOT NULL,
	"base_contract_months" integer NOT NULL,
	"extended_months" integer DEFAULT 0 NOT NULL,
	"initial_investment" integer NOT NULL,
	"additional_investment" integer DEFAULT 0 NOT NULL,
	"total_recouped" integer DEFAULT 0 NOT NULL,
	"md_purchase_cost" integer,
	"ost_investment" integer,
	"business_type" varchar(50) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_project_name_unique" UNIQUE("project_name")
);
--> statement-breakpoint
CREATE TABLE "cashflow_monthly" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"project_id" varchar(255) NOT NULL,
	"yyyymm" varchar(7) NOT NULL,
	"revenue_amount" integer DEFAULT 0 NOT NULL,
	"cost_amount" integer DEFAULT 0 NOT NULL,
	"recoup_amount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_flag" (
	"evaluated_id" varchar(255) PRIMARY KEY NOT NULL,
	"project_id" varchar(255) NOT NULL,
	"evaluated_at" timestamp DEFAULT now() NOT NULL,
	"is_warning" boolean DEFAULT false NOT NULL,
	"reason" varchar(500),
	"recoup_ratio" double precision DEFAULT 0 NOT NULL,
	"elapsed_ratio" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upload_job" (
	"job_id" varchar(255) PRIMARY KEY NOT NULL,
	"source" varchar(1) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"rows_parsed" integer DEFAULT 0 NOT NULL,
	"rows_loaded" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"error_message" varchar(1000)
);
--> statement-breakpoint
ALTER TABLE "cashflow_monthly" ADD CONSTRAINT "cashflow_monthly_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_flag" ADD CONSTRAINT "risk_flag_project_id_project_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("project_id") ON DELETE cascade ON UPDATE no action;