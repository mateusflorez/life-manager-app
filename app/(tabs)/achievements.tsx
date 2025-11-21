import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/themed-view';
import { useAccount } from '@/contexts/account-context';
import { useSettings } from '@/contexts/settings-context';
import { useBooks } from '@/contexts/books-context';
import { useInvestment } from '@/contexts/investment-context';
import { useTraining } from '@/contexts/training-context';
import { useFocus } from '@/contexts/focus-context';
import { useMood } from '@/contexts/mood-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  buildAchievements,
  calculateAchievementStats,
  calculateCompletedTiers,
  calculateProgress,
  formatCurrency,
  formatHours,
  t,
  type Language,
  type AchievementCategory,
} from '@/types/achievements';

// Modern gradient color schemes for each tier
const TIER_GRADIENTS: [string, string][] = [
  ['#6B7280', '#374151'], // Bronze - Gray
  ['#10B981', '#059669'], // Silver - Green
  ['#3B82F6', '#1D4ED8'], // Gold - Blue
  ['#8B5CF6', '#6D28D9'], // Platinum - Purple
  ['#F59E0B', '#D97706'], // Diamond - Orange
];

// Locked card gradients (darker, desaturated)
const LOCKED_GRADIENTS: [string, string][] = [
  ['#3F3F46', '#27272A'],
  ['#3F3F46', '#27272A'],
  ['#3F3F46', '#27272A'],
  ['#3F3F46', '#27272A'],
  ['#3F3F46', '#27272A'],
];

// Tier roman numerals
const TIER_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

// Category icons mapping
const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  levels: 'chart.line.uptrend.xyaxis',
  chapters: 'book.fill',
  investments: 'dollarsign.circle.fill',
  tasks: 'checkmark.circle.fill',
  training: 'dumbbell.fill',
  focus: 'clock.fill',
  mood: 'face.smiling.fill',
};

// Category accent colors
const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  levels: '#F59E0B',
  chapters: '#6C5CE7',
  investments: '#10B981',
  tasks: '#3B82F6',
  training: '#EF4444',
  focus: '#EC4899',
  mood: '#FACC15',
};

