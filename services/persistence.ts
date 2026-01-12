
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const DB_NAME = 'PixshopDB';
const DB_VERSION = 1;
const STORE_NAME = 'history';

// Helper: Convert Data URL to Blob for efficient binary storage
const dataUrlToBlob = (dataUrl: string): Blob => {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Failed to convert data URL to blob:", e);
    return new Blob([], { type: 'image/png' });
  }
};

// Helper: Base64 to File (Migration Fallback)
const base64ToFile = (dataurl: string, filename: string, mimeType: string, lastModified: number): File => {
    if (!dataurl || !dataurl.includes(',')) {
        return new File([""], filename, {type: mimeType || 'application/octet-stream', lastModified: lastModified});
    }
    const blob = dataUrlToBlob(dataurl);
    return new File([blob], filename, {type: mimeType, lastModified: lastModified});
}

interface SerializedFile {
    name: string;
    type: string;
    lastModified: number;
    data: Blob | string; // Use Blob for binary efficiency
    isUrl?: boolean;
}

// Internal storage format
interface StoredAppState {
    id: string; // 'current'
    history: SerializedFile[];
    historyIndex: number;
    activeTab: string;
    hakiEnabled?: boolean;
    hakiColor?: string;
    hakiSize?: number;
    hakiSpeed?: number;
    isPlatinumTier?: boolean;
    timestamp: number;
}

// Public Interface used by the App
interface AppState {
    history: (File | string)[];
    historyIndex: number;
    activeTab: string;
    hakiEnabled?: boolean;
    hakiColor?: string;
    hakiSize?: number;
    hakiSpeed?: number;
    isPlatinumTier?: boolean;
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

export const saveState = async (
    history: (File | string)[], 
    historyIndex: number, 
    activeTab: string, 
    hakiEnabled: boolean,
    hakiColor: string = '#DB24E3',
    hakiSize: number = 1,
    hakiSpeed: number = 1,
    isPlatinumTier: boolean = true
): Promise<void> => {
    try {
        const serializedHistory: SerializedFile[] = history.map((item) => {
            if (typeof item === 'string') {
                if (item.startsWith('data:')) {
                    // Convert large data URLs to binary Blobs to save space and avoid string limits
                    const blob = dataUrlToBlob(item);
                    return {
                        name: `generated-${Date.now()}.png`,
                        type: blob.type,
                        lastModified: Date.now(),
                        data: blob,
                        isUrl: false,
                    };
                }
                return {
                    name: 'remote-url',
                    type: 'application/octet-stream',
                    lastModified: Date.now(),
                    data: item,
                    isUrl: true,
                };
            }
            // Item is already a File object (binary)
            return {
                name: item.name,
                type: item.type,
                lastModified: item.lastModified,
                data: item,
                isUrl: false,
            };
        });

        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        const state: StoredAppState = {
            id: 'current',
            history: serializedHistory,
            historyIndex,
            activeTab,
            hakiEnabled,
            hakiColor,
            hakiSize,
            hakiSpeed,
            isPlatinumTier,
            timestamp: Date.now()
        };

        const request = store.put(state);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error("IndexedDB Put Error:", request.error);
                reject(request.error);
            };
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("Persistence save failed:", e instanceof Error ? e.message : e);
    }
};

export const loadState = async (): Promise<AppState | null> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get('current');

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const result = request.result as StoredAppState | undefined;
                if (result) {
                    const history = result.history.map(f => {
                        if (f.isUrl) {
                            return f.data as string;
                        }
                        
                        // Migration and Reconstruction logic
                        if (typeof f.data === 'string') {
                            // Support legacy Base64 stored data
                            return base64ToFile(f.data, f.name, f.type, f.lastModified);
                        }
                        
                        // New binary Blob/File storage
                        return new File([f.data as Blob], f.name, { 
                            type: f.type, 
                            lastModified: f.lastModified 
                        });
                    });

                    resolve({
                        history: history,
                        historyIndex: result.historyIndex,
                        activeTab: result.activeTab,
                        hakiEnabled: result.hakiEnabled,
                        hakiColor: result.hakiColor ?? '#DB24E3',
                        hakiSize: result.hakiSize ?? 1,
                        hakiSpeed: result.hakiSpeed ?? 1,
                        isPlatinumTier: result.isPlatinumTier ?? true
                    });
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("Persistence load failed:", e instanceof Error ? e.message : e);
        return null;
    }
};

export const clearState = async (): Promise<void> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete('current');
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
         console.error("Persistence clear failed:", e);
         throw e;
    }
};

export const nukeDatabase = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => {
            console.error("Failed to delete DB", req.error);
            resolve();
        };
        req.onblocked = () => {
            console.warn("Delete DB blocked");
            resolve();
        };
    });
};
