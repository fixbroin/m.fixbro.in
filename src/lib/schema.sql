CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_submissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    budget VARCHAR(100),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    plan_title VARCHAR(255) NOT NULL,
    plan_price VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS testimonials (
    id VARCHAR(36) PRIMARY KEY,
    clientName VARCHAR(255) NOT NULL,
    clientRole VARCHAR(255),
    clientCompany VARCHAR(255),
    content TEXT NOT NULL,
    rating INT DEFAULT 5,
    imageUrl VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_logs (
    id VARCHAR(36) PRIMARY KEY,
    sessionId VARCHAR(255) UNIQUE,
    geoData JSON,
    deviceInfo JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS page_visits (
    id VARCHAR(36) PRIMARY KEY,
    event_data JSON,
    ip VARCHAR(45),
    userAgent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_events (
    id VARCHAR(36) PRIMARY KEY,
    event_data JSON,
    ip VARCHAR(45),
    userAgent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_funnel (
    id VARCHAR(36) PRIMARY KEY,
    event_data JSON,
    ip VARCHAR(45),
    userAgent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_activity (
    id VARCHAR(36) PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pages (
    slug VARCHAR(100) PRIMARY KEY,
    content JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS why_choose_us_features (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pricing_plans (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    billingCycle VARCHAR(50),
    description TEXT,
    features JSON,
    isPopular BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT TRUE,
    displayOrder INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100),
    price VARCHAR(255),
    mediaUrl VARCHAR(255),
    mediaType VARCHAR(50) DEFAULT 'image',
    features JSON,
    displayOrder INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portfolio_items (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    imageUrl VARCHAR(255) NOT NULL,
    mediaType VARCHAR(50) DEFAULT 'image',
    link VARCHAR(255),
    displayOrder INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faqs (
    id VARCHAR(36) PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    displayOrder INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS legal_pages (
    slug VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS page_seo (
    slug VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    keywords TEXT,
    ogImage VARCHAR(255),
    h1_title VARCHAR(255),
    paragraph TEXT,
    schema_type VARCHAR(100),
    canonical_url VARCHAR(255),
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS popups (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- welcome, exit, promotion, newsletter, custom
    trigger_type VARCHAR(50) NOT NULL, -- on_load, delay, scroll, exit
    trigger_value INT DEFAULT 0, -- seconds or scroll percentage
    pages JSON, -- Array of page slugs or ['all']
    devices VARCHAR(50) DEFAULT 'all', -- mobile, desktop, all
    title VARCHAR(255),
    description TEXT,
    media_type VARCHAR(50) DEFAULT 'image', -- image, video
    media_url VARCHAR(255),
    cta_text VARCHAR(100),
    cta_link VARCHAR(255),
    show_form BOOLEAN DEFAULT FALSE,
    form_fields JSON, -- {name: boolean, email: boolean, phone: boolean}
    frequency VARCHAR(50) DEFAULT 'once', -- once, daily, always
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS popup_leads (
    id VARCHAR(36) PRIMARY KEY,
    popup_id VARCHAR(36),
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    page_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (popup_id) REFERENCES popups(id) ON DELETE SET NULL
);