export default function AchievementsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { account } = useAccount();
  const { settings } = useSettings();
  const { totalChaptersRead } = useBooks();
  const { portfolioTotal } = useInvestment();
  const { totalSessions } = useTraining();
  const { stats: focusStats } = useFocus();
  const { entries: moodEntries } = useMood();

  const language = settings.language as Language;
  const currency = settings.currency || 'BRL';

  const trans = {
    achievements: t('achievements', language) as string,
    overallTitle: t('overallTitle', language) as string,
    overallLabel: t('overallLabel', language) as (completed: number, total: number) => string,
    completed: t('completed', language) as string,
    progress: t('progress', language) as (current: number, target: number) => string,
    noData: t('noData', language) as string,
  };

  if (!account) {
    return (
      <ThemedView style={styles.container}>
        <Text style={[styles.emptyText, { color: isDark ? '#999' : '#666' }]}>
          {trans.noData}
        </Text>
      </ThemedView>
    );
  }

  const level = Math.floor((account.xp || 0) / 1000);
  const tasksCompleted = account.completedTasks || 0;

  const achievements = buildAchievements(language, currency, {
    level,
    chaptersRead: totalChaptersRead,
    totalInvested: portfolioTotal,
    tasksCompleted,
    trainingSessions: totalSessions,
    focusMinutes: focusStats.totalMinutes,
    moodLogs: moodEntries.length,
  });

  const { totalTiers, completedTiers, completionPercent } =
    calculateAchievementStats(achievements);

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Hero Summary Card */}
        <LinearGradient
          colors={isDark ? ['#1E3A5F', '#0F172A'] : ['#3B82F6', '#1E40AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>{trans.overallTitle}</Text>
              <Text style={styles.heroSubtitle}>
                {trans.overallLabel(completedTiers, totalTiers)}
              </Text>
            </View>
            <View style={styles.heroRight}>
              <View style={styles.percentCircle}>
                <Text style={styles.percentText}>{completionPercent}%</Text>
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.heroProgressTrack}>
            <LinearGradient
              colors={['#60A5FA', '#34D399']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.heroProgressFill, { width: `${completionPercent}%` }]}
            />
          </View>

          {/* Decorative elements */}
          <View style={styles.heroDecor}>
            <Text style={styles.heroTrophy}>🏆</Text>
          </View>
        </LinearGradient>

        {/* Achievement Categories */}
        {achievements.map((achievement) => {
          const completedCount = calculateCompletedTiers(
            achievement.currentValue,
            achievement.tiers
          );
          const categoryColor = CATEGORY_COLORS[achievement.key];
          const categoryIcon = CATEGORY_ICONS[achievement.key];
          const isFullyComplete = completedCount === achievement.tiers.length;

          return (
            <View key={achievement.key} style={styles.section}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.sectionIconContainer,
                    { backgroundColor: categoryColor + '20' },
                  ]}
                >
                  <IconSymbol name={categoryIcon as never} size={20} color={categoryColor} />
                </View>
                <Text style={[styles.sectionTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                  {achievement.title}
                </Text>
                {isFullyComplete && (
                  <View style={styles.completeBadge}>
                    <Text style={styles.completeBadgeText}>✨ MAX</Text>
                  </View>
                )}
              </View>

              {/* Tier Cards */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tiersContainer}
                style={styles.tiersScrollView}
              >
                {achievement.tiers.map((target, index) => {
                  const isCompleted = achievement.currentValue >= target;
                  const isNextToUnlock =
                    !isCompleted &&
                    (index === 0 || achievement.currentValue >= achievement.tiers[index - 1]);
                  const progress = calculateProgress(achievement.currentValue, target);
                  const gradientColors = isCompleted
                    ? TIER_GRADIENTS[index]
                    : LOCKED_GRADIENTS[index];

                  // Format values
                  let currentDisplay: string;
                  let targetDisplay: string;

                  if (achievement.key === 'investments') {
                    currentDisplay = formatCurrency(achievement.currentValue, currency, language);
                    targetDisplay = formatCurrency(target, currency, language);
                  } else if (achievement.key === 'focus') {
                    currentDisplay = formatHours(achievement.currentValue);
                    targetDisplay = formatHours(target);
                  } else {
                    currentDisplay = String(achievement.currentValue);
                    targetDisplay = String(target);
                  }

                  return (
                    <View
                      key={`${achievement.key}-${target}`}
                      style={[
                        styles.tierCardWrapper,
                        isNextToUnlock && styles.tierCardHighlight,
                      ]}
                    >
                      <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.tierCard,
                          isCompleted && styles.tierCardCompleted,
                        ]}
                      >
                        {/* Tier Badge */}
                        <View
                          style={[
                            styles.tierBadge,
                            {
                              backgroundColor: isCompleted
                                ? 'rgba(255,255,255,0.25)'
                                : 'rgba(255,255,255,0.1)',
                            },
                          ]}
                        >
                          <Text style={styles.tierBadgeText}>{TIER_NUMERALS[index]}</Text>
                        </View>

                        {/* Icon */}
                        <View style={styles.tierIconContainer}>
                          {isCompleted ? (
                            <Text style={styles.tierTrophy}>🏆</Text>
                          ) : (
                            <View style={styles.tierLockContainer}>
                              <Text style={styles.tierLock}>🔒</Text>
                            </View>
                          )}
                        </View>

                        {/* Label */}
                        <Text
                          style={[
                            styles.tierLabel,
                            !isCompleted && styles.tierLabelLocked,
                          ]}
                          numberOfLines={2}
                        >
                          {achievement.labelFn(target)}
                        </Text>

                        {/* Status */}
                        {isCompleted ? (
                          <View style={styles.completedStatus}>
                            <IconSymbol name="checkmark" size={14} color="#fff" />
                            <Text style={styles.completedText}>{trans.completed}</Text>
                          </View>
                        ) : (
                          <View style={styles.progressContainer}>
                            <Text style={styles.progressText}>
                              {currentDisplay} / {targetDisplay}
                            </Text>
                            <View style={styles.progressTrack}>
                              <View
                                style={[
                                  styles.progressFill,
                                  {
                                    width: `${progress}%`,
                                    backgroundColor: isNextToUnlock
                                      ? TIER_GRADIENTS[index][0]
                                      : 'rgba(255,255,255,0.5)',
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        )}

                        {/* Shine effect for completed */}
                        {isCompleted && <View style={styles.shineEffect} />}
                      </LinearGradient>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Progress indicator */}
              <View style={styles.sectionProgress}>
                {achievement.tiers.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor:
                          index < completedCount
                            ? TIER_GRADIENTS[index][0]
                            : isDark
                            ? '#3F3F46'
                            : '#E5E7EB',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    paddingTop: 60,
    gap: 24,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },

  // Hero Card
  heroCard: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  heroRight: {
    marginLeft: 16,
  },
  percentCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  percentText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  heroProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroDecor: {
    position: 'absolute',
    top: -10,
    right: -10,
    opacity: 0.1,
  },
  heroTrophy: {
    fontSize: 100,
  },

  // Section
  section: {
    gap: 12,
    overflow: 'visible',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  completeBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // Tiers
  tiersScrollView: {
    overflow: 'visible',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tiersContainer: {
    gap: 12,
    paddingRight: 16,
    paddingVertical: 8,
    paddingLeft: 4,
  },
  tierCardWrapper: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tierCardHighlight: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  tierCard: {
    width: 160,
    minHeight: 170,
    padding: 16,
    borderRadius: 16,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  tierCardCompleted: {
    // Shadow handled by wrapper
  },
  tierBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  tierIconContainer: {
    marginBottom: 4,
  },
  tierTrophy: {
    fontSize: 32,
  },
  tierLockContainer: {
    opacity: 0.5,
  },
  tierLock: {
    fontSize: 28,
  },
  tierLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 18,
  },
  tierLabelLocked: {
    color: 'rgba(255,255,255,0.6)',
  },
  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    gap: 6,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 60,
    height: '200%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ rotate: '25deg' }],
  },

  // Section Progress Dots
  sectionProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
