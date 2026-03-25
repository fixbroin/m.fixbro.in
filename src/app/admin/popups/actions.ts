'use server';

import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { uploadFile as libUploadFile, deleteFile as libDeleteFile } from '@/lib/storage-actions';

export async function uploadFile(formData: FormData) {
    return await libUploadFile(formData, 'popups');
}

export async function deleteFile(url: string) {
    return await libDeleteFile(url);
}

export async function getPopups() {
    try {
        const results = await query('SELECT * FROM popups ORDER BY created_at DESC');
        return results as any[];
    } catch (error) {
        console.error('Error fetching popups:', error);
        return [];
    }
}

export async function getPopupById(id: string) {
    try {
        const results = await query('SELECT * FROM popups WHERE id = ?', [id]);
        return (results as any[])[0] || null;
    } catch (error) {
        console.error('Error fetching popup by id:', error);
        return null;
    }
}

export async function savePopup(data: any) {
    const {
        id,
        name,
        type,
        trigger_type,
        trigger_value,
        pages,
        devices,
        title,
        description,
        media_type,
        media_url,
        cta_text,
        cta_link,
        show_form,
        form_fields,
        frequency,
        is_active
    } = data;

    const popupId = id || uuidv4();
    const pagesJson = JSON.stringify(pages || ['all']);
    const formFieldsJson = JSON.stringify(form_fields || { name: false, email: false, phone: false });

    try {
        if (id) {
            await query(
                `UPDATE popups SET 
                name = ?, type = ?, trigger_type = ?, trigger_value = ?, 
                pages = ?, devices = ?, title = ?, description = ?, 
                media_type = ?, media_url = ?, cta_text = ?, cta_link = ?, 
                show_form = ?, form_fields = ?, frequency = ?, is_active = ?
                WHERE id = ?`,
                [
                    name, type, trigger_type, trigger_value, 
                    pagesJson, devices, title, description, 
                    media_type, media_url, cta_text, cta_link, 
                    show_form, formFieldsJson, frequency, is_active, 
                    id
                ]
            );
        } else {
            await query(
                `INSERT INTO popups (
                    id, name, type, trigger_type, trigger_value, 
                    pages, devices, title, description, 
                    media_type, media_url, cta_text, cta_link, 
                    show_form, form_fields, frequency, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    popupId, name, type, trigger_type, trigger_value, 
                    pagesJson, devices, title, description, 
                    media_type, media_url, cta_text, cta_link, 
                    show_form, formFieldsJson, frequency, is_active
                ]
            );
        }
        revalidatePath('/admin/popups');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error saving popup:', error);
        return { success: false, error };
    }
}

export async function deletePopup(id: string) {
    try {
        const popup = await getPopupById(id);
        if (popup && popup.media_url) {
            await libDeleteFile(popup.media_url);
        }

        await query('DELETE FROM popups WHERE id = ?', [id]);
        revalidatePath('/admin/popups');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error deleting popup:', error);
        return { success: false, error };
    }
}

export async function togglePopupStatus(id: string, isActive: boolean) {
    try {
        await query('UPDATE popups SET is_active = ? WHERE id = ?', [isActive, id]);
        revalidatePath('/admin/popups');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error toggling popup status:', error);
        return { success: false, error };
    }
}

export async function getActivePopups() {
    try {
        const results = await query('SELECT * FROM popups WHERE is_active = TRUE');
        return results as any[];
    } catch (error) {
        console.error('Error fetching active popups:', error);
        return [];
    }
}

export async function getPopupLeads() {
    try {
        const results = await query(`
            SELECT pl.*, p.name as popup_name 
            FROM popup_leads pl 
            LEFT JOIN popups p ON pl.popup_id = p.id 
            ORDER BY pl.created_at DESC
        `);
        return results as any[];
    } catch (error) {
        console.error('Error fetching popup leads:', error);
        return [];
    }
}

export async function deleteLead(id: string) {
    try {
        await query('DELETE FROM popup_leads WHERE id = ?', [id]);
        revalidatePath('/admin/popups');
        return { success: true };
    } catch (error) {
        console.error('Error deleting lead:', error);
        return { success: false, error };
    }
}

export async function submitPopupLead(data: any) {
    const { popup_id, name, email, phone, page_url } = data;
    const id = uuidv4();

    try {
        await query(
            'INSERT INTO popup_leads (id, popup_id, name, email, phone, page_url) VALUES (?, ?, ?, ?, ?, ?)',
            [id, popup_id, name, email, phone, page_url]
        );
        return { success: true };
    } catch (error) {
        console.error('Error submitting popup lead:', error);
        return { success: false, error };
    }
}
