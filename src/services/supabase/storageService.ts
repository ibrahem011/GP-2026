import { deleteImage, isMockModeEnabled, supabase, uploadImage } from './client';

export function createStorageService() {
    async function uploadPropertyImages(files: File[], userId: string): Promise<string[]> {
        if (isMockModeEnabled()) {
            return files.map(() => `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=800&q=80`);
        }

        // ⚡ Bolt: Parallelize image uploads using Promise.all
        // This reduces total I/O wait time from O(N) to roughly O(1) for multiple images
        try {
            const uploadPromises = files.map((file) => uploadImage(file, `${userId}/`));
            return await Promise.all(uploadPromises);
        } catch (error) {
            console.error('Error uploading image(s):', error);
            throw error;
        }
    }

    async function deletePropertyImage(url: string): Promise<void> {
        if (isMockModeEnabled()) return;
        await deleteImage(url);
    }

    async function uploadVoiceNote(audioBlob: Blob, conversationId: string): Promise<string> {
        if (isMockModeEnabled()) {
            return 'https://example.com/mock-voice.mp3';
        }

        const filename = `${conversationId}_${Date.now()}.webm`;
        const { error } = await supabase.storage
            .from('voice-notes')
            .upload(filename, audioBlob, { contentType: 'audio/webm' });

        if (error) throw new Error(`ظپط´ظ„ ط±ظپط¹ ط§ظ„ط±ط³ط§ظ„ط© ط§ظ„طµظˆطھظٹط©: ${error.message}`);

        const { data: { publicUrl } } = supabase.storage
            .from('voice-notes')
            .getPublicUrl(filename);

        return publicUrl;
    }

    async function uploadChatImage(imageFile: File, conversationId: string): Promise<string> {
        if (isMockModeEnabled()) {
            return 'https://example.com/mock-image.jpg';
        }

        const fileExt = imageFile.name.split('.').pop();
        const filename = `${conversationId}_${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage
            .from('chat-images')
            .upload(filename, imageFile);

        if (error) throw new Error(`ظپط´ظ„ ط±ظپط¹ ط§ظ„طµظˆط±ط©: ${error.message}`);

        const { data: { publicUrl } } = supabase.storage
            .from('chat-images')
            .getPublicUrl(filename);

        return publicUrl;
    }

    async function uploadMedia(file: File, type: 'image' | 'voice', conversationId: string): Promise<string> {
        if (type === 'image') {
            return uploadChatImage(file, conversationId);
        }

        return uploadVoiceNote(file, conversationId);
    }

    async function uploadPaymentReceipt(
        bookingId: string,
        receiptFile: File
    ): Promise<{ url: string | null; error: any }> {
        if (isMockModeEnabled()) {
            return {
                url: 'https://example.com/receipt.jpg',
                error: null
            };
        }

        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${bookingId}_${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage
            .from('payment-receipts')
            .upload(fileName, receiptFile);

        if (error) return { url: null, error };

        const { data: { publicUrl } } = supabase.storage
            .from('payment-receipts')
            .getPublicUrl(fileName);

        await supabase
            .from('bookings')
            .update({ payment_proof: publicUrl })
            .eq('id', bookingId);

        return { url: publicUrl, error: null };
    }

    return {
        uploadPropertyImages,
        deletePropertyImage,
        uploadVoiceNote,
        uploadChatImage,
        uploadMedia,
        uploadPaymentReceipt,
    };
}
