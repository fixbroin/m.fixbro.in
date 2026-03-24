'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

const TABLES_TO_MANAGE = [
    'contact_submissions',
    'orders',
    'testimonials',
    'notifications',
    'newsletter_subscribers',
    'visitor_logs',
    'page_visits',
    'user_events',
    'booking_funnel',
    'user_activity',
    'settings',
    'pages',
    'why_choose_us_features',
    'skills',
    'pricing_plans',
    'services',
    'portfolio_items',
    'faqs',
    'legal_pages',
    'page_seo'
];

export async function exportDatabase(): Promise<Record<string, any[]>> {
  try {
    const data: Record<string, any[]> = {};
    for (const tableName of TABLES_TO_MANAGE) {
      const rows: any = await db.query(`SELECT * FROM ${tableName}`);
      // Clean dates for JSON
      const cleanRows = rows.map((row: any) => {
          const newRow = { ...row };
          for (const key in newRow) {
              if (newRow[key] instanceof Date) {
                  newRow[key] = newRow[key].toISOString();
              }
          }
          return newRow;
      });
      data[tableName] = cleanRows;
    }
    return data;
  } catch (error) {
    console.error("Error exporting database:", error);
    throw new Error("Failed to export database.");
  }
}

export async function clearTable(tableName: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!TABLES_TO_MANAGE.includes(tableName)) {
            throw new Error("Invalid table name.");
        }
        await db.query(`DELETE FROM ${tableName}`);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: any) {
        console.error(`Error clearing table ${tableName}:`, error);
        return { success: false, error: error.message };
    }
}


export async function importDatabase(jsonData: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = JSON.parse(jsonData) as Record<string, any[]>;

    for (const tableName of Object.keys(data)) {
        if (!TABLES_TO_MANAGE.includes(tableName)) {
            console.warn(`Skipping import for unmanaged table: ${tableName}`);
            continue;
        }

        const tableData = data[tableName];
        if (!Array.isArray(tableData)) {
            console.warn(`Skipping import for ${tableName}: data is not an array.`);
            continue;
        }

        // Clear existing table
        await db.query(`DELETE FROM ${tableName}`);

        // Add new data
        for (const row of tableData) {
            const cleanRow: Record<string, any> = {};
            for (const key in row) {
                if (row[key] !== undefined) {
                    // Stringify JSON columns for safety, mysql2 might handle it but this is more explicit
                    // Most tables have JSON columns in MySQL schema.
                    if (typeof row[key] === 'object' && row[key] !== null) {
                        cleanRow[key] = JSON.stringify(row[key]);
                    } else {
                        cleanRow[key] = row[key];
                    }
                }
            }
            await db.query(`INSERT INTO ${tableName} SET ?`, [cleanRow]);
        }
    }

    // Revalidate all paths to reflect changes
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error("Error importing database:", error);
    if (error instanceof SyntaxError) {
        return { success: false, error: "Invalid JSON file format." };
    }
    return { success: false, error: `Failed to import database: ${error.message}` };
  }
}
