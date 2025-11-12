import { supabase } from './supabase';

export interface HomepageSection {
  id: string;
  type: 'hero' | 'features' | 'stats' | 'camps';
  title: string | null;
  subtitle: string | null;
  content: any;
  order: number;
  is_visible: boolean;
}

export async function getHomepageSections() {
  try {
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('is_visible', true)
      .order('order');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    return { data: null, error };
  }
}

export async function updateHomepageSection(id: string, updates: Partial<HomepageSection>) {
  try {
    const { data, error } = await supabase
      .from('homepage_sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating homepage section:', error);
    return { data: null, error };
  }
}

export async function updateHomepageImage(sectionId: string, imageUrl: string, alt?: string) {
  try {
    const { data, error } = await supabase
      .from('homepage_images')
      .upsert({
        section_id: sectionId,
        url: imageUrl,
        alt: alt || ''
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating homepage image:', error);
    return { data: null, error };
  }
}