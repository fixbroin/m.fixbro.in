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
    'page_seo',
    'popups',
    'popup_leads'
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
        // Disable foreign key checks temporarily to clear tables with relationships
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query(`DELETE FROM ${tableName}`);
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: any) {
        console.error(`Error clearing table ${tableName}:`, error);
        // Ensure FK checks are re-enabled even on error
        try { await db.query('SET FOREIGN_KEY_CHECKS = 1'); } catch (e) {}
        return { success: false, error: error.message };
    }
}


export async function importDatabase(jsonData: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = JSON.parse(jsonData) as Record<string, any[]>;

    // Disable foreign key checks for the duration of the import
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

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
                const value = row[key];
                if (value !== undefined && value !== null) {
                    // Convert ISO strings (e.g., 2026-03-24T05:23:51.000Z) back to MySQL format (2026-03-24 05:23:51)
                    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
                        cleanRow[key] = value.slice(0, 19).replace('T', ' ');
                    } else if (typeof value === 'object') {
                        // Stringify JSON columns for safety
                        cleanRow[key] = JSON.stringify(value);
                    } else {
                        cleanRow[key] = value;
                    }
                } else if (value === null) {
                    cleanRow[key] = null;
                }
            }
            
            if (Object.keys(cleanRow).length > 0) {
              await db.query(`INSERT INTO ${tableName} SET ?`, [cleanRow]);
            }
        }
    }

    // Re-enable foreign key checks
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    // Revalidate all paths to reflect changes
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    // Ensure FK checks are re-enabled even on error
    try { await db.query('SET FOREIGN_KEY_CHECKS = 1'); } catch (e) {}
    
    console.error("Error importing database:", error);
    if (error instanceof SyntaxError) {
        return { success: false, error: "Invalid JSON file format." };
    }
    return { success: false, error: `Failed to import database: ${error.message}` };
  }
}
