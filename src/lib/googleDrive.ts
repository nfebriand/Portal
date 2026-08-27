import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const driveProvider = new GoogleAuthProvider();
driveProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (Do NOT store in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveUploadResult {
  fileId: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  directImageUrl: string;
  thumbnailUrl?: string;
}

/**
 * Initialize Google Drive auth listener
 */
export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Connect to Google Drive via popup
 */
export const connectGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token otorisasi dari Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive Auth Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token
 */
export const getDriveAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Set token manually if needed
 */
export const setCachedDriveToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Disconnect Google Drive
 */
export const disconnectGoogleDrive = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Convert base64 data URL to Blob
 */
export function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Upload image (File or Blob or Base64) to Google Drive
 */
export async function uploadImageToGoogleDrive(
  fileOrDataUrl: File | Blob | string,
  fileName: string,
  token?: string
): Promise<DriveUploadResult> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) {
    throw new Error('Akses Google Drive belum terhubung. Silakan hubungkan Google Drive terlebih dahulu.');
  }

  let blob: Blob;
  let contentType = 'image/png';

  if (typeof fileOrDataUrl === 'string') {
    blob = dataURLtoBlob(fileOrDataUrl);
    contentType = blob.type || 'image/png';
  } else {
    blob = fileOrDataUrl;
    contentType = fileOrDataUrl.type || 'image/png';
  }

  // Create multipart body
  const metadata = {
    name: fileName,
    mimeType: contentType,
    description: 'Peta Komando Branding Asset',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeader = `${delimiter}Content-Type: ${contentType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`;

  // Read blob as base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const multipartRequestBody = metadataPart + fileHeader + base64Data + closeDelimiter;

  const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!uploadResponse.ok) {
    const errorJson = await uploadResponse.json().catch(() => ({}));
    throw new Error(`Google Drive Upload Error: ${errorJson?.error?.message || uploadResponse.statusText}`);
  }

  const uploadedFile = await uploadResponse.json();
  const fileId = uploadedFile.id;

  // Make the file publicly readable with link so that direct image embedding works
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permError) {
    console.warn('Could not set public permission on Drive file:', permError);
  }

  const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

  return {
    fileId,
    name: uploadedFile.name || fileName,
    webViewLink: uploadedFile.webViewLink,
    webContentLink: uploadedFile.webContentLink,
    thumbnailUrl: uploadedFile.thumbnailLink,
    directImageUrl,
  };
}
