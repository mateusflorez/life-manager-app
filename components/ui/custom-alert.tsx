import { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert, type AlertType } from '@/contexts/alert-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ALERT_ICONS: Record<AlertType, string> = {
  success: 'checkmark.circle.fill',
  error: 'xmark.circle.fill',
  warning: 'exclamationmark.triangle.fill',
  info: 'info.circle.fill',
};

const ALERT_GRADIENTS: Record<AlertType, [string, string]> = {
  success: ['#10B981', '#059669'],
  error: ['#EF4444', '#DC2626'],
  warning: ['#F59E0B', '#D97706'],
  info: ['#6366F1', '#8B5CF6'],
};

export function CustomAlert() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {
    toastVisible,
    toastConfig,
    hideToast,
    confirmVisible,
    confirmConfig,
    hideConfirm,
  } = useAlert();

  // Toast animation
  const toastAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (toastVisible) {
      Animated.spring(toastAnim, {
        toValue: 60,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    } else {
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [toastVisible, toastAnim]);

  const handleConfirmButton = async (onPress?: () => void | Promise<void>) => {
    hideConfirm();
    if (onPress) {
      await onPress();
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toastConfig && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: toastAnim }],
            },
          ]}
          pointerEvents="box-none"
        >
          <Pressable onPress={hideToast}>
            <View
              style={[
                styles.toast,
                {
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <LinearGradient
                colors={ALERT_GRADIENTS[toastConfig.type ?? 'info']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.toastIconContainer}
              >
                <IconSymbol
                  name={ALERT_ICONS[toastConfig.type ?? 'info'] as any}
                  size={18}
                  color="#FFFFFF"
                />
              </LinearGradient>
              <Text
                style={[styles.toastText, { color: isDark ? '#FFFFFF' : '#111827' }]}
                numberOfLines={2}
              >
                {toastConfig.message}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* Confirm Dialog */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={hideConfirm}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.confirmDialog,
              {
                backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              },
            ]}
          >
            {/* Icon */}
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.confirmIconContainer}
            >
              <IconSymbol name="exclamationmark.circle.fill" size={28} color="#FFFFFF" />
            </LinearGradient>

            {/* Title */}
            {confirmConfig?.title && (
              <Text style={[styles.confirmTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {confirmConfig.title}
              </Text>
            )}

            {/* Message */}
            {confirmConfig?.message && (
              <Text style={[styles.confirmMessage, { color: isDark ? '#808080' : '#6B7280' }]}>
                {confirmConfig.message}
              </Text>
            )}

            {/* Buttons */}
            <View style={styles.confirmButtons}>
              {confirmConfig?.buttons.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';

                if (isCancel) {
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.confirmButton,
                        styles.cancelButton,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                      onPress={() => handleConfirmButton(button.onPress)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.confirmButtonText,
                          { color: isDark ? '#FFFFFF' : '#111827' },
                        ]}
                      >
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.confirmButton, styles.actionButton]}
                    onPress={() => handleConfirmButton(button.onPress)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isDestructive ? ['#EF4444', '#DC2626'] : ['#6366F1', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButtonGradient}
                    >
                      <Text style={styles.actionButtonText}>{button.text}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Toast styles
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: SCREEN_WIDTH - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },

  // Confirm dialog styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmDialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  confirmIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmButtons: {
    width: '100%',
    gap: 10,
  },
  confirmButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButton: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
