import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  formatDate,
  formatTime,
  isTaskOverdue,
  isDueToday,
} from '@/types/tasks';
import { TaskWithStatus } from '@/services/tasks-storage';
import { useAlert } from '@/contexts/alert-context';

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, todayProgress, toggleTask, deleteTask, loading, refreshData } = useTasks();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { showConfirm } = useAlert();

  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<TaskType, boolean>>({
    todo: true,
    daily: true,
    weekly: true,
    monthly: true,
  });

  const lang = settings.language;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const toggleSection = (type: TaskType) => {
    setExpandedSections((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleToggleTask = async (type: TaskType, taskId: string) => {
    await toggleTask(type, taskId);
  };

  const handleDeleteTask = (type: TaskType, taskId: string) => {
    const message =
      lang === 'pt'
        ? 'Tem certeza que deseja excluir esta tarefa?'
        : 'Are you sure you want to delete this task?';

    showConfirm({
      title: lang === 'pt' ? 'Excluir Tarefa' : 'Delete Task',
      message,
      buttons: [
        { text: t('cancel', lang), style: 'cancel' },
        {
          text: t('delete', lang),
          style: 'destructive',
          onPress: async () => {
            await deleteTask(type, taskId);
          },
        },
      ],
    });
  };

  const renderTaskItem = (task: TaskWithStatus, type: TaskType) => {
    const overdue = !task.isCompleted && isTaskOverdue(task);
    const dueToday = !task.isCompleted && isDueToday(task);

    const metaParts: string[] = [];
    if ('date' in task && task.date) {
      metaParts.push(formatDate(task.date, lang));
    }
    if (task.time) {
      metaParts.push(formatTime(task.time, lang));
    }
    if (task.tag) {
      metaParts.push(`#${task.tag}`);
    }

    return (
      <TouchableOpacity
        key={task.id}
        style={[
          styles.taskItem,
          {
            backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: overdue
              ? 'rgba(239, 68, 68, 0.5)'
              : isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)',
            opacity: task.isCompleted ? 0.6 : 1,
          },
        ]}
        onPress={() => handleToggleTask(type, task.id)}
        onLongPress={() => handleDeleteTask(type, task.id)}
        activeOpacity={0.8}
      >
        <TouchableOpacity
          style={styles.taskCheckbox}
          onPress={() => handleToggleTask(type, task.id)}
        >
          {task.isCompleted ? (
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkboxCompleted}
            >
              <IconSymbol name="checkmark" size={14} color="#fff" />
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.checkbox,
                { borderColor: isDark ? '#666' : '#999' },
              ]}
            />
          )}
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskName,
              {
                color: isDark ? '#FFFFFF' : '#111827',
                textDecorationLine: task.isCompleted ? 'line-through' : 'none',
              },
            ]}
          >
            {task.name}
          </Text>

          {metaParts.length > 0 && (
            <View style={styles.taskMeta}>
              {overdue && (
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={[styles.statusText, { color: '#EF4444' }]}>
                    {t('overdue', lang)}
                  </Text>
                </View>
              )}
              {dueToday && !overdue && (
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={[styles.statusText, { color: '#F59E0B' }]}>
                    {t('dueToday', lang)}
                  </Text>
                </View>
              )}
              <Text style={[styles.taskMetaText, { color: isDark ? '#808080' : '#6B7280' }]}>
                {metaParts.join(' • ')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (
    type: TaskType,
    title: string,
    taskList: TaskWithStatus[],
    gradientColors: [string, string],
    iconName: string
  ) => {
    const isExpanded = expandedSections[type];
    const completedCount = taskList.filter((t) => t.isCompleted).length;
    const pendingTasks = taskList.filter((t) => !t.isCompleted);
    const completedTasks = taskList.filter((t) => t.isCompleted);

    return (
      <View key={type} style={styles.section}>
        <TouchableOpacity
          style={[
            styles.sectionHeader,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
          onPress={() => toggleSection(type)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionIconContainer}
          >
            <IconSymbol name={iconName as any} size={16} color="#FFFFFF" />
          </LinearGradient>

          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {title}
          </Text>

          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <Text style={[styles.countText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {completedCount}/{taskList.length}
            </Text>
          </View>

          <IconSymbol
            name={isExpanded ? 'chevron.down' : 'chevron.right'}
            size={16}
            color={isDark ? '#808080' : '#6B7280'}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {taskList.length === 0 ? (
              <Text style={[styles.emptyText, { color: isDark ? '#666' : '#9CA3AF' }]}>
                {t('noTasks', lang)}
              </Text>
            ) : (
              <>
                {pendingTasks.map((task) => renderTaskItem(task, type))}
                {completedTasks.map((task) => renderTaskItem(task, type))}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <RippleBackground isDark={isDark} rippleCount={6} />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingGradient}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
        </View>
      </ThemedView>
    );
  }

  const totalTasks =
    tasks.todo.length + tasks.daily.length + tasks.weekly.length + tasks.monthly.length;

  const progressPercent =
    todayProgress.total > 0 ? (todayProgress.completed / todayProgress.total) * 100 : 0;

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Progress Card */}
        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIconContainer}
            >
              <IconSymbol name="flame.fill" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('todayProgress', lang)}
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
              ]}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progressPercent}%` }]}
              />
            </View>
          </View>

          <View style={styles.progressStats}>
            <Text style={[styles.progressText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {todayProgress.completed}/{todayProgress.total} {t('completedCount', lang)}
            </Text>
            {todayProgress.overdue > 0 && (
              <View style={[styles.overdueBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Text style={styles.overdueText}>
                  {todayProgress.overdue} {t('overdueCount', lang)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Task Sections */}
        {totalTasks === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconContainer}
            >
              <IconSymbol name="checklist" size={40} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('noTasks', lang)}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('noPendingTasks', lang)}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/tasks/add')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createButtonGradient}
              >
                <IconSymbol name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.createButtonText}>{t('addTask', lang)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderSection('todo', t('todo', lang), tasks.todo, ['#6366F1', '#8B5CF6'], 'checkmark.circle')}
            {renderSection('daily', t('daily', lang), tasks.daily, ['#10B981', '#059669'], 'repeat')}
            {renderSection('weekly', t('weekly', lang), tasks.weekly, ['#3B82F6', '#2563EB'], 'calendar.badge.clock')}
            {renderSection('monthly', t('monthly', lang), tasks.monthly, ['#F59E0B', '#D97706'], 'calendar')}
          </>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {totalTasks > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/tasks/add')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <IconSymbol name="plus" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  progressCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
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
  progressBarContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
  },
  overdueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  overdueText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionContent: {
    gap: 8,
    paddingLeft: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskCheckbox: {
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    gap: 6,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  taskMetaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 8,
    paddingLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
