// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.down': 'keyboard-arrow-down',
  'gearshape.fill': 'settings',
  // Finance icons
  'dollarsign.circle.fill': 'attach-money',
  'chart.pie.fill': 'pie-chart',
  'creditcard.fill': 'credit-card',
  'creditcard': 'credit-card',
  'arrow.2.squarepath': 'repeat',
  'calendar': 'calendar-today',
  'plus': 'add',
  'plus.circle.fill': 'add-circle',
  'minus.circle.fill': 'remove-circle',
  'xmark': 'close',
  'checkmark': 'check',
  'trash': 'delete',
  'pencil': 'edit',
  'building.columns': 'account-balance',
  // Investment icons
  'chart.line.uptrend.xyaxis': 'trending-up',
  'chart.xyaxis.line': 'show-chart',
  // Tasks icons
  'checklist': 'playlist-add-check',
  'flame.fill': 'local-fire-department',
  'checkmark.circle': 'check-circle-outline',
  'repeat': 'repeat',
  'calendar.badge.clock': 'event',
  'list.bullet': 'format-list-bulleted',
  // Books icons
  'book.fill': 'menu-book',
  // Mood icons
  'face.smiling.fill': 'mood',
  'magnifyingglass': 'search',
  'xmark.circle.fill': 'cancel',
  'note.text': 'note',
  'target': 'gps-fixed',
  // Training icons
  'dumbbell.fill': 'fitness-center',
  'list.bullet.clipboard': 'assignment',
  // Focus icons
  'clock.fill': 'schedule',
  'clock': 'schedule',
  'timer': 'timer',
  'stopwatch': 'timer',
  'clock.badge.checkmark': 'schedule',
  'checkmark.circle.fill': 'check-circle',
  'sun.max.fill': 'wb-sunny',
  'moon.fill': 'dark-mode',
  'circle.lefthalf.filled': 'contrast',
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
  'stop.fill': 'stop',
  'tag': 'label',
  // Achievements icons
  'trophy.fill': 'emoji-events',
  // Welcome/Logo icons
  'sparkles': 'auto-awesome',
  // Data management icons
  'square.and.arrow.down': 'file-download',
  'square.and.arrow.up': 'file-upload',
  'folder': 'folder',
  // Settings icons
  'globe': 'language',
  'banknote.fill': 'payments',
  // Profile icons
  'camera.fill': 'photo-camera',
  'star.fill': 'star',
  'star': 'star-border',
  // Chart icons
  'chart.bar.fill': 'bar-chart',
  // Bank account icons
  'briefcase.fill': 'work',
  // Alerts / confirmations
  'exclamationmark.circle.fill': 'error-outline',
  'exclamationmark.triangle.fill': 'warning',
  'info.circle.fill': 'info',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
