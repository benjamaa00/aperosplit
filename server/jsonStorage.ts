import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_PATH = path.join(__dirname, 'storage.json');

interface StorageData {
  members: any[];
  expenses: any[];
  pendingPayments: any[];
  completedPayments: any[];
  biometricEnabled: Record<string, boolean>;
}

// Initialize storage if it doesn't exist
function initializeStorage() {
  if (!fs.existsSync(STORAGE_PATH)) {
    const initialData: StorageData = {
      members: [],
      expenses: [],
      pendingPayments: [],
      completedPayments: [],
      biometricEnabled: {}
    };
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(initialData, null, 2));
  }
}

// Read data from JSON file
export function readStorage(): StorageData {
  initializeStorage();
  const data = fs.readFileSync(STORAGE_PATH, 'utf-8');
  return JSON.parse(data);
}

// Write data to JSON file
export function writeStorage(data: StorageData) {
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
}

// Update specific section
export function updateStorage<K extends keyof StorageData>(
  section: K,
  data: StorageData[K]
) {
  const current = readStorage();
  current[section] = data;
  writeStorage(current);
}

// Get specific section
export function getStorage<K extends keyof StorageData>(
  section: K
): StorageData[K] {
  const data = readStorage();
  return data[section];
}

// Clear all data
export function clearAllStorage() {
  const initialData: StorageData = {
    members: [],
    expenses: [],
    pendingPayments: [],
    completedPayments: [],
    biometricEnabled: {}
  };
  writeStorage(initialData);
}
