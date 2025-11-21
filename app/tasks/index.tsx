import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useTasks } from '@/contexts/tasks-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  TaskType,
  t,
  formatDate,
  formatTime,
  isTaskOverdue,
  isDueToday,
} from '@/types/tasks';
import { TaskWithStatus } from '@/services/tasks-storage';

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, todayProgress, toggleTask, deleteTask, loading, refreshData } = useTasks();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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

    Alert.alert(lang === 'pt' ? 'Excluir Tarefa' : 'Delete Task', message, [
      { text: t('cancel', lang), style: 'cancel' },
      {
        text: t('delete', lang),
        style: 'destructive',
        onPress: async () => {
          await deleteTask(type, taskId);
        },
      },
    ]);
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
            backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
            borderColor: overdue ? '#EF4444' : isDark ? '#333' : '#E0E0E0',
            opacity: task.isCompleted ? 0.6 : 1,
          },
        ]}
        onPress={() => handleToggleTask(type, task.id)}
        onLongPress={() => handleDeleteTask(type, task.id)}
      >
        <View style={styles.taskCheckbox}>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: task.isCompleted ? '#10B981' : isDark ? '#666' : '#999',
                backgroundColor: task.isCompleted ? '#10B981' : 'transparent',
              },
            ]}
          >
            {task.isCompleted && (
              <IconSymbol name="checkmark" size={14} color="#fff" />
            )}
          </View>
        </View>

        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskName,
              {
                color: isDark ? '#ECEDEE' : '#11181C',
                textDecorationLine: task.isCompleted ? 'line-through' : 'none',
              },
            ]}
          >
            {task.name}
          </Text>

          {metaParts.length > 0 && (
            <View style={styles.taskMeta}>
              {overdue && (
                <View style={styles.statusBadge}>
                  <Text style={[styles.statusText, { color: '#EF4444' }]}>
                    {t('overdue', lang)}
                  </Text>
                </View>
              )}
              {dueToday && !overdue && (
                <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.statusText, { color: '#D97706' }]}>
                    {t('dueToday', lang)}
                  </Text>
                </View>
              )}
              <Text style={[styles.taskMetaText, { color: isDark ? '#999' : '#666' }]}>
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
    taskList: TaskWithStatus[]
  ) => {
    const isExpanded = expandedSections[type];
    const completedCount = taskList.filter((t) => t.isCompleted).length;
    const pendingTasks = taskList.filter((t) => !t.isCompleted);
    const completedTasks = taskList.filter((t) => t.isCompleted);

    return (
      <View key={type} style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(type)}
        >
          <View style={styles.sectionTitleRow}>
            <IconSymbol
              name={isExpanded ? 'chevron.down' : 'chevron.right'}
              size={16}
              color={isDark ? '#999' : '#666'}
            />
            <Text style={[styles.sectionTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {title}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
              <Text style={[styles.countText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {completedCount}/{taskList.length}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {taskList.length === 0 ? (
              <Text style={[styles.emptyText, { color: isDark ? '#666' : '#999' }]}>
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemedView>
    );
  }

  const totalTasks =
    tasks.todo.length + tasks.daily.length + tasks.weekly.length + tasks.monthly.length;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Progress Card */}
        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
        >
          <Text style={[styles.progressLabel, { color: isDark ? '#999' : '#666' }]}>
            {t('todayProgress', lang)}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    todayProgress.total > 0
                      ? (todayProgress.completed / todayProgress.total) * 100
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
            {todayProgress.completed}/{todayProgress.total} {t('completedCount', lang)}
          </Text>
          {todayProgress.overdue > 0 && (
            <Text style={styles.overdueText}>
              {todayProgress.overdue} {t('overdueCount', lang)}
            </Text>
          )}
        </View>

        {/* Task Sections */}
        {totalTasks === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              name="checklist"
              size={48}
              color={isDark ? '#666' : '#999'}
            />
            <Text style={[styles.emptyTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t('noTasks', lang)}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#999' : '#666' }]}>
              {t('noPendingTasks', lang)}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/tasks/add')}
            >
              <Text style={styles.createButtonText}>{t('addTask', lang)}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderSection('todo', t('todo', lang), tasks.todo)}
            {renderSection('daily', t('daily', lang), tasks.daily)}
            {renderSection('weekly', t('weekly', lang), tasks.weekly)}
            {renderSection('monthly', t('monthly', lang), tasks.monthly)}
          </>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {totalTasks > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/tasks/add')}
        >
          <IconSymbol name="plus" size={24} color="#fff" />
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
  },
  progressCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  overdueText: {
    fontSize: 14,
    color: '#EF4444',
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    paddingVertical: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionContent: {
    gap: 8,
    paddingLeft: 24,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  taskCheckbox: {
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '500',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  taskMetaText: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
