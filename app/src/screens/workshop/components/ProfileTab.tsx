import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "@/theme/colors";
import { WorkshopProfileForm } from "@/types/workshop";
import { SelectorModal } from "@/components/settings/SelectorModal";
import { SelectorButton } from "@/components/settings/SelectorButton";
import { Input } from "@/components/common/Input";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { SuccessAlert } from "@/components/common/SuccessAlert";
import { InternationalPhoneInput } from "@/components/common/InternationalPhoneInput";
import { COUNTRIES, Country } from "@/utils/countries";

const PRIORITY_COUNTRIES = [
  "Brasil",
  "Alemanha",
  "Itália",
  "França",
  "Portugal",
  "Espanha",
  "Suíça",
];

const priority = PRIORITY_COUNTRIES
  .map((name) => COUNTRIES.find((c) => c.name === name))
  .filter((c): c is Country => Boolean(c))
  .sort((a, b) => a.name.localeCompare(b.name));

const others = COUNTRIES
  .filter((c) => !PRIORITY_COUNTRIES.includes(c.name))
  .sort((a, b) => a.name.localeCompare(b.name));

const SORTED_COUNTRIES = [...priority, ...others];

const PAYMENT_TERMS = [
  { value: "semanal", labelKey: "weekly" },
  { value: "quinzenal", labelKey: "biweekly" },
  { value: "mensal", labelKey: "monthly" },
  { value: "personalizado", labelKey: "custom" },
] as const;

