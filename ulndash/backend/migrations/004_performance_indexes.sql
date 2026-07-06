-- Performance indexes for CRM Requests UNION and common list queries (Chunk 8)

-- Lead / request form tables (RequestsController UNION sources)
ALTER TABLE appdevrequests ADD INDEX idx_appdev_submitted_at (submitted_at);
ALTER TABLE appdevrequests ADD INDEX idx_appdev_name (name);
ALTER TABLE appdevrequests ADD INDEX idx_appdev_phone (phone);

ALTER TABLE graphdesrequests ADD INDEX idx_graphdes_created_at (created_at);
ALTER TABLE graphdesrequests ADD INDEX idx_graphdes_name (name);
ALTER TABLE graphdesrequests ADD INDEX idx_graphdes_phone (phone);

ALTER TABLE marketingrequests ADD INDEX idx_marketing_created_at (created_at);
ALTER TABLE marketingrequests ADD INDEX idx_marketing_name (name);
ALTER TABLE marketingrequests ADD INDEX idx_marketing_phone (phone);

ALTER TABLE webdesigninq ADD INDEX idx_webdesign_received_at (received_at);
ALTER TABLE webdesigninq ADD INDEX idx_webdesign_name (name);
ALTER TABLE webdesigninq ADD INDEX idx_webdesign_phone (phone);

ALTER TABLE website_orders ADD INDEX idx_website_orders_submitted_at (submitted_at);
ALTER TABLE website_orders ADD INDEX idx_website_orders_name (name);
ALTER TABLE website_orders ADD INDEX idx_website_orders_phone (phone);

ALTER TABLE contactus ADD INDEX idx_contactus_received_at (received_at);
ALTER TABLE contactus ADD INDEX idx_contactus_name (name);
ALTER TABLE contactus ADD INDEX idx_contactus_phone (phone);
ALTER TABLE contactus ADD INDEX idx_contactus_email (email);

ALTER TABLE newsletter ADD INDEX idx_newsletter_received_at (received_at);
ALTER TABLE newsletter ADD INDEX idx_newsletter_email (email);

-- Companies list / dashboard activity
ALTER TABLE companies ADD INDEX idx_companies_status_created (status, created_at);
ALTER TABLE companies ADD INDEX idx_companies_created_at (created_at);
