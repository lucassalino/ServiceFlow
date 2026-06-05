import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Radii, BorderWidth, Typography } from '@/constants';
import { MINISTRY_ICONS, MINISTRY_COLORS, MINISTRY_ICON_EMOJI } from '@/constants/ministries';

interface MinistryFormValues {
  name: string;
  icon: string;
  color: string;
}

interface Props {
  initialValues?: Partial<MinistryFormValues>;
  onSubmit: (values: MinistryFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
  error?: string | null;
}

export function MinistryForm({
  initialValues,
  onSubmit,
  isLoading,
  submitLabel,
  error,
}: Props) {
  const scheme = useTheme();
  const s = styles(scheme);

  const [name, setName] = React.useState(initialValues?.name ?? '');
  const [icon, setIcon] = React.useState(initialValues?.icon ?? MINISTRY_ICONS[0].key);
  const [color, setColor] = React.useState(initialValues?.color ?? MINISTRY_COLORS[0]);

  function handleSubmit() {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), icon, color });
  }

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      {/* Name */}
      <View style={s.field}>
        <Text style={s.label}>Nome do ministério</Text>
        <TextInput
          style={s.input}
          placeholder="ex: Louvor, Infantil, Mídia..."
          placeholderTextColor={Colors.gray400}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoFocus
        />
      </View>

      {/* Icon picker */}
      <View style={s.field}>
        <Text style={s.label}>Ícone</Text>
        <View style={s.grid}>
          {MINISTRY_ICONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[s.iconOption, icon === item.key && s.iconOptionSelected]}
              onPress={() => setIcon(item.key)}
            >
              <Text style={s.iconEmoji}>{MINISTRY_ICON_EMOJI[item.key]}</Text>
              <Text style={[s.iconLabel, icon === item.key && s.iconLabelSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Color picker */}
      <View style={s.field}>
        <Text style={s.label}>Cor de identificação</Text>
        <View style={s.colorRow}>
          {MINISTRY_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[s.colorSwatch, { backgroundColor: c }, color === c && s.colorSwatchSelected]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
        {/* Preview */}
        <View style={[s.preview, { borderLeftColor: color }]}>
          <Text style={s.previewEmoji}>{MINISTRY_ICON_EMOJI[icon]}</Text>
          <Text style={s.previewName}>{name || 'Nome do ministério'}</Text>
        </View>
      </View>

      {error && <Text style={s.errorText}>{error}</Text>}

      <TouchableOpacity style={s.submitButton} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color={Colors.gray50} />
        ) : (
          <Text style={s.submitButtonText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// React needs to be imported for useState in non-JSX transform setups
import React from 'react';

const styles = (scheme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      padding: Spacing[6],
      gap: Spacing[6],
      paddingBottom: Spacing[10],
    },
    field: { gap: Spacing[2] },
    label: {
      fontFamily: Typography.fonts.medium,
      fontSize: Typography.sizes.sm,
      color: Colors.text.secondary[scheme],
    },
    input: {
      height: 48,
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
      borderRadius: Radii.md,
      paddingHorizontal: Spacing[4],
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.base,
      color: Colors.text.primary[scheme],
      backgroundColor: Colors.surface[scheme],
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing[2],
    },
    iconOption: {
      width: '18%',
      paddingVertical: Spacing[2],
      borderRadius: Radii.sm,
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
      alignItems: 'center',
      gap: 2,
      backgroundColor: Colors.surface[scheme],
    },
    iconOptionSelected: {
      borderColor: Colors.text.primary[scheme],
      backgroundColor: Colors.surfaceSecondary[scheme],
    },
    iconEmoji: { fontSize: 20 },
    iconLabel: {
      fontFamily: Typography.fonts.regular,
      fontSize: 9,
      color: Colors.text.tertiary[scheme],
      textAlign: 'center',
    },
    iconLabelSelected: {
      color: Colors.text.primary[scheme],
    },
    colorRow: {
      flexDirection: 'row',
      gap: Spacing[3],
    },
    colorSwatch: {
      width: 32,
      height: 32,
      borderRadius: Radii.full,
    },
    colorSwatchSelected: {
      borderWidth: 2.5,
      borderColor: Colors.text.primary[scheme],
    },
    preview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing[3],
      marginTop: Spacing[3],
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[4],
      backgroundColor: Colors.surface[scheme],
      borderRadius: Radii.md,
      borderWidth: BorderWidth.hairline,
      borderColor: Colors.border[scheme],
      borderLeftWidth: 3,
    },
    previewEmoji: { fontSize: 20 },
    previewName: {
      fontFamily: Typography.fonts.semiBold,
      fontSize: Typography.sizes.base,
      color: Colors.text.primary[scheme],
    },
    errorText: {
      fontFamily: Typography.fonts.regular,
      fontSize: Typography.sizes.sm,
      color: Colors.error,
      textAlign: 'center',
    },
    submitButton: {
      height: 48,
      backgroundColor: Colors.text.primary[scheme],
      borderRadius: Radii.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing[2],
    },
    submitButtonText: {
      fontFamily: Typography.fonts.semiBold,
      fontSize: Typography.sizes.base,
      color: Colors.background[scheme],
    },
  });
