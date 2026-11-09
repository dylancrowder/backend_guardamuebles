import { randomUUID } from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CustomerModel } from './customers.model';
import { ClientPhotoModel } from './client-photos.model';
import { env } from '../../config/env';

const CLIENT_PHOTOS_BUCKET = 'client-photos';
let supabaseClient: SupabaseClient | undefined;

const getSupabaseClient = () => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error('Supabase no está configurado: define SUPABASE_URL y SUPABASE_SECRET_KEY');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }

  return supabaseClient;
};

const uploadToSupabase = async (buffer: Buffer, contentType: string, extension: string) => {
  const client = getSupabaseClient();
  const storagePath = `${randomUUID()}.${extension}`;
  const { error } = await client.storage
    .from(CLIENT_PHOTOS_BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: false });

  if (error) throw error;

  const { data } = client.storage.from(CLIENT_PHOTOS_BUCKET).getPublicUrl(storagePath);
  return { storagePath, url: data.publicUrl };
};

export const clientPhotosService = {
  list: async (clientId: string) => {
    const client = await CustomerModel.findOne({ _id: clientId, deletedAt: null }).select('_id');
    if (!client) return null;

    const photos = await ClientPhotoModel.find({ clientId }).sort({ createdAt: -1 }).lean();
    return photos.flatMap((photo) => {
      const url = photo.url || photo.secure_url;
      return url ? [{ id: photo._id.toString(), url }] : [];
    });
  },

  create: async (clientId: string, buffer: Buffer, contentType: string, extension: string) => {
    const client = await CustomerModel.findOne({ _id: clientId, deletedAt: null }).select('_id');
    if (!client) return null;

    const upload = await uploadToSupabase(buffer, contentType, extension);
    try {
      const photo = await ClientPhotoModel.create({
        clientId: client._id,
        storagePath: upload.storagePath,
        url: upload.url,
        format: extension
      });

      return { id: photo._id.toString(), url: photo.url };
    } catch (databaseError) {
      try {
        const { error } = await getSupabaseClient().storage
          .from(CLIENT_PHOTOS_BUCKET)
          .remove([upload.storagePath]);
        if (error) throw error;
      } catch (cleanupError) {
        console.error('No se pudo limpiar la foto huérfana de Supabase Storage:', cleanupError);
      }
      throw databaseError;
    }
  }
};
