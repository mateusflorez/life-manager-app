import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useTasks } from '@/contexts/tasks-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import {
  TaskType,
  t,
  generateTagSlug,
} from '@/types/tasks';
import { useAlert } from '@/contexts/alert-context';

type TaskTypeOption = {
  type: TaskType;
  labelKey: 'todo' | 'daily' | 'weekly' | 'monthly';
  icon: string;
  hasDate: boolean;
  gradientColors: [string, string];
};

const TASK_TYPES: TaskTypeOption[] = [
  { type: 'todo', labelKey: 'todo', icon: 'checkmark.circle', hasDate: true, gradientColors: ['#6366F1', '#8B5CF6'] },
  { type: 'daily', labelKey: 'daily', icon: 'repeat', hasDate: false, gradientColors: ['#10B981', '#059669'] },
  { type: 'weekly', labelKey: 'weekly', icon: 'calendar.badge.clock', hasDate: true, gradientColors: ['#3B82F6', '#2563EB'] },
  { type: 'monthly', labelKey: 'monthly', icon: 'calendar', hasDate: true, gradientColors: ['#F59E0B', '#D97706'] },
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
  const { showToast } = useAlert();

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
      showToast({
        message: t('enterTaskName', lang),
        type: 'warning',
      });
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
      showToast({
        message: t('errorSaving', lang),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Task Type Selector */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={selectedTypeOption.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIconContainer}
            >
              <IconSymbol name="list.bullet" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('selectType', lang)}
            </Text>
          </View>

          <View style={styles.typeSelector}>
            {TASK_TYPES.map((typeOption) => (
              <TouchableOpacity
                key={typeOption.type}
                style={[
                  styles.typeButton,
                  {
                    borderColor:
                      selectedType === typeOption.type
                        ? typeOption.gradientColors[0]
                        : isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                onPress={() => setSelectedType(typeOption.type)}
                activeOpacity={0.8}
              >
                {selectedType === typeOption.type ? (
                  <LinearGradient
                    colors={typeOption.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.typeButtonGradient}
                  >
                    <IconSymbol name={typeOption.icon as any} size={18} color="#fff" />
                    <Text style={styles.typeButtonTextSelected}>
                      {t(typeOption.labelKey, lang)}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.typeButtonInner,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' },
                    ]}
                  >
                    <IconSymbol
                      name={typeOption.icon as any}
                      size={18}
                      color={isDark ? '#808080' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        { color: isDark ? '#808080' : '#6B7280' },
                      ]}
                    >
                      {t(typeOption.labelKey, lang)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Task Name */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <Text style={[styles.label, { color: isDark ? '#808080' : '#6B7280' }]}>
            {t('taskName', lang)} *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                color: isDark ? '#FFFFFF' : '#111827',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder={t('enterTaskName', lang)}
            placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
          />
        </View>

        {/* Date (not for daily tasks) */}
        {selectedTypeOption.hasDate && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <Text style={[styles.label, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('date', lang)} ({t('optional', lang)})
            </Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pickerIcon}
              >
                <IconSymbol name="calendar" size={16} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.pickerButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {date ? formatDateForDisplay(date) : lang === 'pt' ? 'Selecionar data' : 'Select date'}
              </Text>
              {date && (
                <TouchableOpacity onPress={() => setDate(null)} style={styles.clearButton}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={isDark ? '#666' : '#9CA3AF'} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Time */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <Text style={[styles.label, { color: isDark ? '#808080' : '#6B7280' }]}>
            {t('time', lang)} ({t('optional', lang)})
          </Text>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              {
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              },
            ]}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pickerIcon}
            >
              <IconSymbol name="clock" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.pickerButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {time ? formatTimeForDisplay(time) : lang === 'pt' ? 'Selecionar hora' : 'Select time'}
            </Text>
            {time && (
              <TouchableOpacity onPress={() => setTime(null)} style={styles.clearButton}>
                <IconSymbol name="xmark.circle.fill" size={20} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Tag */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <Text style={[styles.label, { color: isDark ? '#808080' : '#6B7280' }]}>
            {t('tag', lang)} ({t('optional', lang)})
          </Text>
          <View style={styles.tagInputContainer}>
            <View style={styles.tagPrefixContainer}>
              <Text style={[styles.tagPrefix, { color: '#6366F1' }]}>#</Text>
            </View>
            <TextInput
              style={[
                styles.tagInput,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDark ? '#FFFFFF' : '#111827',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
              value={tag}
              onChangeText={setTag}
              placeholder={lang === 'pt' ? 'trabalho, pessoal, urgente...' : 'work, personal, urgent...'}
              placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('cancel', lang)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, { opacity: name.trim() && !saving ? 1 : 0.5 }]}
            onPress={handleSave}
            disabled={!name.trim() || saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedTypeOption.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>
                {saving ? '...' : t('create', lang)}
              </Text>
            </LinearGradient>
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
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
  },
  typeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  typeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  pickerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagPrefixContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagPrefix: {
    fontSize: 18,
    fontWeight: '700',
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
