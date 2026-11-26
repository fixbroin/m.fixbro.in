import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config();

const dbHost = process.env.MYSQL_HOST || 'localhost';
const dbPort = parseInt(process.env.MYSQL_PORT || '3306', 10);
const dbUser = process.env.MYSQL_USER || 'root';
const dbPassword = process.env.MYSQL_PASSWORD || '';
const dbName = process.env.MYSQL_DATABASE || 'fixbro_interiors';

async function ensureEnvDefaults() {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  let updatedContent = envContent;
  const additions: string[] = [];

  const setOrAppendEnv = (key: string, value: string, logMsg: string) => {
    const emptyLineRegex = new RegExp(`^${key}=\\s*$`, 'm');
    const existingValueRegex = new RegExp(`^${key}=.+`, 'm');

    if (existingValueRegex.test(updatedContent)) {
      return; // Already has a non-empty value
    }

    if (emptyLineRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(emptyLineRegex, `${key}=${value}`);
    } else {
      additions.push(`${key}=${value}`);
    }
    process.env[key] = value;
    console.log(logMsg);
  };

  if (!process.env.AUTH_SECRET) {
    setOrAppendEnv(
      'AUTH_SECRET',
      crypto.randomBytes(32).toString('hex'),
      '🔑 Generated new AUTH_SECRET and saved to .env'
    );
  }

  if (!process.env.ADMIN_USERNAME) {
    setOrAppendEnv(
      'ADMIN_USERNAME',
      'admin',
      '👤 Added ADMIN_USERNAME to .env'
    );
  }

  if (!process.env.DEFAULT_ADMIN_PASSWORD) {
    setOrAppendEnv(
      'DEFAULT_ADMIN_PASSWORD',
      crypto.randomBytes(12).toString('base64url'),
      '🔐 Generated new DEFAULT_ADMIN_PASSWORD and saved to .env'
    );
  }

  if (additions.length > 0) {
    const prefix = updatedContent.length > 0 && !updatedContent.endsWith('\n') ? '\n' : '';
    updatedContent = `${updatedContent}${prefix}${additions.join('\n')}\n`;
  }

  if (updatedContent !== envContent) {
    fs.writeFileSync(envPath, updatedContent, 'utf8');
  }
}

