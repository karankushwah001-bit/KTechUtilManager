import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
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
  const rows = users.map(u => toCSVRow([u.name, u.phone, u.email, u.address, u.createdAt]));
  return [header, ...rows].join('\n');
}

export function buildSIMsCSV(sims: SIMCard[]): string {
  const header = 'userId,vendor,number,plan,planType,purchaseDate,nextBillingDate,reminderDate,dueDate,status,amount,createdAt';
  const rows = sims.map(s => toCSVRow([
    s.userId, s.vendor, s.number, s.plan, s.planType || 'monthly',
    s.purchaseDate || '', s.nextBillingDate || s.dueDate || '',
    s.reminderDate || '', s.dueDate || '', s.status, s.amount, s.createdAt,
  ]));
  return [header, ...rows].join('\n');
}

export function buildPasswordsCSV(passwords: PasswordEntry[]): string {
  const header = 'userId,title,username,password,url,notes,createdAt';
  const rows = passwords.map(p => toCSVRow([p.userId, p.title, p.username, p.password, p.url, p.notes, p.createdAt]));
  return [header, ...rows].join('\n');
}

export async function exportUsersCSV(users: User[]): Promise<string> { return buildUsersCSV(users); }
export async function exportSIMsCSV(sims: SIMCard[]): Promise<string> { return buildSIMsCSV(sims); }
export async function exportPasswordsCSV(passwords: PasswordEntry[]): Promise<string> { return buildPasswordsCSV(passwords); }

function webDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function shareFile(filename: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return { success: false, error: 'FileSystem not available' };
    const fileUri = cacheDir + filename;
    await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: `Save ${filename}` });
      return { success: true };
    }
    return { success: false, error: 'Sharing not available' };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

export async function saveFileToDownloads(
  filename: string,
  content: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  if (Platform.OS === 'web') {
    webDownload(filename, content);
    return { success: true };
  }
  return shareFile(filename, content);
}

export async function saveBackupFile(
  content: string
): Promise<{ success: boolean; error?: string }> {
  const filename = `KTech_Backup_${new Date().toISOString().split('T')[0]}.json`;
  if (Platform.OS === 'web') {
    webDownload(filename, content);
    return { success: true };
  }
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return { success: false, error: 'FileSystem not available' };
    const fileUri = cacheDir + filename;
    await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Save Backup' });
      return { success: true };
    }
    return { success: false, error: 'Sharing not available' };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Unknown error' };
  }
}
