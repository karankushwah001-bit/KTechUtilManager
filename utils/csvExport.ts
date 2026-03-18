import { Platform } from 'react-native';
import { PasswordEntry, SIMCard, User } from '@/context/AppContext';

function escapeCSV(value: string | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSVRow(fields: string[]): string {
  return fields.map(escapeCSV).join(',');
}

export function buildUsersCSV(users: User[]): string {
  const header = 'name,phone,email,address,createdAt';
  const rows = users.map(u =>
    toCSVRow([u.name, u.phone, u.email, u.address, u.createdAt])
  );
  return [header, ...rows].join('\n');
}

export function buildSIMsCSV(sims: SIMCard[]): string {
  const header = 'userId,vendor,number,plan,planType,purchaseDate,nextBillingDate,reminderDate,dueDate,status,amount,createdAt';
  const rows = sims.map(s =>
    toCSVRow([
      s.userId,
      s.vendor,
      s.number,
      s.plan,
      s.planType || 'monthly',
      s.purchaseDate || '',
      s.nextBillingDate || s.dueDate || '',
      s.reminderDate || '',
      s.dueDate || '',
      s.status,
      s.amount,
      s.createdAt,
    ])
  );
  return [header, ...rows].join('\n');
}

export function buildPasswordsCSV(passwords: PasswordEntry[]): string {
  const header = 'userId,title,username,password,url,notes,createdAt';
  const rows = passwords.map(p =>
    toCSVRow([p.userId, p.title, p.username, p.password, p.url, p.notes, p.createdAt])
  );
  return [header, ...rows].join('\n');
}

export async function exportUsersCSV(users: User[]): Promise<string> {
  return buildUsersCSV(users);
}

export async function exportSIMsCSV(sims: SIMCard[]): Promise<string> {
  return buildSIMsCSV(sims);
}

export async function exportPasswordsCSV(passwords: PasswordEntry[]): Promise<string> {
  return buildPasswordsCSV(passwords);
}

function webDownload(filename: string, content: string, mimeType: string = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function saveFileToDownloads(filename: string, content: string): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    if (Platform.OS === 'web') {
      webDownload(filename, content, 'text/csv;charset=utf-8;');
      return { success: true, path: filename };
    }

    const { default: FileSystem } = await import('expo-file-system');
    const { default: MediaLibrary } = await import('expo-media-library');
    const { default: Sharing } = await import('expo-sharing');

    const tempUri = (FileSystem.cacheDirectory ?? '') + filename;
    await FileSystem.writeAsStringAsync(tempUri, content, { encoding: FileSystem.EncodingType.UTF8 });

    if (Platform.OS === 'android') {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(tempUri, {
            mimeType: 'text/csv',
            dialogTitle: `Save ${filename}`,
            UTI: 'public.comma-separated-values-text',
          });
          return { success: true, path: 'shared' };
        }
        return { success: false, error: 'Storage permission denied. Please grant permission in Settings.' };
      }
      const asset = await MediaLibrary.createAssetAsync(tempUri);
      let album = await MediaLibrary.getAlbumAsync('Download');
      if (!album) {
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      return { success: true, path: asset.uri };
    } else {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(tempUri, {
          mimeType: 'text/csv',
          dialogTitle: `Save ${filename}`,
          UTI: 'public.comma-separated-values-text',
        });
        return { success: true, path: tempUri };
      }
      return { success: false, error: 'Sharing not available on this device.' };
    }
  } catch (err: any) {
    console.error('Export error:', err);
    return { success: false, error: err?.message || 'Unknown error during export' };
  }
}

export async function saveBackupFile(content: string): Promise<{ success: boolean; path?: string; error?: string }> {
  const filename = `ktutil_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  try {
    if (Platform.OS === 'web') {
      webDownload(filename, content, 'application/json');
      return { success: true, path: filename };
    }

    const { default: FileSystem } = await import('expo-file-system');
    const { default: MediaLibrary } = await import('expo-media-library');
    const { default: Sharing } = await import('expo-sharing');

    const tempUri = (FileSystem.cacheDirectory ?? '') + filename;
    await FileSystem.writeAsStringAsync(tempUri, content, { encoding: FileSystem.EncodingType.UTF8 });

    if (Platform.OS === 'android') {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(tempUri, { mimeType: 'application/json', dialogTitle: 'Save Backup' });
          return { success: true, path: 'shared' };
        }
        return { success: false, error: 'Storage permission denied' };
      }
      const asset = await MediaLibrary.createAssetAsync(tempUri);
      let album = await MediaLibrary.getAlbumAsync('Download');
      if (!album) {
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      return { success: true, path: asset.uri };
    } else {
      await Sharing.shareAsync(tempUri, { mimeType: 'application/json', dialogTitle: 'Save Backup' });
      return { success: true, path: tempUri };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Backup failed' };
  }
}
