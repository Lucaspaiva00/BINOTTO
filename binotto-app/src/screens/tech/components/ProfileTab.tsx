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
import { TechnicianProfileForm } from "@/types/technician";
import { SelectorModal } from "@/components/settings/SelectorModal";
import { SelectorButton } from "@/components/settings/SelectorButton";
import { Input } from "@/components/common/Input";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { SuccessAlert } from "@/components/common/SuccessAlert";
import { InternationalPhoneInput } from "@/components/common/InternationalPhoneInput";
import { DateInput } from "@/components/common/DataInput";
import dayjs from "dayjs";
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

const OTHER_COUNTRIES_AVAILABILITY = [
  "Estados Unidos",
  "Austrália",
  "Áustria",
  "Bélgica",
  "Japão",
  "México",
  "Países Baixos",
  "Reino Unido",
];

const priority = PRIORITY_COUNTRIES
  .map((name) => COUNTRIES.find((c) => c.name === name))
  .filter((c): c is Country => Boolean(c))
  .sort((a, b) => a.name.localeCompare(b.name));

const others = COUNTRIES
  .filter((c) => !PRIORITY_COUNTRIES.includes(c.name))
  .sort((a, b) => a.name.localeCompare(b.name));

const othersAvailability = COUNTRIES
  .filter(
    (c) =>
      !PRIORITY_COUNTRIES.includes(c.name) &&
      OTHER_COUNTRIES_AVAILABILITY.includes(c.name),
  )
  .sort((a, b) => a.name.localeCompare(b.name));

const SORTED_COUNTRIES = [...priority, ...others];
const SORTED_COUNTRIES_AVAILABILITY = [...priority, ...othersAvailability];

