import { Platform } from 'react-native';
import { PasswordEntry, SIMCard, User } from '@/context/AppContext';
import { PlanType, calculateNextBillingDate, calculateReminderDate, todayStr } from '@/utils/billing';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim().replace(/\s/g, ''));
  const rows = lines.slice(1).map(l => parseCSVLine(l));
  return { headers, rows };
}

function webFilePicker(accept: string): Promise<{ content: string; name: string } | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { document.body.removeChild(input); resolve(null); return; }
      const reader = new FileReader();
      reader.onload = e => {
        document.body.removeChild(input);
        resolve({ content: e.target?.result as string, name: file.name });
      };
      reader.onerror = () => { document.body.removeChild(input); resolve(null); };
      reader.readAsText(file);
    };
    input.oncancel = () => { document.body.removeChild(input); resolve(null); };
    input.click();
  });
}

export async function pickAndReadCSV(): Promise<{ content: string; name: string } | null> {
  if (Platform.OS === 'web') {
    return webFilePicker('.csv,.txt,text/csv,text/plain');
  }
  const DocumentPicker = await import('expo-document-picker');
  const FileSystem = await import('expo-file-system');
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const content = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
  return { content, name: asset.name || 'file.csv' };
}

export async function pickAndReadJSON(): Promise<{ content: string; name: string } | null> {
  if (Platform.OS === 'web') {
    return webFilePicker('.json,application/json,text/plain');
  }
  const DocumentPicker = await import('expo-document-picker');
  const FileSystem = await import('expo-file-system');
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const content = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
  return { content, name: asset.name || 'backup.json' };
}

export type ImportType = 'users' | 'sims' | 'passwords' | 'unknown';

export function detectCSVType(content: string): ImportType {
  const { headers } = parseCSV(content);
  const h = headers.join(',');
  if (h.includes('name') && h.includes('phone') && h.includes('email')) return 'users';
  if (h.includes('vendor') && h.includes('number') && (h.includes('duedate') || h.includes('nextbillingdate') || h.includes('plantype'))) return 'sims';
  if (h.includes('title') && h.includes('username') && h.includes('password')) return 'passwords';
  return 'unknown';
}

export function parseUsersCSV(content: string): Omit<User, 'id' | 'createdAt'>[] {
  const { headers, rows } = parseCSV(content);
  const idx = (key: string) => headers.indexOf(key);
  const nameIdx = idx('name');
  const phoneIdx = idx('phone');
  const emailIdx = idx('email');
  const addressIdx = idx('address');
  if (nameIdx === -1 || phoneIdx === -1) throw new Error('Invalid Users CSV: missing required columns (name, phone)');
  return rows.map(row => ({
    name: row[nameIdx] || '',
    phone: row[phoneIdx] || '',
    email: emailIdx >= 0 ? (row[emailIdx] || '') : '',
    address: addressIdx >= 0 ? (row[addressIdx] || '') : '',
  })).filter(u => u.name.length > 0);
}

export function parseSIMsCSV(content: string): Omit<SIMCard, 'id' | 'createdAt'>[] {
  const { headers, rows } = parseCSV(content);
  const idx = (key: string) => headers.indexOf(key);
  const vendorIdx = idx('vendor');
  const numberIdx = idx('number');
  const planIdx = idx('plan');
  const planTypeIdx = idx('plantype');
  const purchaseDateIdx = idx('purchasedate');
  const nextBillingIdx = idx('nextbillingdate');
  const reminderIdx = idx('reminderdate');
  const dueDateIdx = idx('duedate');
  const statusIdx = idx('status');
  const amountIdx = idx('amount');
  const userIdIdx = idx('userid');
  if (vendorIdx === -1 || numberIdx === -1) throw new Error('Invalid SIMCards CSV: missing required columns (vendor, number)');
  return rows.map(row => {
    const planType = (planTypeIdx >= 0 ? row[planTypeIdx] : 'monthly') as PlanType;
    const purchaseDate = purchaseDateIdx >= 0 && row[purchaseDateIdx] ? row[purchaseDateIdx] : todayStr();
    const nextBillingDate = nextBillingIdx >= 0 && row[nextBillingIdx]
      ? row[nextBillingIdx]
      : (dueDateIdx >= 0 && row[dueDateIdx] ? row[dueDateIdx] : calculateNextBillingDate(purchaseDate, planType));
    const reminderDate = reminderIdx >= 0 && row[reminderIdx]
      ? row[reminderIdx]
      : calculateReminderDate(nextBillingDate);
    return {
      userId: userIdIdx >= 0 ? (row[userIdIdx] || '') : '',
      vendor: row[vendorIdx] || '',
      number: row[numberIdx] || '',
      plan: planIdx >= 0 ? (row[planIdx] || '') : '',
      planType,
      purchaseDate,
      nextBillingDate,
      reminderDate,
      dueDate: nextBillingDate,
      status: (statusIdx >= 0 && row[statusIdx] ? row[statusIdx] : 'active') as 'active' | 'inactive' | 'expired',
      amount: amountIdx >= 0 ? (row[amountIdx] || '0') : '0',
    };
  }).filter(s => s.vendor.length > 0);
}

export function parsePasswordsCSV(content: string): Omit<PasswordEntry, 'id' | 'createdAt'>[] {
  const { headers, rows } = parseCSV(content);
  const idx = (key: string) => headers.indexOf(key);
  const titleIdx = idx('title');
  const usernameIdx = idx('username');
  const passwordIdx = idx('password');
  const urlIdx = idx('url');
  const notesIdx = idx('notes');
  const userIdIdx = idx('userid');
  if (titleIdx === -1 || passwordIdx === -1) throw new Error('Invalid Passwords CSV: missing required columns (title, password)');
  return rows.map(row => ({
    userId: userIdIdx >= 0 ? (row[userIdIdx] || '') : '',
    title: row[titleIdx] || '',
    username: usernameIdx >= 0 ? (row[usernameIdx] || '') : '',
    password: row[passwordIdx] || '',
    url: urlIdx >= 0 ? (row[urlIdx] || '') : '',
    notes: notesIdx >= 0 ? (row[notesIdx] || '') : '',
  })).filter(p => p.title.length > 0);
}
