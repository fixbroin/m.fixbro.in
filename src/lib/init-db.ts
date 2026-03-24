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
      siteName: 'CineElite ADS',
      siteDescription: 'Premium Digital Advertising & Production Agency',
      contactEmail: 'hello@cineelite.com',
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
      hero_title: 'Transform Your Brand with Cinematic Precision',
      hero_subtitle: 'We create high-impact digital advertising and production solutions that captivate your audience.',
      hero_media_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174',
      hero_media_type: 'image'
    });

    await insertSetting('contact_details', {
      email: 'contact@cineelite.com',
      phone: '+1 (555) 000-0000',
      address: '123 Media Boulevard, Suite 100, Creative City, NY 10001',
      working_hours: 'Mon - Fri: 9:00 AM - 6:00 PM'
    });

    await insertSetting('email_settings', {
      smtp_host: '',
      smtp_port: 465,
      smtp_user: '',
      smtp_password: '',
      smtp_sender_name: 'CineElite ADS',
      smtp_sender_email: 'noreply@cineelite.com'
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
      mission_title: 'Our Creative Mission',
      mission_description: 'We strive to blend art and technology to deliver advertising experiences that stick.',
      mission_image: 'https://images.unsplash.com/photo-1522071823991-b9671f9d7f1f',
      stack_title: 'Technology & Creativity',
      stack_description: 'Our team uses the latest in visual production and digital marketing tools.'
    });

    await insertSetting('portfolio_page', {
      title: 'Our Featured Projects',
      subtitle: 'A showcase of our best work across various industries.'
    });

    await insertSetting('pricing_page', {
      title: 'Transparent Pricing Plans',
      subtitle: 'Choose the right solution for your business growth.'
    });

    await insertSetting('services_page', {
      title: 'Expert Solutions We Provide',
      subtitle: 'Comprehensive advertising and production services tailored for you.'
    });

    await insertSetting('why_choose_us', {
      title: 'Why Partners Choose Us',
      subtitle: 'We bring a unique blend of cinematic quality and data-driven results.'
    });

    // --- 2. COLLECTIONS (TABLES) ---

    // Testimonials
    const testimonials = [
      { id: uuidv4(), clientName: 'Sarah Jenkins', clientRole: 'Marketing Lead', clientCompany: 'Innovate Tech', content: 'Working with CineElite was a game changer for our Q4 campaign.', rating: 5 },
      { id: uuidv4(), clientName: 'Michael Chen', clientRole: 'CEO', clientCompany: 'StartUp Hub', content: 'The video production quality is simply unmatched in the industry.', rating: 5 }
    ];
    for (const t of testimonials) {
      await connection.query('INSERT INTO testimonials (id, clientName, clientRole, clientCompany, content, rating) VALUES (?, ?, ?, ?, ?, ?)', [t.id, t.clientName, t.clientRole, t.clientCompany, t.content, t.rating]);
    }

    // Services
    const servicesList = [
      { id: uuidv4(), title: 'Video Production', description: 'Cinematic commercials and brand stories.', icon: 'Video', price: 'Starting at $2999', mediaUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4', mediaType: 'image', features: JSON.stringify([{name: 'High-end Gear'}, {name: 'Professional Editing'}]) },
      { id: uuidv4(), title: 'Digital Advertising', description: 'Targeted campaigns across social and search.', icon: 'Megaphone', price: 'Custom', mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f', mediaType: 'image', features: JSON.stringify([{name: 'Social Media Strategy'}, {name: 'PPC Management'}]) },
      { id: uuidv4(), title: 'Brand Strategy', description: 'Defining your voice and visual identity.', icon: 'Palette', price: 'Starting at $1499', mediaUrl: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f', mediaType: 'image', features: JSON.stringify([{name: 'Visual Identity'}, {name: 'Brand Voice Definition'}]) }
    ];
    for (const s of servicesList) {
      await connection.query('INSERT INTO services (id, title, description, icon, price, mediaUrl, mediaType, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [s.id, s.title, s.description, s.icon, s.price, s.mediaUrl, s.mediaType, s.features]);
    }

    // Portfolio
    const portfolio = [
      { id: uuidv4(), title: 'Global Tech Launch', category: 'Production', imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692', mediaType: 'image', displayOrder: 1 },
      { id: uuidv4(), title: 'Urban Fashion Film', category: 'Fashion', imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b', mediaType: 'image', displayOrder: 2 }
    ];
    for (const p of portfolio) {
      await connection.query('INSERT INTO portfolio_items (id, title, category, imageUrl, mediaType, displayOrder) VALUES (?, ?, ?, ?, ?, ?)', [p.id, p.title, p.category, p.imageUrl, p.mediaType, p.displayOrder]);
    }

    // Pricing Plans
    const plans = [
      { id: uuidv4(), title: 'Starter', price: '$999', billingCycle: 'per project', description: 'Great for small campaigns.', features: JSON.stringify([{name:'1 Video'}, {name:'Social Media Setup'}]), displayOrder: 1 },
      { id: uuidv4(), title: 'Pro', price: '$4999', billingCycle: 'per month', description: 'Full-service advertising.', features: JSON.stringify([{name:'Unlimited Videos'}, {name:'Full Ad Management'}]), displayOrder: 2 }
    ];
    for (const pl of plans) {
      await connection.query('INSERT INTO pricing_plans (id, title, price, billingCycle, description, features, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?)', [pl.id, pl.title, pl.price, pl.billingCycle, pl.description, pl.features, pl.displayOrder]);
    }

    // FAQs
    const faqs = [
      { id: uuidv4(), q: 'What industries do you work with?', a: 'We work across tech, fashion, food, and corporate sectors.', displayOrder: 1 },
      { id: uuidv4(), q: 'What is your average project timeline?', a: 'Most projects range from 2 to 6 weeks depending on complexity.', displayOrder: 2 }
    ];
    for (const f of faqs) {
      await connection.query('INSERT INTO faqs (id, question, answer, displayOrder) VALUES (?, ?, ?, ?)', [f.id, f.q, f.a, f.displayOrder]);
    }

    // Skills
    const skills = [
      { id: uuidv4(), name: 'Visual Production', level: 95 },
      { id: uuidv4(), name: 'Digital Marketing', level: 90 },
      { id: uuidv4(), name: 'Brand Strategy', level: 85 }
    ];
    for (const sk of skills) {
      await connection.query('INSERT INTO skills (id, name, level) VALUES (?, ?, ?)', [sk.id, sk.name, sk.level]);
    }

    // Features (Why Choose Us)
    const features = [
      { id: uuidv4(), title: 'Cinematic Quality', description: 'We use high-end cinema cameras for every shoot.', icon: 'Camera' },
      { id: uuidv4(), title: 'Data Driven', description: 'Every ad is backed by audience analytics.', icon: 'BarChart' }
    ];
    for (const fe of features) {
      await connection.query('INSERT INTO why_choose_us_features (id, title, description, icon) VALUES (?, ?, ?, ?)', [fe.id, fe.title, fe.description, fe.icon]);
    }

    // --- 3. LEGAL PAGES ---
    const legal = [
      { slug: 'terms', title: 'Terms of Service', content: 'Welcome to CineElite. By using our services...' },
      { slug: 'privacy-policy', title: 'Privacy Policy', content: 'We value your privacy. Your data is protected...' },
      { slug: 'refund-policy', title: 'Refund Policy', content: 'Refunds are processed within 30 days...' },
      { slug: 'cancellation-policy', title: 'Cancellation Policy', content: 'Cancellations require 48-hour notice...' }
    ];
    for (const l of legal) {
      await connection.query('INSERT INTO legal_pages (slug, title, content) VALUES (?, ?, ?)', [l.slug, l.title, l.content]);
    }

    // --- 4. SEO SETTINGS ---
    const seoRoutes = ['home', 'about', 'services', 'pricing', 'portfolio', 'contact'];
    for (const route of seoRoutes) {
      await connection.query('INSERT INTO page_seo (slug, title, description) VALUES (?, ?, ?)', [
        route, 
        `CineElite ADS | ${route.charAt(0).toUpperCase() + route.slice(1)}`,
        `Premium advertising and production solutions for our ${route} page.`
      ]);
    }

    console.log('🎉 ALL CONTENT PACKED INTO DATABASE SUCCESSFULLY!');

    // --- 5. DEFAULT ADMIN USER ---
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      'INSERT INTO admin_users (id, username, password, email) VALUES (?, ?, ?, ?)',
      [uuidv4(), 'admin', hashedPassword, 'admin@cineelite.com']
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