type Props = {
  profile: WorkshopProfileForm;
  setProfile: React.Dispatch<React.SetStateAction<WorkshopProfileForm>>;
  onSave: () => void;
  loading: boolean;
  savingLoading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  success: string | null;
  setSuccess: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function ProfileTab({
  profile,
  setProfile,
  onSave,
  loading,
  savingLoading,
  error,
  setError,
  success,
  setSuccess,
}: Props) {
  const { t } = useTranslation();
  const [showPhoneWorkshop, setShowPhoneWorkshop] = useState(false);
  const [showEmailWorkshop, setShowEmailWorkshop] = useState(false);
  const [countrySelectorVisible, setCountrySelectorVisible] = useState(false);
  const [paymentSelectorVisible, setPaymentSelectorVisible] = useState(false);

  const completionPercent = useMemo(() => {
    const values = [
      profile.tradeName,
      profile.companyName,
      profile.responsible,
      profile.email,
      profile.primaryPhoneCountryCode,
      profile.primaryPhone,
      profile.secondaryPhoneCountryCode,
      profile.secondaryPhone,
      profile.cnpj,
      profile.street,
      profile.number,
      profile.city,
      profile.state,
      profile.zip,
      profile.country,
      profile.paymentTerms,
    ];

    const filled = values.filter((value) => value.trim().length > 0).length;
    return Math.round((filled / values.length) * 100);
  }, [profile]);

  const selectedCountryName =
    COUNTRIES.find((country) => country.code === profile.country)?.name || "";
  const selectedPaymentLabel = PAYMENT_TERMS.find(
    (item) => item.value === profile.paymentTerms,
  );

  useEffect(() => {
    setShowPhoneWorkshop(!!profile?.secondaryPhone);
  }, [profile?.secondaryPhone]);

  useEffect(() => {
    setShowEmailWorkshop(!!profile?.email2);
  }, [profile?.email2]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.profileContent}>
      <View style={styles.heroCard}>
        <Text style={styles.profileTitle}>
          {t("workshopSettingsScreen.profile.heroTitle", {
            tradeName:
              profile.tradeName ||
              t("workshopSettingsScreen.profile.workshopFallback"),
          })}
        </Text>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {t("workshopSettingsScreen.profile.completeProfile")}
          </Text>
          <Text style={styles.progressValue}>{completionPercent}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.max(6, completionPercent)}%` },
            ]}
          />
        </View>
      </View>

      {error && (
        <View>
          <ErrorAlert message={error} onClose={() => setError(null)} />
        </View>
      )}

      {success && (
        <View>
          <SuccessAlert message={success} onClose={() => setSuccess(null)} />
        </View>
      )}

      <View style={styles.formCard}>
        <Input
          label={t("workshopSettingsScreen.profile.fields.cnpj")}
          value={profile.cnpj}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, cnpj: value }))
          }
          placeholder="00.000.000/0000-00"
          style={styles.input}
        />

        <Input
          label={t("workshopSettingsScreen.profile.fields.tradeName")}
          value={profile.tradeName}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, tradeName: value }))
          }
          placeholder="Officina Rossi"
          style={styles.input}
        />

        <Input
          label={t("workshopSettingsScreen.profile.fields.companyName")}
          value={profile.companyName}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, companyName: value }))
          }
          placeholder={t(
            "workshopSettingsScreen.profile.placeholders.companyName",
          )}
          style={styles.input}
        />

        <Input
          label={t("workshopSettingsScreen.profile.fields.responsible")}
          value={profile.responsible}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, responsible: value }))
          }
          placeholder={t(
            "workshopSettingsScreen.profile.placeholders.responsible",
          )}
          style={styles.input}
        />

        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>
            {t("workshopSettingsScreen.profile.fields.email")}
          </Text>
          {!showEmailWorkshop && (
            <Pressable
              onPress={() => setShowEmailWorkshop(true)}
              style={styles.inlineAction}
            >
              <MaterialCommunityIcons
                name="plus"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.inlineActionText}>
                {t("workshopSettingsScreen.profile.addEmail")}
              </Text>
            </Pressable>
          )}
        </View>

        <Input
          value={profile.email}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, email: value }))
          }
          placeholder="officina@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        {showEmailWorkshop && (
          <>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>
                {t("workshopSettingsScreen.profile.fields.additionalEmail")}
              </Text>
              <Pressable
                onPress={() => {
                  setShowEmailWorkshop(false);
                  setProfile((prev) => ({ ...prev, email2: "" }));
                }}
                hitSlop={10}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>

            <Input
              value={profile.email2}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, email2: value }))
              }
              placeholder="example@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </>
        )}

        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>
            {t("workshopSettingsScreen.profile.fields.whatsapp")}
          </Text>
          {!showPhoneWorkshop && (
            <Pressable
              onPress={() => setShowPhoneWorkshop(true)}
              style={styles.inlineAction}
            >
              <MaterialCommunityIcons
                name="plus"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.inlineActionText}>
                {t("workshopSettingsScreen.profile.addPhone")}
              </Text>
            </Pressable>
          )}
        </View>

        <InternationalPhoneInput
          value={profile.primaryPhone}
          countryCode={profile.primaryPhoneCountryCode}
          countryIso={profile.primaryPhoneCountryIso}
          onChange={({ phone, countryCode, countryIso }) => {
            setProfile((prev) => ({
              ...prev,
              primaryPhone: phone,
              primaryPhoneCountryCode: countryCode,
              primaryPhoneCountryIso: countryIso
            }));
          }}
          containerStyle={styles.phoneContainer}
          inputStyle={styles.phoneInput}
          countryBoxStyle={styles.phoneCountryBox}
          inputWrapperStyle={styles.phoneWrapper}
        />

        {showPhoneWorkshop && (
          <>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>
                {t("workshopSettingsScreen.profile.fields.phone")}
              </Text>
              <Pressable
                onPress={() => {
                  setProfile((prev) => ({ ...prev, secondaryPhone: "" }));
                  setShowPhoneWorkshop(false);
                }}
                hitSlop={10}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>

            <InternationalPhoneInput
              value={profile.secondaryPhone}
              countryCode={profile.secondaryPhone}
              countryIso={profile.secondaryPhoneCountryIso}
              onChange={({ phone, countryCode, countryIso }) => {
                setProfile((prev) => ({
                  ...prev,
                  secondaryPhone: phone,
                  secondaryPhoneCountryCode: countryCode,
                  secondaryPhoneCountryIso: countryIso
                }));
              }}
              containerStyle={styles.phoneContainer}
              inputStyle={styles.phoneInput}
              countryBoxStyle={styles.phoneCountryBox}
              inputWrapperStyle={styles.phoneWrapper}
            />
          </>
        )}

        <Text style={styles.sectionTitle}>
          {t("workshopSettingsScreen.profile.addressSection")}
        </Text>

        <Input
          label={t("workshopSettingsScreen.profile.fields.street")}
          value={profile.street}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, street: value }))
          }
          placeholder={t("workshopSettingsScreen.profile.placeholders.street")}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Input
              label={t("workshopSettingsScreen.profile.fields.number")}
              value={profile.number}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, number: value }))
              }
              placeholder="123"
              style={styles.input}
            />
          </View>

          <View style={styles.col}>
            <Input
              label={t("workshopSettingsScreen.profile.fields.complement")}
              value={profile.complement}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, complement: value }))
              }
              placeholder={t(
                "workshopSettingsScreen.profile.placeholders.complement",
              )}
              style={styles.input}
            />
          </View>
        </View>

        <Input
          label={t("workshopSettingsScreen.profile.fields.city")}
          value={profile.city}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, city: value }))
          }
          placeholder={t("workshopSettingsScreen.profile.placeholders.city")}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Input
              label={t("workshopSettingsScreen.profile.fields.state")}
              value={profile.state}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, state: value }))
              }
              placeholder={t(
                "workshopSettingsScreen.profile.placeholders.state",
              )}
              style={styles.input}
            />
          </View>

          <View style={styles.col}>
            <Input
              label={t("workshopSettingsScreen.profile.fields.zip")}
              value={profile.zip}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, zip: value }))
              }
              placeholder={t("workshopSettingsScreen.profile.fields.zip")}
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>
          {t("workshopSettingsScreen.profile.fields.country")}
        </Text>
        <SelectorButton
          label={
            selectedCountryName ||
            t("workshopSettingsScreen.profile.selectCountry")
          }
          onPress={() => setCountrySelectorVisible(true)}
        />

        <Text style={styles.fieldLabel}>
          {t("workshopSettingsScreen.profile.fields.paymentTerms")}
        </Text>

        <SelectorButton
          label={
            selectedPaymentLabel
              ? t(
                  `workshopSettingsScreen.profile.paymentTerms.${selectedPaymentLabel.labelKey}`,
                )
              : t("workshopSettingsScreen.profile.selectPaymentTerm")
          }
          onPress={() => setPaymentSelectorVisible(true)}
        />

        <Pressable
          style={[styles.button, savingLoading && styles.buttonDisabled]}
          onPress={onSave}
          disabled={savingLoading}
        >
          <Text style={styles.buttonText}>
            {savingLoading
              ? t("workshopSettingsScreen.profile.saving")
              : t("workshopSettingsScreen.profile.save")}
          </Text>
        </Pressable>
      </View>

      <SelectorModal
        visible={countrySelectorVisible}
        title={t("workshopSettingsScreen.profile.countryModalTitle")}
        subtitle={t("workshopSettingsScreen.profile.countryModalSubtitle")}
        options={SORTED_COUNTRIES.map((country) => ({
          value: country.code,
          label: country.name,
        }))}
        selectedValue={profile.country}
        onClose={() => setCountrySelectorVisible(false)}
        onSelect={(value) => {
          setProfile((prev) => ({ ...prev, country: value }));
          setCountrySelectorVisible(false);
        }}
      />

      <SelectorModal
        visible={paymentSelectorVisible}
        title={t("workshopSettingsScreen.profile.paymentModalTitle")}
        subtitle={t("workshopSettingsScreen.profile.paymentModalSubtitle")}
        options={PAYMENT_TERMS.map((item) => ({
          value: item.value,
          label: t(
            `workshopSettingsScreen.profile.paymentTerms.${item.labelKey}`,
          ),
        }))}
        selectedValue={profile.paymentTerms}
        onClose={() => setPaymentSelectorVisible(false)}
        onSelect={(value) => {
          setProfile((prev) => ({ ...prev, paymentTerms: value }));
          setPaymentSelectorVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  profileContent: {
    gap: 8,
  },

  heroCard: {
    borderRadius: 18,
    padding: 0,
    gap: 8,
  },

  profileTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
  },

  profileSubtitle: {
    color: colors.textMuted,
    lineHeight: 20,
  },

  progressCard: {
    borderRadius: 16,
    padding: 4,
    gap: 10,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },

  progressValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },

  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  formCard: {
    borderRadius: 16,
    padding: 8,
    gap: 10,
  },

  input: {
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },

  fieldLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },

  fieldHeader: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  inlineActionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },

  sectionTitle: {
    marginTop: 8,
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  col: {
    flex: 1,
    gap: 10,
  },

  button: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  buttonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "700",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  phoneContainer: {
    marginBottom: 6,
  },

  phoneWrapper: {
    backgroundColor: colors.backgroundSurface,
    borderWidth: 0,
  },

  phoneInput: {
    backgroundColor: colors.backgroundSurface,
    color: colors.text,
  },

  phoneCountryBox: {
    backgroundColor: colors.backgroundSurface,
    height: 41,
  },
});
