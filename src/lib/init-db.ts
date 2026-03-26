import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'cineelite',
  multipleStatements: true,
});

async function ensureAuthSecret() {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  if (!envContent.includes('AUTH_SECRET=')) {
    const newSecret = crypto.randomBytes(32).toString('hex');
    const secretLine = `\nAUTH_SECRET=${newSecret}`;
    fs.appendFileSync(envPath, secretLine);
    console.log('🔑 Generated new AUTH_SECRET and added to .env');
  }
}

async function init() {
  console.log('🚀 Comprehensive Database Initialization Starting...');
  await ensureAuthSecret();
  
  try {
    // 0. Connect and Create DB
    const connectionWithoutDb = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
    });
    const dbName = process.env.MYSQL_DATABASE || 'cineelite';
    await connectionWithoutDb.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connectionWithoutDb.end();
    console.log(`✅ Database "${dbName}" ensured.`);

    const connection = await pool.getConnection();
    
    // 1. Run Schema
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('✅ Tables ensured.');

    // --- Ensure missing columns exist (for existing databases) ---
    const ensureColumn = async (table: string, column: string, definition: string) => {
        try {
            const [cols]: any = await connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
            if (cols.length === 0) {
                await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN ${column} ${definition}`);
                console.log(`✅ Column "${column}" added to "${table}".`);
            }
        } catch (e) {
            console.error(`❌ Error ensuring column ${column} in ${table}:`, e);
        }
    };

    await ensureColumn('pricing_plans', 'displayOrder', 'INT DEFAULT 0');
    await ensureColumn('pricing_plans', 'is_enabled', 'BOOLEAN DEFAULT TRUE');
    await ensureColumn('pricing_plans', 'value', "VARCHAR(255) DEFAULT ''");
    
    // Migration: if price exists and value is empty, copy price to value
    try {
        const [cols]: any = await connection.query(`SHOW COLUMNS FROM \`pricing_plans\` LIKE 'price'`);
        if (cols.length > 0) {
            // Copy price to value if value is empty
            await connection.query(`UPDATE pricing_plans SET value = price WHERE value = '' OR value IS NULL`);
            console.log('✅ Migrated pricing_plans.price to value.');
            
            // Drop price column
            await connection.query(`ALTER TABLE pricing_plans DROP COLUMN price`);
            console.log('✅ Dropped pricing_plans.price column.');
        }

        const [btnCols]: any = await connection.query(`SHOW COLUMNS FROM \`pricing_plans\` LIKE 'buttonText'`);
        if (btnCols.length > 0) {
            // If it's disabled, we might want to preserve buttonText into value if value is empty
            await connection.query(`UPDATE pricing_plans SET value = buttonText WHERE (value = '' OR value IS NULL) AND is_enabled = FALSE`);
            
            // Drop buttonText column
            await connection.query(`ALTER TABLE pricing_plans DROP COLUMN buttonText`);
            console.log('✅ Dropped pricing_plans.buttonText column.');
        }
    } catch (e) {
        console.error('❌ Error during pricing_plans migration/cleanup:', e);
    }

    await ensureColumn('faqs', 'displayOrder', 'INT DEFAULT 0');
    await ensureColumn('portfolio_items', 'mediaType', "VARCHAR(50) DEFAULT 'image'");
    await ensureColumn('portfolio_items', 'displayOrder', 'INT DEFAULT 0');

    // 2. Check if data exists
    const [rows]: any = await connection.query('SELECT COUNT(*) as count FROM settings');
    if (rows[0].count > 0) {
      console.log('ℹ️ Data already exists. Skipping initialization.');
      connection.release();
      process.exit(0);
    }

    console.log('📦 Populating ALL Default Content...');

    // --- HELPER FOR INSERTS ---
    const insertSetting = async (key: string, val: any) => {
      await connection.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, JSON.stringify(val)]);
    };

    // --- 1. SETTINGS & PAGE CONTENT (JSON) ---

    await insertSetting('general_settings', {
      siteName: 'FixBro Interiors',
      siteDescription: 'Premium Interior Design & Home Renovation Services',
      contactEmail: 'hello@fixbro.in',
      logo_url: '',
      favicon_url: '',
      social_links: { facebook: '', twitter: '', instagram: '', linkedin: '' }
    });

    await insertSetting('theme_settings', {
      themeColors: {
        light: { primary: '38 92% 50%', background: '40 20% 98%', foreground: '20 20% 8%' },
        dark: { primary: '45 95% 55%', background: '220 10% 6%', foreground: '40 15% 96%' }
      }
    });

    await insertSetting('home_page', {
      hero_title: 'Transform Your Space with FixBro Precision',
      hero_subtitle: 'We create high-impact interior design and home renovation solutions that elevate your lifestyle.',
      hero_media_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
      hero_media_type: 'image'
    });

    await insertSetting('contact_details', {
      email: 'contact@fixbro.in',
      phone: '+91 99000 00000',
      address: 'FixBro Plaza, Suite 100, Design District, Bangalore 560001',
      working_hours: 'Mon - Sat: 10:00 AM - 7:00 PM'
    });

    await insertSetting('email_settings', {
      smtp_host: '',
      smtp_port: 465,
      smtp_user: '',
      smtp_password: '',
      smtp_sender_name: 'FixBro Interiors',
      smtp_sender_email: 'noreply@fixbro.in'
    });

    await insertSetting('vanta_settings', {
      globalEnable: true,
      sections: {
        hero: { enabled: true, effect: 'GLOBE', color1: '#0055ff', color2: '#00aaff' },
        services: { enabled: false, effect: 'WAVES', color1: '#0055ff', color2: '#00aaff' },
        portfolio: { enabled: true, effect: 'NET', color1: '#0055ff', color2: '#00aaff' }
      }
    });

    await insertSetting('about_page', {
      mission_title: 'Our Design Mission',
      mission_description: 'We strive to blend aesthetics and functionality to deliver interior experiences that inspire.',
      mission_image: 'https://images.unsplash.com/photo-1616489953149-7551745d69ba',
      stack_title: 'Craftsmanship & Innovation',
      stack_description: 'Our team uses the latest in architectural design and sustainable materials.'
    });

    await insertSetting('portfolio_page', {
      title: 'Our Design Portfolio',
      subtitle: 'A showcase of our best work across residential and commercial projects.'
    });

    await insertSetting('pricing_page', {
      title: 'Transparent Design Plans',
      subtitle: 'Choose the right solution for your home renovation.'
    });

    await insertSetting('services_page', {
      title: 'Expert Design Solutions',
      subtitle: 'Comprehensive interior design and renovation services tailored for you.'
    });

    await insertSetting('why_choose_us', {
      title: 'Why Partners Choose FixBro',
      subtitle: 'We bring a unique blend of premium quality and timeless design.'
    });

    // --- 2. COLLECTIONS (TABLES) ---

    // Testimonials
    const testimonials = [
      { id: uuidv4(), clientName: 'Sarah Jenkins', clientRole: 'Homeowner', clientCompany: 'Innovate Tech', content: 'Working with FixBro was a game changer for our new apartment renovation.', rating: 5 },
      { id: uuidv4(), clientName: 'Michael Chen', clientRole: 'CEO', clientCompany: 'StartUp Hub', content: 'The attention to detail and design quality is simply unmatched.', rating: 5 }
    ];
    for (const t of testimonials) {
      await connection.query('INSERT INTO testimonials (id, clientName, clientRole, clientCompany, content, rating) VALUES (?, ?, ?, ?, ?, ?)', [t.id, t.clientName, t.clientRole, t.clientCompany, t.content, t.rating]);
    }

    // Services
    const servicesList = [
      { id: uuidv4(), title: 'Residential Design', description: 'Luxury home interiors and bespoke furniture.', icon: 'Home', price: 'Starting at ₹2,99,000', mediaUrl: 'https://images.unsplash.com/photo-1616489953149-7551745d69ba', mediaType: 'image', features: JSON.stringify([{name: 'Custom Furniture'}, {name: '3D Visualization'}]) },
      { id: uuidv4(), title: 'Commercial Interiors', description: 'Modern office spaces and retail design.', icon: 'Briefcase', price: 'Custom Quote', mediaUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c', mediaType: 'image', features: JSON.stringify([{name: 'Space Planning'}, {name: 'Branding Integration'}]) },
      { id: uuidv4(), title: 'Full Renovation', description: 'Transforming old spaces into modern masterpieces.', icon: 'Hammer', price: 'Starting at ₹4,99,000', mediaUrl: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d', mediaType: 'image', features: JSON.stringify([{name: 'Turnkey Solution'}, {name: 'Material Sourcing'}]) }
    ];
    for (const s of servicesList) {
      await connection.query('INSERT INTO services (id, title, description, icon, price, mediaUrl, mediaType, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [s.id, s.title, s.description, s.icon, s.price, s.mediaUrl, s.mediaType, s.features]);
    }

    // Portfolio
    const portfolio = [
      { id: uuidv4(), title: 'Modern Minimalist Villa', category: 'Residential', imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0', mediaType: 'image', displayOrder: 1 },
      { id: uuidv4(), title: 'Tech Hub Office', category: 'Commercial', imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2', mediaType: 'image', displayOrder: 2 }
    ];
    for (const p of portfolio) {
      await connection.query('INSERT INTO portfolio_items (id, title, category, imageUrl, mediaType, displayOrder) VALUES (?, ?, ?, ?, ?, ?)', [p.id, p.title, p.category, p.imageUrl, p.mediaType, p.displayOrder]);
    }

    // Pricing Plans
    const plans = [
      { id: uuidv4(), title: 'Essential', price: '₹99,000', billingCycle: 'per package', description: 'Perfect for single room makeovers.', features: JSON.stringify([{name:'2D Layouts'}, {name:'Color Consultation'}]), displayOrder: 1 },
      { id: uuidv4(), title: 'Premium', price: '₹4,99,000', billingCycle: 'per project', description: 'Full home interior transformation.', features: JSON.stringify([{name:'Full 3D Renderings'}, {name:'Turnkey Execution'}]), displayOrder: 2 }
    ];
    for (const pl of plans) {
      await connection.query('INSERT INTO pricing_plans (id, title, price, billingCycle, description, features, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?)', [pl.id, pl.title, pl.price, pl.billingCycle, pl.description, pl.features, pl.displayOrder]);
    }

    // FAQs
    const faqs = [
      { id: uuidv4(), q: 'What is your design process?', a: 'We follow a structured approach from consultation and 3D design to final execution.', displayOrder: 1 },
      { id: uuidv4(), q: 'Do you offer site visits?', a: 'Yes, we provide expert site visits and measurement services.', displayOrder: 2 }
    ];
    for (const f of faqs) {
      await connection.query('INSERT INTO faqs (id, question, answer, displayOrder) VALUES (?, ?, ?, ?)', [f.id, f.q, f.a, f.displayOrder]);
    }

    // Skills
    const skills = [
      { id: uuidv4(), name: 'Space Planning', level: 95 },
      { id: uuidv4(), name: '3D Visualization', level: 90 },
      { id: uuidv4(), name: 'Turnkey Execution', level: 85 }
    ];
    for (const sk of skills) {
      await connection.query('INSERT INTO skills (id, name, level) VALUES (?, ?, ?)', [sk.id, sk.name, sk.level]);
    }

    // Features (Why Choose Us)
    const features = [
      { id: uuidv4(), title: 'Premium Quality', description: 'We use the finest materials and skilled craftsmen.', icon: 'Award' },
      { id: uuidv4(), title: 'On-Time Delivery', description: 'We respect your timelines and deliver as promised.', icon: 'Clock' }
    ];
    for (const fe of features) {
      await connection.query('INSERT INTO why_choose_us_features (id, title, description, icon) VALUES (?, ?, ?, ?)', [fe.id, fe.title, fe.description, fe.icon]);
    }

    // --- 3. LEGAL PAGES ---
    const legal = [
      { slug: 'terms', title: 'Terms of Service', content: 'Welcome to FixBro Interiors. By using our services...' },
      { slug: 'privacy-policy', title: 'Privacy Policy', content: 'We value your privacy. Your data is protected...' },
      { slug: 'refund-policy', title: 'Refund Policy', content: 'Refunds are processed as per service agreement...' },
      { slug: 'cancellation-policy', title: 'Cancellation Policy', content: 'Cancellations depend on project stage...' }
    ];
    for (const l of legal) {
      await connection.query('INSERT INTO legal_pages (slug, title, content) VALUES (?, ?, ?)', [l.slug, l.title, l.content]);
    }

    // --- 4. SEO SETTINGS ---
    const seoRoutes = ['home', 'about', 'services', 'pricing', 'portfolio', 'contact'];
    for (const route of seoRoutes) {
      await connection.query('INSERT INTO page_seo (slug, title, description) VALUES (?, ?, ?)', [
        route, 
        `FixBro Interiors | ${route.charAt(0).toUpperCase() + route.slice(1)}`,
        `Premium interior design and home renovation solutions for our ${route} page.`
      ]);
    }

    console.log('🎉 ALL CONTENT PACKED INTO DATABASE SUCCESSFULLY!');

    // --- 5. DEFAULT ADMIN USER ---
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      'INSERT INTO admin_users (id, username, password, email) VALUES (?, ?, ?, ?)',
      [uuidv4(), 'admin', hashedPassword, 'admin@fixbro.in']
    );
    console.log('👤 Default Admin User Created: admin / admin123');

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ CRITICAL ERROR during comprehensive initialization:', error);
    process.exit(1);
  }
}

init();
