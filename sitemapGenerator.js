
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://m.fixbro.in'; 
const SITEMAP_PATH = path.join(__dirname, 'public', 'sitemap.xml');

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'cineelite',
};

// --- End Configuration ---

async function generateSitemap() {
    console.log('Starting sitemap generation...');

    let connection;
    try {
        // 1. Define static pages
        const staticPages = [
            '/',
            '/about',
            '/services',
            '/portfolio',
            '/pricing',
            '/contact',
        ];

        let dynamicPages = [];

        try {
            connection = await mysql.createConnection(dbConfig);
            console.log('Successfully connected to MySQL for sitemap generation.');

            // 2. Fetch dynamic pages from MySQL
            const [rows] = await connection.execute('SELECT slug FROM legal_pages');
            dynamicPages = rows.map(row => `/${row.slug}`);
            
            console.log(`Found ${staticPages.length} static pages and ${dynamicPages.length} dynamic pages.`);
        } catch (dbError) {
            console.error('Error connecting to MySQL or fetching legal pages:', dbError.message);
            console.warn('Proceeding with static pages only.');
        }

        // 3. Combine and deduplicate pages
        const allPages = [...new Set([...staticPages, ...dynamicPages])];

        // 4. Build the XML content
        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages.map(page => `
    <url>
        <loc>${WEBSITE_URL}${page}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
  `).join('')}
</urlset>`;

        // 5. Write the file
        fs.writeFileSync(SITEMAP_PATH, sitemapContent.trim());

        console.log(`Sitemap successfully generated and saved to ${SITEMAP_PATH}`);

    } catch (error) {
        console.error('An error occurred during sitemap generation:', error);
        // We don't necessarily want to fail the whole build if sitemap fails, 
        // but since it's part of the build script, we'll keep it as is or log it.
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

generateSitemap();
