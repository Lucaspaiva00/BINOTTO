import React, { useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "@/theme/colors";
import { Mail, MessageCircle, Phone } from "lucide-react-native";
import { TextInput } from "react-native-gesture-handler";
import { ErrorAlert } from "@/components/common/ErrorAlert";

type Props = {
  phone?: string;
  whatsapp?: string;
  email?: string;
  loading: boolean,
  onSendEmail: (subject: string, message: string) => void;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function SupportTab({
  phone = "+39 348 421 7201",
  whatsapp = "393484217201",
  email = "admin@jbinotto.com",
  loading,
  onSendEmail,
  error,
  setError,
}: Props) {
  const { t } = useTranslation();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const isFormValid =
    subject.trim().length > 0 && message.trim().length > 0;

  return (
    <View style={styles.card}>
      {error && (
        <View>
          <ErrorAlert message={error} onClose={() => setError(null)} />
        </View>
      )}

      <SupportAction
        icon="phone"
        title={t("technicianSettingsScreen.support.phone")}
        subtitle={phone}
        onPress={() => Linking.openURL(`tel:${phone}`)}
      />
      <SupportAction
        icon="whatsapp"
        title="WhatsApp"
        subtitle={t("technicianSettingsScreen.support.whatsappSubtitle")}
        accent="green"
        onPress={() => Linking.openURL(`https://wa.me/${whatsapp}`)}
      />

      <SupportAction
        icon="email-outline"
        title={t("technicianSettingsScreen.support.email")}
        subtitle={email}
        onPress={() => Linking.openURL(`mailto:${email}`)}
      />

      <View style={styles.emailForm}>
        <TextInput
          style={styles.input}
          placeholder={t("technicianSettingsScreen.support.subject")}
          placeholderTextColor={colors.textMuted}
          value={subject}
          onChangeText={setSubject}
        />

        <TextInput
          style={[styles.input, styles.messageInput]}
          placeholder={t("technicianSettingsScreen.support.message")}
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
        />

        <Pressable
          style={[
            styles.sendButton,
            (!isFormValid || loading) && styles.sendButtonDisabled,
          ]}
          onPress={() => onSendEmail(subject, message)}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.sendText}>
              {t("technicianSettingsScreen.support.send")}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function SupportAction({
  icon,
  title,
  subtitle,
  onPress,
  accent,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  accent?: "green";
}) {
  const highlighted = accent === "green";

  return (
    <Pressable
      style={[styles.item, highlighted && styles.itemWhatsapp]}
      onPress={onPress}
    >
      {icon == "phone" ? (
        <Phone
          size={20}
          color={highlighted ? "#22c55e" : colors.textMuted}
          strokeWidth={2}
        />
      ) : icon == "whatsapp" ? (
        <MessageCircle
          size={20}
          color={highlighted ? "#22c55e" : colors.textMuted}
          strokeWidth={2}
        />
      ) : (
        <Mail
          size={20}
          color={highlighted ? "#22c55e" : colors.textMuted}
          strokeWidth={2}
        />
      )}

      <View style={styles.copy}>
        <Text style={[styles.title, highlighted && styles.titleWhatsapp]}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    //  padding: 16,
    gap: 12,
  },

  item: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    backgroundColor: colors.backgroundBase,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  itemWhatsapp: {
    borderColor: "#174726",
    backgroundColor: "#101d13",
  },

  copy: {
    flex: 1,
    gap: 2,
  },

  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },

  titleWhatsapp: {
    color: "#22c55e",
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },

  emailForm: {
    marginTop: 4,
    gap: 12,
  },

  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    backgroundColor: colors.backgroundBase,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  messageInput: {
    height: 120,
    paddingTop: 12,
  },

  sendButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  sendText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "700",
  },

  sendButtonDisabled: {
    opacity: 0.6,
  },
});
