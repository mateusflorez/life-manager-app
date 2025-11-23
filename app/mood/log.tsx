import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { useMood } from '@/contexts/mood-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMoodFace, MOOD_FACES, formatDate } from '@/types/mood';
import type { MoodScore } from '@/types/mood';
import Slider from '@react-native-community/slider';

export default function LogMoodScreen() {
  const { addEntry } = useMood();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mood, setMood] = useState<number>(3);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const translations = {
    en: {
      title: "How are you feeling?",
      description: 'Rate your mood and add an optional note about your day.',
      entryDate: 'Entry date',
      moodScore: 'Mood score',
      moodValue: (value: number, face: string) => `${face} ${value}/5`,
      noteLabel: 'Note (optional)',
      notePlaceholder: 'How was your day?',
      saveMood: 'Save mood',
      saving: 'Saving...',
    },
    pt: {
      title: 'Como você está se sentindo?',
      description: 'Avalie seu humor e adicione uma nota opcional sobre o dia.',
      entryDate: 'Data do registro',
      moodScore: 'Nota do humor',
      moodValue: (value: number, face: string) => `${face} ${value}/5`,
      noteLabel: 'Nota (opcional)',
      notePlaceholder: 'Como foi seu dia?',
      saveMood: 'Salvar humor',
      saving: 'Salvando...',
    },
  };

  const t = translations[settings.language];
  const moodScore = Math.round(mood) as MoodScore;

  const formatDateKey = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dateKey = formatDateKey(date);
      await addEntry(dateKey, moodScore, note.trim() || undefined);
      router.back();
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <View
            style={[
              styles.headerCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <LinearGradient
              colors={['#FACC15', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerIcon}
            >
              <Text style={styles.headerEmoji}>😊</Text>
            </LinearGradient>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.title}
              </Text>
              <Text style={[styles.description, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.description}
              </Text>
            </View>
          </View>

          {/* Date Field */}
          <View
            style={[
              styles.fieldCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.fieldHeader}>
              <LinearGradient
                colors={['#FACC15', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fieldIcon}
              >
                <IconSymbol name="calendar" size={14} color="#000000" />
              </LinearGradient>
              <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.entryDate}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                },
              ]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {formatDate(formatDateKey(date), settings.language)}
              </Text>
              <IconSymbol name="chevron.down" size={16} color={isDark ? '#808080' : '#6B7280'} />
            </TouchableOpacity>
            {(showDatePicker || Platform.OS === 'ios') && (
              <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : undefined}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  themeVariant={isDark ? 'dark' : 'light'}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.iosDoneButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.iosDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Mood Slider Field */}
          <View
            style={[
              styles.fieldCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.fieldHeader}>
              <LinearGradient
                colors={['#FACC15', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fieldIcon}
              >
                <IconSymbol name="target" size={14} color="#000000" />
              </LinearGradient>
              <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.moodScore}
              </Text>
            </View>

            {/* Mood Display */}
            <View style={styles.moodDisplay}>
              <Text style={styles.moodEmoji}>{getMoodFace(moodScore)}</Text>
              <Text style={[styles.moodValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.moodValue(moodScore, getMoodFace(moodScore))}
              </Text>
            </View>

            {/* Slider */}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>{MOOD_FACES[1]}</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={mood}
                onValueChange={setMood}
                minimumTrackTintColor="#FACC15"
                maximumTrackTintColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                thumbTintColor="#FACC15"
              />
              <Text style={styles.sliderLabel}>{MOOD_FACES[5]}</Text>
            </View>

            {/* Mood Scale */}
            <View style={styles.moodScale}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.moodScaleItem,
                    mood === value && styles.moodScaleItemActive,
                  ]}
                  onPress={() => setMood(value)}
                >
                  <Text style={[styles.moodScaleEmoji, mood === value && styles.moodScaleEmojiActive]}>
                    {MOOD_FACES[value as MoodScore]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note Field */}
          <View
            style={[
              styles.fieldCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.fieldHeader}>
              <LinearGradient
                colors={['#FACC15', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fieldIcon}
              >
                <IconSymbol name="note.text" size={14} color="#000000" />
              </LinearGradient>
              <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.noteLabel}
              </Text>
            </View>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: isDark ? '#FFFFFF' : '#111827',
                },
              ]}
              placeholder={t.notePlaceholder}
              placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FACC15', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <IconSymbol name="checkmark" size={18} color="#000000" />
              <Text style={styles.buttonText}>{saving ? t.saving : t.saveMood}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  fieldCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  iosPickerContainer: {
    backgroundColor: 'transparent',
  },
  iosDoneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  iosDoneButtonText: {
    color: '#FACC15',
    fontSize: 16,
    fontWeight: '600',
  },
  moodDisplay: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  moodEmoji: {
    fontSize: 48,
  },
  moodValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 20,
  },
  moodScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  moodScaleItem: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  moodScaleItemActive: {
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
  },
  moodScaleEmoji: {
    fontSize: 24,
    opacity: 0.5,
  },
  moodScaleEmojiActive: {
    opacity: 1,
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
