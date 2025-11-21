import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useTasks } from '@/contexts/tasks-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  TaskType,
  t,
  getTodayKey,
  generateTagSlug,
} from '@/types/tasks';

type TaskTypeOption = {
  type: TaskType;
  labelKey: 'todo' | 'daily' | 'weekly' | 'monthly';
  icon: string;
  hasDate: boolean;
};

const TASK_TYPES: TaskTypeOption[] = [
  { type: 'todo', labelKey: 'todo', icon: 'checkmark.circle', hasDate: true },
  { type: 'daily', labelKey: 'daily', icon: 'repeat', hasDate: false },
  { type: 'weekly', labelKey: 'weekly', icon: 'calendar.badge.clock', hasDate: true },
  { type: 'monthly', labelKey: 'monthly', icon: 'calendar', hasDate: true },
];

export default function AddTaskScreen() {
  const router = useRouter();
  const { createTask } = useTasks();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedType, setSelectedType] = useState<TaskType>('todo');
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const lang = settings.language;

  const selectedTypeOption = TASK_TYPES.find((t) => t.type === selectedType)!;

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      setTime(selectedTime);
    }
  };

  const formatDateForStorage = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForStorage = (d: Date): string => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDateForDisplay = (d: Date): string => {
    if (lang === 'pt') {
      return d.toLocaleDateString('pt-BR');
    }
    return d.toLocaleDateString('en-US');
  };

  const formatTimeForDisplay = (d: Date): string => {
    if (lang === 'pt') {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        lang === 'pt' ? 'Erro' : 'Error',
        t('enterTaskName', lang)
      );
      return;
    }

    setSaving(true);
    try {
      const options: { date?: string; time?: string; tag?: string } = {};

      if (selectedTypeOption.hasDate && date) {
        options.date = formatDateForStorage(date);
      }
      if (time) {
        options.time = formatTimeForStorage(time);
      }
      if (tag.trim()) {
        options.tag = generateTagSlug(tag.trim());
      }

      await createTask(selectedType, name.trim(), options);
      router.back();
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert(
        lang === 'pt' ? 'Erro' : 'Error',
        t('errorSaving', lang)
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Task Type Selector */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#999' : '#666' }]}>
            {t('selectType', lang)}
          </Text>
          <View style={styles.typeSelector}>
            {TASK_TYPES.map((typeOption) => (
              <TouchableOpacity
                key={typeOption.type}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      selectedType === typeOption.type
                        ? '#007AFF'
                        : isDark
                        ? '#333'
                        : '#F5F5F5',
                    borderColor:
                      selectedType === typeOption.type
                        ? '#007AFF'
                        : isDark
                        ? '#444'
                        : '#E0E0E0',
                  },
                ]}
                onPress={() => setSelectedType(typeOption.type)}
              >
                <IconSymbol
                  name={typeOption.icon as any}
                  size={18}
                  color={selectedType === typeOption.type ? '#fff' : isDark ? '#ECEDEE' : '#11181C'}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    {
                      color:
                        selectedType === typeOption.type
                          ? '#fff'
                          : isDark
                          ? '#ECEDEE'
                          : '#11181C',
                    },
                  ]}
                >
                  {t(typeOption.labelKey, lang)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Task Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#999' : '#666' }]}>
            {t('taskName', lang)} *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#333' : '#F5F5F5',
                color: isDark ? '#ECEDEE' : '#11181C',
                borderColor: isDark ? '#444' : '#E0E0E0',
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder={t('enterTaskName', lang)}
            placeholderTextColor={isDark ? '#666' : '#999'}
          />
        </View>

        {/* Date (not for daily tasks) */}
        {selectedTypeOption.hasDate && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: isDark ? '#999' : '#666' }]}>
              {t('date', lang)} ({t('optional', lang)})
            </Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  backgroundColor: isDark ? '#333' : '#F5F5F5',
                  borderColor: isDark ? '#444' : '#E0E0E0',
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <IconSymbol name="calendar" size={20} color={isDark ? '#ECEDEE' : '#11181C'} />
              <Text style={[styles.pickerButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {date ? formatDateForDisplay(date) : lang === 'pt' ? 'Selecionar data' : 'Select date'}
              </Text>
              {date && (
                <TouchableOpacity onPress={() => setDate(null)} style={styles.clearButton}>
                  <IconSymbol name="xmark.circle.fill" size={18} color={isDark ? '#666' : '#999'} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Time */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#999' : '#666' }]}>
            {t('time', lang)} ({t('optional', lang)})
          </Text>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              {
                backgroundColor: isDark ? '#333' : '#F5F5F5',
                borderColor: isDark ? '#444' : '#E0E0E0',
              },
            ]}
            onPress={() => setShowTimePicker(true)}
          >
            <IconSymbol name="clock" size={20} color={isDark ? '#ECEDEE' : '#11181C'} />
            <Text style={[styles.pickerButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {time ? formatTimeForDisplay(time) : lang === 'pt' ? 'Selecionar hora' : 'Select time'}
            </Text>
            {time && (
              <TouchableOpacity onPress={() => setTime(null)} style={styles.clearButton}>
                <IconSymbol name="xmark.circle.fill" size={18} color={isDark ? '#666' : '#999'} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Tag */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#999' : '#666' }]}>
            {t('tag', lang)} ({t('optional', lang)})
          </Text>
          <View style={styles.tagInputContainer}>
            <Text style={[styles.tagPrefix, { color: isDark ? '#666' : '#999' }]}>#</Text>
            <TextInput
              style={[
                styles.tagInput,
                {
                  backgroundColor: isDark ? '#333' : '#F5F5F5',
                  color: isDark ? '#ECEDEE' : '#11181C',
                  borderColor: isDark ? '#444' : '#E0E0E0',
                },
              ]}
              value={tag}
              onChangeText={setTag}
              placeholder={lang === 'pt' ? 'trabalho, pessoal, urgente...' : 'work, personal, urgent...'}
              placeholderTextColor={isDark ? '#666' : '#999'}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: isDark ? '#444' : '#E0E0E0' }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.cancelButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t('cancel', lang)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, { opacity: name.trim() && !saving ? 1 : 0.5 }]}
            onPress={handleSave}
            disabled={!name.trim() || saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? '...' : t('create', lang)}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={time || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          is24Hour={lang === 'pt'}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagPrefix: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
