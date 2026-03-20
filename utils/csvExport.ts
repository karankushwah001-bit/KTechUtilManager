import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

function webDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function saveAndShare(
  filename: string,
  content: string,
  mimeType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      return { success: false, error: 'FileSystem not available on this device.' };
    }
    const fileUri = cacheDir + filename;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { success: false, error: 'Sharing not available on this device.' };
    }
    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle: `Save ${filename}`,
      UTI: mimeType,
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

export async function exportUsersCSV(users: any[]): Promise<string> {
  const header = 'name,phone,email,address';
  const rows = users.map(u =>
    [u.name, u.phone, u.email, u.address]
      .map(v => `"${(v || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...rows].join('\n');
}

export async function exportSIMsCSV(sims: any[]): Promise<string> {
  const header = 'userId,vendor,number,plan,planType,purchaseDate,nextBillingDate,reminderDate,dueDate,status,amount';
  const rows = sims.map(s =>
    [s.userId, s.vendor, s.number, s.plan, s.planType,
     s.purchaseDate, s.nextBillingDate, s.reminderDate, s.dueDate, s.status, s.amount]
      .map(v => `"${(v || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...rows].join('\n');
}

export async function exportPasswordsCSV(passwords: any[]): Promise<string> {
  const header = 'userId,title,username,password,url,notes';
  const rows = passwords.map(p =>
    [p.userId, p.title, p.username, p.password, p.url, p.notes]
      .map(v => `"${(v || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...rows].join('\n');
}

export async function saveFileToDownloads(
  filename: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  if (Platform.OS === 'web') {
    try {
      webDownload(filename, content);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  }
  const mime = filename.endsWith('.json') ? 'application/json' : 'text/csv';
  return saveAndShare(filename, content, mime);
}

export async function saveBackupFile(
  content: string
): Promise<{ success: boolean; error?: string }> {
  const filename = `KTech_Backup_${new Date().toISOString().split('T')[0]}.json`;
  if (Platform.OS === 'web') {
    try {
      webDownload(filename, content);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  }
  return saveAndShare(filename, content, 'application/json');
}