async function init() {
  console.log('🚀 Comprehensive Database Initialization Starting...');
  await ensureEnvDefaults();
  
  try {
    // 0. Connect and Ensure Database Exists
    const connectionWithoutDb = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
    });

    await connectionWithoutDb.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connectionWithoutDb.end();
    console.log(`✅ Database "${dbName}" ensured.`);

    // Connect to specific database
    const pool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      multipleStatements: true,
      waitForConnections: true,
      connectionLimit: 10,
    });

    const connection = await pool.getConnection();

    // 1. Run Schema - Statement by statement to isolate and handle existing tables/tablespaces
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Clean comments and split into individual statements
      const cleanSql = schemaSql
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      
      const statements = cleanSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (stmtErr: any) {
          // Ignore table already exists (1050) or tablespace exists (1813)
          if (stmtErr.errno === 1050 || stmtErr.errno === 1813 || stmtErr.code === 'ER_TABLE_EXISTS_ERROR') {
            // Table already exists, continue safely
          } else {
            console.warn(`Notice during table creation: ${stmtErr.message}`);
          }
        }
      }
      console.log('✅ Tables ensured.');
    }

    // --- Ensure missing columns exist (for existing databases) ---
    const ensureColumn = async (table: string, column: string, definition: string) => {
      try {
        const [cols]: any = await connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
        if (cols.length === 0) {
          await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN ${column} ${definition}`);
          console.log(`✅ Column "${column}" added to "${table}".`);
        }
      } catch (e: any) {
        if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {
          console.error(`❌ Error ensuring column ${column} in ${table}:`, e.message);
        }
      }
    };

    await ensureColumn('pricing_plans', 'displayOrder', 'INT DEFAULT 0');
    await ensureColumn('pricing_plans', 'is_enabled', 'BOOLEAN DEFAULT TRUE');
    await ensureColumn('pricing_plans', 'value', "VARCHAR(255) DEFAULT ''");
    
    // Migration: if price exists and value is empty, copy price to value
    try {
      const [cols]: any = await connection.query(`SHOW COLUMNS FROM \`pricing_plans\` LIKE 'price'`);
      if (cols.length > 0) {
        await connection.query(`UPDATE pricing_plans SET value = price WHERE value = '' OR value IS NULL`);
        console.log('✅ Migrated pricing_plans.price to value.');
        
        await connection.query(`ALTER TABLE pricing_plans DROP COLUMN price`);
        console.log('✅ Dropped pricing_plans.price column.');
      }

      const [btnCols]: any = await connection.query(`SHOW COLUMNS FROM \`pricing_plans\` LIKE 'buttonText'`);
      if (btnCols.length > 0) {
        await connection.query(`UPDATE pricing_plans SET value = buttonText WHERE (value = '' OR value IS NULL) AND is_enabled = FALSE`);
        await connection.query(`ALTER TABLE pricing_plans DROP COLUMN buttonText`);
        console.log('✅ Dropped pricing_plans.buttonText column.');
      }
    } catch (e: any) {
      console.warn('Notice during pricing_plans migration/cleanup:', e.message);
    }

    await ensureColumn('faqs', 'displayOrder', 'INT DEFAULT 0');
    await ensureColumn('portfolio_items', 'mediaType', "VARCHAR(50) DEFAULT 'image'");
    await ensureColumn('portfolio_items', 'displayOrder', 'INT DEFAULT 0');
    await ensureColumn('services', 'displayOrder', 'INT DEFAULT 0');

    // --- Ensure performance indexes exist ---
    const ensureIndex = async (table: string, indexName: string, columns: string) => {
      try {
        const [rows]: any = await connection.query(`SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`, [indexName]);
        if (rows.length === 0) {
          await connection.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${columns})`);
          console.log(`✅ Index "${indexName}" created on "${table}".`);
        }
      } catch (e: any) {
        if (e.errno !== 1061 && e.code !== 'ER_DUP_KEYNAME') {
          console.warn(`Notice ensuring index ${indexName} on ${table}:`, e.message);
        }
      }
    };

    await ensureIndex('orders', 'idx_orders_created_at', 'created_at');
    await ensureIndex('orders', 'idx_orders_email_plan', 'customer_email, plan_title, created_at');
    await ensureIndex('orders', 'idx_orders_payment_method', 'payment_method');
    await ensureIndex('visitor_logs', 'idx_visitor_logs_timestamp', 'timestamp');
    await ensureIndex('page_visits', 'idx_page_visits_timestamp', 'timestamp');
    await ensureIndex('user_events', 'idx_user_events_timestamp', 'timestamp');
    await ensureIndex('booking_funnel', 'idx_booking_funnel_timestamp', 'timestamp');
    await ensureIndex('user_activity', 'idx_user_activity_timestamp', 'timestamp');
    await ensureIndex('notifications', 'idx_notifications_read_created', 'isRead, createdAt');
    await ensureIndex('popups', 'idx_popups_is_active', 'is_active');
    await ensureIndex('pricing_plans', 'idx_pricing_plans_order', 'displayOrder');
    await ensureIndex('services', 'idx_services_order', 'displayOrder');
    await ensureIndex('portfolio_items', 'idx_portfolio_items_order', 'displayOrder');
    await ensureIndex('faqs', 'idx_faqs_order', 'displayOrder');

    // --- HELPER FOR SETTINGS INSERT OR MERGE ---
    const insertOrMergeSetting = async (key: string, defaultVal: any) => {
      try {
        const [rows]: any = await connection.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
        if (rows.length === 0) {
          await connection.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, JSON.stringify(defaultVal)]);
        } else {
          // Existing setting - merge missing keys
          let existing = rows[0].setting_value;
          if (typeof existing === 'string') {
            try { existing = JSON.parse(existing); } catch { existing = {}; }
          }
          if (typeof existing === 'object' && existing !== null && typeof defaultVal === 'object' && defaultVal !== null && !Array.isArray(defaultVal)) {
            let updated = false;
            for (const [k, v] of Object.entries(defaultVal)) {
              if (existing[k] === undefined) {
                existing[k] = v;
                updated = true;
              }
            }
            if (updated) {
              await connection.query('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [JSON.stringify(existing), key]);
            }
          }
        }
      } catch (e: any) {
        console.warn(`Notice inserting setting ${key}:`, e.message);
      }
    };

    // --- 1. SETTINGS & PAGE CONTENT (JSON) ---
    await insertOrMergeSetting('general_settings', {
      siteName: 'FixBro Interiors',
      siteDescription: 'Premium Interior Design & Home Renovation Services',
      contactEmail: 'hello@fixbro.in',
      currency_symbol: '₹',
      currency_code: 'INR',
      logo_url: '',
      favicon_url: '',
      social_links: { facebook: '', twitter: '', instagram: '', linkedin: '' }
    });

    await insertOrMergeSetting('payment_settings', {
      razorpay_key_id: '',
      razorpay_key_secret: '',
      razorpay_webhook_secret: '',
      enable_online_payments: false,
      enable_pay_later: true
    });

    await insertOrMergeSetting('theme_settings', {
      themeColors: {
        light: { primary: '38 92% 50%', background: '40 20% 98%', foreground: '20 20% 8%' },
        dark: { primary: '45 95% 55%', background: '220 10% 6%', foreground: '40 15% 96%' }
      }
    });

    await insertOrMergeSetting('home_page', {
      hero_title: 'Transform Your Space with FixBro Precision',
      hero_subtitle: 'We create high-impact interior design and home renovation solutions that elevate your lifestyle.',
      hero_media_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
      hero_media_type: 'image'
    });

    await insertOrMergeSetting('contact_details', {
      email: 'contact@fixbro.in',
      phone: '+91 99000 00000',
      address: 'FixBro Plaza, Suite 100, Design District, Bangalore 560001',
      working_hours: 'Mon - Sat: 10:00 AM - 7:00 PM'
    });

    await insertOrMergeSetting('email_settings', {
      smtp_host: '',
      smtp_port: 465,
      smtp_user: '',
      smtp_password: '',
      smtp_sender_name: 'FixBro Interiors',
      smtp_sender_email: 'noreply@fixbro.in'
    });

    await insertOrMergeSetting('vanta_settings', {
      globalEnable: true,
      sections: {
        hero: { enabled: true, effect: 'GLOBE', color1: '#0055ff', color2: '#00aaff' },
        services: { enabled: false, effect: 'WAVES', color1: '#0055ff', color2: '#00aaff' },
        portfolio: { enabled: true, effect: 'NET', color1: '#0055ff', color2: '#00aaff' }
      }
    });

    await insertOrMergeSetting('about_page', {
      mission_title: 'Our Design Mission',
      mission_description: 'We strive to blend aesthetics and functionality to deliver interior experiences that inspire.',
      mission_image: 'https://images.unsplash.com/photo-1616489953149-7551745d69ba',
      stack_title: 'Craftsmanship & Innovation',
      stack_description: 'Our team uses the latest in architectural design and sustainable materials.'
    });

    await insertOrMergeSetting('portfolio_page', {
      title: 'Our Design Portfolio',
      subtitle: 'A showcase of our best work across residential and commercial projects.'
    });

    await insertOrMergeSetting('pricing_page', {
      title: 'Transparent Design Plans',
      subtitle: 'Choose the right solution for your home renovation.',
      trust_title: 'Transparent & Trustworthy Pricing',
      trust_description: 'We believe in 100% price transparency with zero hidden costs or surprise surcharges.'
    });

    await insertOrMergeSetting('services_page', {
      title: 'Expert Design Solutions',
      subtitle: 'Comprehensive interior design and renovation services tailored for you.'
    });

    await insertOrMergeSetting('why_choose_us', {
      title: 'Why Partners Choose FixBro',
      subtitle: 'We bring a unique blend of premium quality and timeless design.'
    });

    // --- 2. COLLECTIONS SEEDING (CONDITIONAL) ---
    const countTable = async (tableName: string): Promise<number> => {
      try {
        const [res]: any = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        return res[0].count;
      } catch {
        return 0;
      }
    };

    // Testimonials
    if ((await countTable('testimonials')) === 0) {
      const testimonials = [
        { id: uuidv4(), clientName: 'Sarah Jenkins', clientRole: 'Homeowner', clientCompany: 'Innovate Tech', content: 'Working with FixBro was a game changer for our new apartment renovation.', rating: 5 },
        { id: uuidv4(), clientName: 'Michael Chen', clientRole: 'CEO', clientCompany: 'StartUp Hub', content: 'The attention to detail and design quality is simply unmatched.', rating: 5 }
      ];
      for (const t of testimonials) {
        await connection.query('INSERT INTO testimonials (id, clientName, clientRole, clientCompany, content, rating) VALUES (?, ?, ?, ?, ?, ?)', [t.id, t.clientName, t.clientRole, t.clientCompany, t.content, t.rating]);
      }
      console.log('✅ Default testimonials seeded.');
    }

    // Services
    if ((await countTable('services')) === 0) {
      const servicesList = [
        { id: uuidv4(), title: 'Residential Design', description: 'Luxury home interiors and bespoke furniture.', icon: 'Home', price: 'Starting at ₹2,99,000', mediaUrl: 'https://images.unsplash.com/photo-1616489953149-7551745d69ba', mediaType: 'image', features: JSON.stringify([{name: 'Custom Furniture'}, {name: '3D Visualization'}]) },
        { id: uuidv4(), title: 'Commercial Interiors', description: 'Modern office spaces and retail design.', icon: 'Briefcase', price: 'Custom Quote', mediaUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c', mediaType: 'image', features: JSON.stringify([{name: 'Space Planning'}, {name: 'Branding Integration'}]) },
        { id: uuidv4(), title: 'Full Renovation', description: 'Transforming old spaces into modern masterpieces.', icon: 'Hammer', price: 'Starting at ₹4,99,000', mediaUrl: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d', mediaType: 'image', features: JSON.stringify([{name: 'Turnkey Solution'}, {name: 'Material Sourcing'}]) }
      ];
      for (const s of servicesList) {
        await connection.query('INSERT INTO services (id, title, description, icon, price, mediaUrl, mediaType, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [s.id, s.title, s.description, s.icon, s.price, s.mediaUrl, s.mediaType, s.features]);
      }
      console.log('✅ Default services seeded.');
    }

    // Portfolio
    if ((await countTable('portfolio_items')) === 0) {
      const portfolio = [
        { id: uuidv4(), title: 'Modern Minimalist Villa', category: 'Residential', imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0', mediaType: 'image', displayOrder: 1 },
        { id: uuidv4(), title: 'Tech Hub Office', category: 'Commercial', imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2', mediaType: 'image', displayOrder: 2 }
      ];
      for (const p of portfolio) {
        await connection.query('INSERT INTO portfolio_items (id, title, category, imageUrl, mediaType, displayOrder) VALUES (?, ?, ?, ?, ?, ?)', [p.id, p.title, p.category, p.imageUrl, p.mediaType, p.displayOrder]);
      }
      console.log('✅ Default portfolio items seeded.');
    }

    // Pricing Plans
    if ((await countTable('pricing_plans')) === 0) {
      const plans = [
        { id: uuidv4(), title: 'Essential', value: '₹99,000', billingCycle: 'per package', description: 'Perfect for single room makeovers.', features: JSON.stringify([{name:'2D Layouts'}, {name:'Color Consultation'}]), displayOrder: 1 },
        { id: uuidv4(), title: 'Premium', value: '₹4,99,000', billingCycle: 'per project', description: 'Full home interior transformation.', features: JSON.stringify([{name:'Full 3D Renderings'}, {name:'Turnkey Execution'}]), displayOrder: 2 }
      ];
      for (const pl of plans) {
        await connection.query('INSERT INTO pricing_plans (id, title, value, billingCycle, description, features, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?)', [pl.id, pl.title, pl.value, pl.billingCycle, pl.description, pl.features, pl.displayOrder]);
      }
      console.log('✅ Default pricing plans seeded.');
    }

    // FAQs
    if ((await countTable('faqs')) === 0) {
      const faqs = [
        { id: uuidv4(), q: 'What is your design process?', a: 'We follow a structured approach from consultation and 3D design to final execution.', displayOrder: 1 },
        { id: uuidv4(), q: 'Do you offer site visits?', a: 'Yes, we provide expert site visits and measurement services.', displayOrder: 2 }
      ];
      for (const f of faqs) {
        await connection.query('INSERT INTO faqs (id, question, answer, displayOrder) VALUES (?, ?, ?, ?)', [f.id, f.q, f.a, f.displayOrder]);
      }
      console.log('✅ Default FAQs seeded.');
    }

    // Skills
    if ((await countTable('skills')) === 0) {
      const skills = [
        { id: uuidv4(), name: 'Space Planning', level: 95 },
        { id: uuidv4(), name: '3D Visualization', level: 90 },
        { id: uuidv4(), name: 'Turnkey Execution', level: 85 }
      ];
      for (const sk of skills) {
        await connection.query('INSERT INTO skills (id, name, level) VALUES (?, ?, ?)', [sk.id, sk.name, sk.level]);
      }
      console.log('✅ Default skills seeded.');
    }

    // Why Choose Us
    if ((await countTable('why_choose_us_features')) === 0) {
      const features = [
        { id: uuidv4(), title: 'Premium Quality', description: 'We use the finest materials and skilled craftsmen.', icon: 'Award' },
        { id: uuidv4(), title: 'On-Time Delivery', description: 'We respect your timelines and deliver as promised.', icon: 'Clock' }
      ];
      for (const fe of features) {
        await connection.query('INSERT INTO why_choose_us_features (id, title, description, icon) VALUES (?, ?, ?, ?)', [fe.id, fe.title, fe.description, fe.icon]);
      }
      console.log('✅ Default features seeded.');
    }

    // Legal Pages
    if ((await countTable('legal_pages')) === 0) {
      const legal = [
        { slug: 'terms', title: 'Terms of Service', content: 'Welcome to FixBro Interiors. By using our services...' },
        { slug: 'privacy-policy', title: 'Privacy Policy', content: 'We value your privacy. Your data is protected...' },
        { slug: 'refund-policy', title: 'Refund Policy', content: 'Refunds are processed as per service agreement...' },
        { slug: 'cancellation-policy', title: 'Cancellation Policy', content: 'Cancellations depend on project stage...' }
      ];
      for (const l of legal) {
        await connection.query('INSERT INTO legal_pages (slug, title, content) VALUES (?, ?, ?)', [l.slug, l.title, l.content]);
      }
      console.log('✅ Default legal pages seeded.');
    }

    // SEO Settings
    if ((await countTable('page_seo')) === 0) {
      const seoRoutes = ['home', 'about', 'services', 'pricing', 'portfolio', 'contact'];
      for (const route of seoRoutes) {
        await connection.query('INSERT INTO page_seo (slug, title, description) VALUES (?, ?, ?)', [
          route, 
          `FixBro Interiors | ${route.charAt(0).toUpperCase() + route.slice(1)}`,
          `Premium interior design and home renovation solutions for our ${route} page.`
        ]);
      }
      console.log('✅ Default SEO metadata seeded.');
    }

    // --- 3. DEFAULT ADMIN USER ---
    if ((await countTable('admin_users')) === 0) {
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await connection.query(
        'INSERT INTO admin_users (id, username, password, email) VALUES (?, ?, ?, ?)',
        [uuidv4(), adminUsername, hashedPassword, `${adminUsername}@fixbro.in`]
      );
      console.log(`👤 Default Admin User Created: username="${adminUsername}"`);
    }

    console.log('🎉 Database initialization and verification completed successfully!');
    connection.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ CRITICAL ERROR during comprehensive initialization:', error);
    process.exit(1);
  }
}

init();
