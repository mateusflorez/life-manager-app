import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  documentDirectory,
  writeAsStringAsync,
  readAsStringAsync,
  EncodingType,
  StorageAccessFramework,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const EXPORT_VERSION = 1;

type ExportData = {
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
};

// All AsyncStorage keys used by the app
const STORAGE_KEYS_PREFIXES = [
  '@life-manager/',
  '@life_manager_',
];

export async function exportAllData(): Promise<string> {
  try {
    // Get all keys from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();

    // Filter keys that belong to our app
    const appKeys = allKeys.filter(key =>
      STORAGE_KEYS_PREFIXES.some(prefix => key.startsWith(prefix))
    );

    // Get all values
    const keyValuePairs = await AsyncStorage.multiGet(appKeys);

    // Create data object
    const data: Record<string, unknown> = {};
    for (const [key, value] of keyValuePairs) {
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    }

    const exportData: ExportData = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Failed to export data:', error);
    throw error;
  }
}

export async function saveExportedData(): Promise<{ success: boolean; path?: string }> {
  try {
    const jsonData = await exportAllData();

    // Create filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `life-manager-backup-${date}.json`;

    if (Platform.OS === 'android') {
      // Use Storage Access Framework on Android to let user pick directory
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        return { success: false };
      }

      // Create the file in the selected directory
      const fileUri = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        'application/json'
      );

      // Write the data to the file
      await writeAsStringAsync(fileUri, jsonData, {
        encoding: EncodingType.UTF8,
      });

      return { success: true, path: fileUri };
    } else {
      // On iOS/web, use sharing
      const fileUri = `${documentDirectory}${filename}`;

      // Write to temp file first
      await writeAsStringAsync(fileUri, jsonData, {
        encoding: EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      // Share the file (on iOS this opens the share sheet where user can save to Files)
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Life Manager Backup',
        UTI: 'public.json',
      });

      return { success: true, path: fileUri };
    }
  } catch (error) {
    console.error('Failed to save exported data:', error);
    throw error;
  }
}

export async function importData(): Promise<{ success: boolean; keysImported: number }> {
  try {
    // Pick a file
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, keysImported: 0 };
    }

    const fileUri = result.assets[0].uri;

    // Read file content
    const content = await readAsStringAsync(fileUri, {
      encoding: EncodingType.UTF8,
    });

    // Parse JSON
    const importedData: ExportData = JSON.parse(content);

    // Validate structure
    if (!importedData.version || !importedData.data) {
      throw new Error('Invalid backup file format');
    }

    // Import all data
    const entries = Object.entries(importedData.data);
    const keyValuePairs: [string, string][] = entries.map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]);

    await AsyncStorage.multiSet(keyValuePairs);

    return { success: true, keysImported: keyValuePairs.length };
  } catch (error) {
    console.error('Failed to import data:', error);
    throw error;
  }
}

export async function getDataStats(): Promise<{ keys: number; sizeKB: number }> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter(key =>
      STORAGE_KEYS_PREFIXES.some(prefix => key.startsWith(prefix))
    );

    const keyValuePairs = await AsyncStorage.multiGet(appKeys);

    let totalSize = 0;
    for (const [key, value] of keyValuePairs) {
      totalSize += key.length + (value?.length || 0);
    }

    return {
      keys: appKeys.length,
      sizeKB: Math.round(totalSize / 1024 * 10) / 10,
    };
  } catch (error) {
    console.error('Failed to get data stats:', error);
    return { keys: 0, sizeKB: 0 };
  }
}
