import { useState, useEffect } from 'react';
import { TextInput, TextInputProps, View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface CurrencyInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeValue: (value: string) => void;
  currency: 'BRL' | 'USD';
  textColor?: string;
  prefixColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function CurrencyInput({
  value,
  onChangeValue,
  currency,
  textColor = '#000',
  prefixColor = '#666',
  style,
  containerStyle,
  ...props
}: CurrencyInputProps) {
  const currencySymbol = currency === 'BRL' ? 'R$' : '$';
  const decimalSeparator = currency === 'BRL' ? ',' : '.';
  const thousandSeparator = currency === 'BRL' ? '.' : ',';

  const formatDisplayValue = (rawValue: string): string => {
    // Remove all non-digits
    const digits = rawValue.replace(/\D/g, '');

    if (!digits) return `0${decimalSeparator}00`;

    // Pad with zeros if needed
    const paddedDigits = digits.padStart(3, '0');

    // Split into integer and decimal parts
    const integerPart = paddedDigits.slice(0, -2);
    const decimalPart = paddedDigits.slice(-2);

    // Remove leading zeros from integer part, but keep at least one digit
    const cleanInteger = integerPart.replace(/^0+/, '') || '0';

    // Add thousand separators
    const formattedInteger = cleanInteger.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      thousandSeparator
    );

    return `${formattedInteger}${decimalSeparator}${decimalPart}`;
  };

  const handleTextChange = (text: string) => {
    // Extract only digits from input
    const newDigits = text.replace(/\D/g, '');
    onChangeValue(newDigits);
  };

  const displayValue = formatDisplayValue(value);

  // Convert raw digits to numeric value (for saving)
  const getNumericValue = (): number => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return 0;
    return parseInt(digits, 10) / 100;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.prefix, { color: prefixColor }]}>{currencySymbol}</Text>
      <TextInput
        {...props}
        style={[styles.input, { color: textColor }, style]}
        value={displayValue}
        onChangeText={handleTextChange}
        keyboardType="number-pad"
        selectTextOnFocus
      />
    </View>
  );
}

// Helper function to convert raw digits to float
export function currencyToFloat(rawValue: string): number {
  const digits = rawValue.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

// Helper function to convert float to raw digits
export function floatToCurrency(value: number): string {
  return Math.round(value * 100).toString();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefix: {
    fontSize: 16,
    marginRight: 4,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
});
