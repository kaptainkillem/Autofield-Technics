| table_name    | column_name              | data_type                | is_nullable | column_default               |
| ------------- | ------------------------ | ------------------------ | ----------- | ---------------------------- |
| blocked_slots | id                       | uuid                     | NO          | uuid_generate_v4()           |
| blocked_slots | mechanic_id              | uuid                     | YES         | null                         |
| blocked_slots | start_datetime           | timestamp with time zone | NO          | null                         |
| blocked_slots | end_datetime             | timestamp with time zone | NO          | null                         |
| blocked_slots | reason                   | text                     | YES         | null                         |
| blocked_slots | created_at               | timestamp with time zone | YES         | now()                        |
| blocked_slots | updated_at               | timestamp with time zone | YES         | now()                        |
| categories    | id                       | uuid                     | NO          | gen_random_uuid()            |
| categories    | name                     | character varying        | NO          | null                         |
| categories    | slug                     | character varying        | NO          | null                         |
| categories    | icon_name                | character varying        | NO          | 'Wrench'::character varying  |
| categories    | display_order            | integer                  | YES         | 0                            |
| categories    | created_at               | timestamp with time zone | YES         | now()                        |
| profiles      | id                       | uuid                     | NO          | null                         |
| profiles      | full_name                | text                     | YES         | null                         |
| profiles      | phone                    | text                     | YES         | null                         |
| profiles      | role                     | text                     | NO          | 'client'::text               |
| profiles      | onboarding_completed     | boolean                  | NO          | false                        |
| profiles      | created_at               | timestamp with time zone | YES         | now()                        |
| profiles      | updated_at               | timestamp with time zone | YES         | now()                        |
| profiles      | company_name             | text                     | YES         | null                         |
| profiles      | logo_url                 | text                     | YES         | null                         |
| profiles      | address                  | text                     | YES         | null                         |
| profiles      | whatsapp_number          | text                     | YES         | null                         |
| profiles      | vat_number               | text                     | YES         | null                         |
| profiles      | registration_number      | text                     | YES         | null                         |
| profiles      | bank_name                | text                     | YES         | null                         |
| profiles      | account_holder           | text                     | YES         | null                         |
| profiles      | account_number           | text                     | YES         | null                         |
| profiles      | branch_code              | text                     | YES         | null                         |
| profiles      | hourly_rate              | numeric                  | YES         | null                         |
| profiles      | callout_fee              | numeric                  | YES         | null                         |
| profiles      | diagnostic_fee           | numeric                  | YES         | null                         |
| profiles      | terms_conditions         | text                     | YES         | null                         |
| profiles      | default_deposit_percent  | numeric                  | YES         | null                         |
| profiles      | alternate_phone          | text                     | YES         | null                         |
| profiles      | physical_address         | text                     | YES         | null                         |
| profiles      | prefers_whatsapp         | boolean                  | YES         | true                         |
| profiles      | service_reminders_opt_in | boolean                  | YES         | true                         |
| profiles      | client_status            | text                     | YES         | 'active'::text               |
| profiles      | internal_notes           | text                     | YES         | null                         |
| quotes        | id                       | uuid                     | NO          | uuid_generate_v4()           |
| quotes        | user_id                  | uuid                     | NO          | null                         |
| quotes        | customer_name            | character varying        | NO          | null                         |
| quotes        | customer_email           | character varying        | YES         | null                         |
| quotes        | customer_phone           | character varying        | NO          | null                         |
| quotes        | vehicle_year             | integer                  | YES         | null                         |
| quotes        | vehicle_make             | character varying        | YES         | null                         |
| quotes        | vehicle_model            | character varying        | YES         | null                         |
| quotes        | service_type             | character varying        | YES         | null                         |
| quotes        | description              | text                     | NO          | null                         |
| quotes        | estimated_quote          | numeric                  | YES         | null                         |
| quotes        | status                   | character varying        | YES         | 'pending'::character varying |
| quotes        | notes                    | text                     | YES         | null                         |
| quotes        | whatsapp_sent_at         | timestamp with time zone | YES         | null                         |
| quotes        | whatsapp_message_id      | character varying        | YES         | null                         |
| quotes        | created_at               | timestamp with time zone | YES         | CURRENT_TIMESTAMP            |
| quotes        | updated_at               | timestamp with time zone | YES         | CURRENT_TIMESTAMP            |
| quotes        | deleted_at               | timestamp with time zone | YES         | null                         |
| receipts      | id                       | uuid                     | NO          | uuid_generate_v4()           |
| receipts      | user_id                  | uuid                     | NO          | null                         |
| receipts      | quote_id                 | uuid                     | YES         | null                         |
| receipts      | job_date                 | date                     | NO          | null                         |
| receipts      | amount_paid              | numeric                  | NO          | null                         |
| receipts      | payment_method           | character varying        | YES         | null                         |
| receipts      | notes                    | text                     | YES         | null                         |
| receipts      | invoice_number           | character varying        | YES         | null                         |
| receipts      | created_at               | timestamp with time zone | YES         | CURRENT_TIMESTAMP            |
| receipts      | updated_at               | timestamp with time zone | YES         | CURRENT_TIMESTAMP            |
| receipts      | deleted_at               | timestamp with time zone | YES         | null                         |
| reviews       | id                       | uuid                     | NO          | uuid_generate_v4()           |
| reviews       | user_id                  | uuid                     | NO          | null                         |
| reviews       | quote_id                 | uuid                     | YES         | null                         |
| reviews       | rating                   | integer                  | NO          | null                         |
| reviews       | comment                  | text                     | YES         | null                         |
| reviews       | customer_name            | character varying        | NO          | null                         |
| reviews       | customer_email           | character varying        | YES         | null                         |
| reviews       | status                   | character varying        | YES         | 'pending'::character varying |
| reviews       | moderation_notes         | text                     | YES         | null                         |
| reviews       | created_at               | timestamp with time zone | YES         | CURRENT_TIMESTAMP            |
| reviews       | updated_at               | timestamp with time zone | YES         | CURRENT_TIMESTAMP            |
| reviews       | approved_at              | timestamp with time zone | YES         | null                         |
| reviews       | deleted_at               | timestamp with time zone | YES         | null                         |
| seo_locations | id                       | uuid                     | NO          | gen_random_uuid()            |
| seo_locations | city                     | text                     | NO          | null                         |
| seo_locations | suburb                   | text                     | NO          | null                         |
| seo_locations | province                 | text                     | NO          | null                         |
| seo_locations | meta_title               | text                     | NO          | null                         |
| seo_locations | meta_description         | text                     | NO          | null                         |
| seo_locations | h1_heading               | text                     | NO          | null                         |
| seo_locations | content_body             | text                     | NO          | null                         |
| seo_locations | is_active                | boolean                  | YES         | true                         |
| seo_locations | created_at               | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| seo_locations | updated_at               | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| seo_registry  | id                       | uuid                     | NO          | gen_random_uuid()            |
| seo_registry  | path_url                 | text                     | NO          | null                         |
| seo_registry  | page_type                | text                     | NO          | null                         |
| seo_registry  | meta_title               | text                     | NO          | null                         |
| seo_registry  | meta_description         | text                     | NO          | null                         |
| seo_registry  | meta_keywords            | text                     | YES         | null                         |