type Props = {
  profile: TechnicianProfileForm;
  setProfile: React.Dispatch<React.SetStateAction<TechnicianProfileForm>>;
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
  const [showPhoneTechnician, setShowPhoneTechnician] = useState(false);
  const [nationalitySelectorVisible, setNationalitySelectorVisible] =
    useState(false);
  const [
    secondNationalitySelectorVisible,
    setSecondNationalitySelectorVisible,
  ] = useState(false);
  const [showSecondNationality, setShowSecondNationality] = useState(false);
  const [countrySelectorVisible, setCountrySelectorVisible] = useState(false);

  const completionPercent = useMemo(() => {
    const fields = [
      profile.fullName,
      profile.nickname,
      profile.email,
      profile.primaryPhoneCountryCode,
      profile.primaryPhone,
      profile.secondaryPhoneCountryCode,
      profile.secondaryPhone,
      profile.birthDate,
      profile.nationality,
      profile.secondNationality,
      profile.cpf,
      profile.cnpj,
      profile.companyFantasyName,
      profile.companyLegalName,
      profile.street,
      profile.number,
      profile.complement,
      profile.city,
      profile.state,
      profile.zipCode,
      profile.country,
    ];

    const filledFields = fields.filter(
      (value) => typeof value === "string" && value.trim().length > 0,
    ).length;

    const filledWorkCountries = profile.workCountries.length > 0 ? 1 : 0;

    const totalFields = fields.length + 1;
    const totalFilled = filledFields + filledWorkCountries;

    return Math.round((totalFilled / totalFields) * 100);
  }, [profile]);

  const selectedCountryName =
    SORTED_COUNTRIES.find((country) => country.code === profile.country)?.name || "";
  const selectedNationalityName =
    SORTED_COUNTRIES.find((country) => country.name === profile.nationality)?.name ||
    "";
  const selectedSecondNationalityName =
    SORTED_COUNTRIES.find((country) => country.name === profile.secondNationality)
      ?.name || "";

  useEffect(() => {
    setShowPhoneTechnician(!!profile?.secondaryPhone);
  }, [profile?.secondaryPhone]);

  useEffect(() => {
    setShowSecondNationality(!!profile?.secondNationality);
  }, [profile?.secondNationality]);

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
          {t("technicianSettingsScreen.profile.heroTitle", {
            name: profile.fullName,
          })}
        </Text>
        <Text style={styles.profileSubtitle}>
          {t("technicianSettingsScreen.profile.heroSubtitle")}
        </Text>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {t("technicianSettingsScreen.profile.progressTitle")}
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
          label={t("technicianSettingsScreen.profile.fullName")}
          value={profile.fullName}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, fullName: value }))
          }
          style={styles.input}
        />

        <Input
          label={t("technicianSettingsScreen.profile.nickname")}
          value={profile.nickname ?? ""}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, nickname: value }))
          }
          style={styles.input}
        />

        <Input
          label={t("technicianSettingsScreen.profile.email")}
          value={profile.email}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, email: value }))
          }
          placeholder="example@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>
            {t("technicianSettingsScreen.profile.whatsapp")}
          </Text>
          {!showPhoneTechnician && (
            <Pressable
              onPress={() => setShowPhoneTechnician(true)}
              style={styles.inlineAction}
            >
              <MaterialCommunityIcons
                name="plus"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.inlineActionText}>
                {t("technicianSettingsScreen.profile.addPhone")}
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
              primaryPhoneCountryIso: countryIso,
            }));
          }}
          containerStyle={styles.phoneContainer}
          inputStyle={styles.phoneInput}
          countryBoxStyle={styles.phoneCountryBox}
          inputWrapperStyle={styles.phoneWrapper}
        />

        {showPhoneTechnician && (
          <>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>
                {t("technicianSettingsScreen.profile.phone")}
              </Text>
              <Pressable
                onPress={() => {
                  setProfile((prev) => ({ ...prev, secondaryPhone: "" }));
                  setShowPhoneTechnician(false);
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
              countryCode={profile.secondaryPhoneCountryCode}
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

        <DateInput
          label={t("technicianSettingsScreen.profile.birthDate")}
          maximumDate={new Date()}
          value={profile.birthDate ? dayjs(profile.birthDate).toDate() : null}
          onChange={(date) =>
            setProfile((prev) => ({
              ...prev,
              birthDate: dayjs(date).format("YYYY-MM-DD"),
            }))
          }
          inputStyle={{
            backgroundColor: colors.backgroundSurface,
            borderColor: colors.borderMutedCard,
          }}
        />

        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>
            {t("technicianSettingsScreen.profile.nationality")}
          </Text>

          {!showSecondNationality && (
            <Pressable
              onPress={() => setShowSecondNationality(true)}
              style={styles.inlineAction}
            >
              <MaterialCommunityIcons
                name="plus"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.inlineActionText}>
                {t("technicianSettingsScreen.profile.addSecondNationality")}
              </Text>
            </Pressable>
          )}
        </View>

        <SelectorButton
          label={selectedNationalityName || "Selecione o país"}
          onPress={() => setNationalitySelectorVisible(true)}
        />

        {showSecondNationality && (
          <>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>
                {t("technicianSettingsScreen.profile.secondNationality")}
              </Text>

              <Pressable
                onPress={() => {
                  setProfile((prev) => ({
                    ...prev,
                    secondNationality: "",
                  }));

                  setShowSecondNationality(false);
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

            <SelectorButton
              label={
                selectedSecondNationalityName ||
                t("technicianSettingsScreen.profile.selectSecondNationality")
              }
              onPress={() => setSecondNationalitySelectorVisible(true)}
            />
          </>
        )}

        <Input
          label="CPF"
          value={profile.cpf}
          maxLength={14}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, cpf: value }))
          }
          placeholder="000.000.000-00"
          style={styles.input}
        />

        <Input
          label="CNPJ"
          maxLength={18}
          value={profile.cnpj}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, cnpj: value }))
          }
          placeholder="00.000.000/0000-00"
          style={styles.input}
        />

        <Input
          label={t("technicianSettingsScreen.profile.companyFantasyName")}
          value={profile.companyFantasyName}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, companyFantasyName: value }))
          }
          placeholder={t(
            "technicianSettingsScreen.profile.companyFantasyNamePlaceholder",
          )}
          style={styles.input}
        />

        <Input
          label={t("technicianSettingsScreen.profile.companyLegalName")}
          value={profile.companyLegalName}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, companyLegalName: value }))
          }
          placeholder={t(
            "technicianSettingsScreen.profile.companyLegalNamePlaceholder",
          )}
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>
          {t("technicianSettingsScreen.profile.address")}
        </Text>

        <Input
          label={t("technicianSettingsScreen.profile.street")}
          value={profile.street}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, street: value }))
          }
          placeholder={t("technicianSettingsScreen.profile.streetPlaceholder")}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Input
              label={t("technicianSettingsScreen.profile.number")}
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
              label={t("technicianSettingsScreen.profile.complement")}
              value={profile.complement}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, complement: value }))
              }
              placeholder={t(
                "technicianSettingsScreen.profile.complementPlaceholder",
              )}
              style={styles.input}
            />
          </View>
        </View>

        <Input
          label={t("technicianSettingsScreen.profile.city")}
          value={profile.city}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, city: value }))
          }
          placeholder={t("technicianSettingsScreen.profile.cityPlaceholder")}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Input
              label={t("technicianSettingsScreen.profile.state")}
              value={profile.state}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, state: value }))
              }
              placeholder={t(
                "technicianSettingsScreen.profile.statePlaceholder",
              )}
              style={styles.input}
            />
          </View>

          <View style={styles.col}>
            <Input
              label={t("technicianSettingsScreen.profile.zipCode")}
              maxLength={9}
              value={profile.zipCode}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, zipCode: value }))
              }
              placeholder={t(
                "technicianSettingsScreen.profile.zipCodePlaceholder",
              )}
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>
          {t("technicianSettingsScreen.profile.country")}
        </Text>
        <SelectorButton
          label={
            selectedCountryName ||
            t("technicianSettingsScreen.profile.selectCountry")
          }
          onPress={() => setCountrySelectorVisible(true)}
        />

        <Text style={styles.sectionTitle}>
          {t("technicianSettingsScreen.profile.availability")}
        </Text>

        <Text style={styles.helperText}>
          {t("technicianSettingsScreen.profile.workCountries")}
        </Text>

        <View style={styles.badgesContainer}>
          {SORTED_COUNTRIES_AVAILABILITY.map((country) => {
            const selected = profile.workCountries.includes(country.code);

            return (
              <Pressable
                key={country.code}
                style={[
                  styles.countryBadge,
                  selected && styles.countryBadgeSelected,
                ]}
                onPress={() => {
                  setProfile((prev) => ({
                    ...prev,
                    workCountries: selected
                      ? prev.workCountries.filter(
                          (code) => code !== country.code,
                        )
                      : [...prev.workCountries, country.code],
                  }));
                }}
              >
                <Text
                  style={[
                    styles.countryBadgeText,
                    selected && styles.countryBadgeTextSelected,
                  ]}
                >
                  {country.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.button, savingLoading && styles.buttonDisabled]}
          onPress={onSave}
          disabled={savingLoading}
        >
          <Text style={styles.buttonText}>
            {savingLoading
              ? t("technicianSettingsScreen.profile.saving")
              : t("technicianSettingsScreen.profile.save")}
          </Text>
        </Pressable>
      </View>

      {/* Select de País */}
      <SelectorModal
        visible={countrySelectorVisible}
        title={t("technicianSettingsScreen.profile.selectCountry")}
        subtitle={t("technicianSettingsScreen.profile.countryModalSubtitle")}
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

      {/* Select de Nacionalidade */}
      <SelectorModal
        visible={nationalitySelectorVisible}
        title={t("technicianSettingsScreen.profile.nationality")}
        subtitle={t(
          "technicianSettingsScreen.profile.nationalityModalSubtitle",
        )}
        options={SORTED_COUNTRIES.map((country) => ({
          value: country.name,
          label: country.name,
        }))}
        selectedValue={profile.nationality}
        onClose={() => setNationalitySelectorVisible(false)}
        onSelect={(value) => {
          setProfile((prev) => ({
            ...prev,
            nationality: value,
          }));

          setNationalitySelectorVisible(false);
        }}
      />

      {/* Select de Segunda Nacionalidade */}
      <SelectorModal
        visible={secondNationalitySelectorVisible}
        title={t("technicianSettingsScreen.profile.secondNationality")}
        subtitle={t(
          "technicianSettingsScreen.profile.secondNationalityModalSubtitle",
        )}
        options={SORTED_COUNTRIES.map((country) => ({
          value: country.name,
          label: country.name,
        }))}
        selectedValue={profile.secondNationality ?? ""}
        onClose={() => setSecondNationalitySelectorVisible(false)}
        onSelect={(value) => {
          setProfile((prev) => ({
            ...prev,
            secondNationality: value,
          }));

          setSecondNationalitySelectorVisible(false);
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

  helperText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: -4,
    marginBottom: 4,
  },

  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  countryBadge: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.backgroundBase,
    justifyContent: "center",
    alignItems: "center",
  },

  countryBadgeSelected: {
    borderColor: colors.primary,
    backgroundColor: "transparent",
  },

  countryBadgeText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },

  countryBadgeTextSelected: {
    color: colors.primary,
  },
});
