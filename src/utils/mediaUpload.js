import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export const validateMediaFile = (file) => {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload images (JPG, PNG, WebP, GIF) or videos (MP4, WebM, MOV).',
    };
  }

  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / 1024 / 1024;
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit.`,
    };
  }

  return { valid: true, type: isImage ? 'image' : 'video' };
};

export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

export const generateVideoThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.currentTime = 1;
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
          video.src = '';
        },
        'image/jpeg',
        0.8
      );
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };

    const url = URL.createObjectURL(file);
    video.src = url;
  });
};

export const uploadUnitMedia = async (unitId, file, userId, onProgress) => {
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const timestamp = Date.now();
  const sanitizedName = sanitizeFilename(file.name);
  const mediaType = validation.type;
  const folderPath = mediaType === 'image' ? 'images' : 'videos';
  const storagePath = `units/${unitId}/${folderPath}/${timestamp}_${sanitizedName}`;

  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          let thumbnailUrl = null;
          if (mediaType === 'video') {
            try {
              const thumbnailBlob = await generateVideoThumbnail(file);
              const thumbnailPath = `units/${unitId}/thumbnails/${timestamp}_${sanitizedName}.jpg`;
              const thumbnailRef = ref(storage, thumbnailPath);
              await uploadBytesResumable(thumbnailRef, thumbnailBlob);
              thumbnailUrl = await getDownloadURL(thumbnailRef);
            } catch (error) {
              console.error('Failed to generate video thumbnail:', error);
            }
          }

          const mediaData = {
            id: `${timestamp}_${sanitizedName}`,
            url: downloadURL,
            type: mediaType,
            thumbnailUrl,
            storagePath,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            isPrimary: false,
            order: timestamp,
            caption: '',
          };

          resolve(mediaData);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const addMediaToUnit = async (unitId, mediaData) => {
  try {
    const unitRef = doc(db, 'units', unitId);
    await updateDoc(unitRef, {
      media: arrayUnion(mediaData),
    });
    return true;
  } catch (error) {
    console.error('Error adding media to unit:', error);
    throw error;
  }
};

export const removeMediaFromUnit = async (unitId, mediaData) => {
  try {
    const unitRef = doc(db, 'units', unitId);
    await updateDoc(unitRef, {
      media: arrayRemove(mediaData),
    });
    return true;
  } catch (error) {
    console.error('Error removing media from unit:', error);
    throw error;
  }
};

export const deleteUnitMedia = async (unitId, mediaData) => {
  try {
    const storageRef = ref(storage, mediaData.storagePath);
    await deleteObject(storageRef);

    if (mediaData.thumbnailUrl && mediaData.type === 'video') {
      const thumbnailPath = mediaData.storagePath.replace(/videos\//, 'thumbnails/').replace(/\.(mp4|webm|mov)$/, '.jpg');
      const thumbnailRef = ref(storage, thumbnailPath);
      try {
        await deleteObject(thumbnailRef);
      } catch (error) {
        console.warn('Thumbnail deletion failed:', error);
      }
    }

    await removeMediaFromUnit(unitId, mediaData);
    return true;
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};

export const updateMediaMetadata = async (unitId, oldMediaData, newMediaData) => {
  try {
    const unitRef = doc(db, 'units', unitId);
    await updateDoc(unitRef, {
      media: arrayRemove(oldMediaData),
    });
    await updateDoc(unitRef, {
      media: arrayUnion(newMediaData),
    });
    return true;
  } catch (error) {
    console.error('Error updating media metadata:', error);
    throw error;
  }
};

export const setPrimaryMedia = async (unitId, mediaArray, mediaId) => {
  try {
    const updatedMedia = mediaArray.map((item) => ({
      ...item,
      isPrimary: item.id === mediaId,
    }));

    const unitRef = doc(db, 'units', unitId);
    await updateDoc(unitRef, {
      media: updatedMedia,
    });
    return true;
  } catch (error) {
    console.error('Error setting primary media:', error);
    throw error;
  }
};

export const reorderMedia = async (unitId, mediaArray) => {
  try {
    const unitRef = doc(db, 'units', unitId);
    await updateDoc(unitRef, {
      media: mediaArray,
    });
    return true;
  } catch (error) {
    console.error('Error reordering media:', error);
    throw error;
  }
};
