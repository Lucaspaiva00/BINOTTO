import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
} from "react-native";
import MaskInput from "react-native-mask-input";

import { colors } from "@/theme/colors";

import { CountryPhone, COUNTRY_PHONES } from "@/utils/countries";
import { t } from "i18next";

type Props = {
  label?: string;
  value: string;
  onChange: (value: { phone: string; countryCode: string; countryIso: string }) => void;
  error?: string;
  disabled?: boolean;
  countryCode?: string;
  countryIso?: string;
  containerStyle?: any;
  inputStyle?: any;
  countryBoxStyle?: any;
  inputWrapperStyle?: any;
};

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
  .map(name => COUNTRY_PHONES.find(c => c.name === name))
  .filter(Boolean) as CountryPhone[];

priority.sort((a, b) => a.name.localeCompare(b.name));

const others = COUNTRY_PHONES.filter(
  c => !PRIORITY_COUNTRIES.includes(c.name)
);

const FINAL_COUNTRIES = [...priority, ...others];

export function InternationalPhoneInput({
  label,
  value,
  onChange,
  error,
  disabled = false,
  countryCode,
  countryIso,
  containerStyle,
  inputStyle,
  countryBoxStyle,
  inputWrapperStyle,
}: Props) {

  const [country, setCountry] = useState<CountryPhone>(
    COUNTRY_PHONES.find(c => c.name === "Brasil") ?? COUNTRY_PHONES[0]
  );
  const [open, setOpen] = useState(false);

  const handleChange = (masked: string, unmasked?: string) => {
    onChange({
      phone: unmasked ?? "",
      countryCode: country.code,
      countryIso: country.iso
    });
  };

  const handleSelectCountry = (c: CountryPhone) => {
    setCountry(c);
    setOpen(false);

    onChange({
      phone: "",
      countryCode: c.code,
      countryIso: c.iso
    });
  };

  useEffect(() => {
    const match = COUNTRY_PHONES.find(c => c.iso === countryIso);
    if (match) setCountry(match);
  }, [countryIso]);

  return (
    <View
        style={[
            styles.container,
            containerStyle,
        ]}
    >
      {!!label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputWrapper, inputWrapperStyle, error && styles.errorBorder]}>
        {/* COUNTRY SELECT */}
        <TouchableOpacity
          style={[
            styles.countryBox,
            countryBoxStyle,
          ]}
          disabled={disabled}
          onPress={() => setOpen(true)}
        >
          <Image source={country.flag} style={styles.flag} />
          <Text style={styles.countryCode}>{country.code}</Text>
        </TouchableOpacity>

        {/* INPUT COM MASK LIB */}
        <MaskInput
          value={value}
          onChangeText={handleChange}
          mask={country.mask ?? undefined}
          placeholder={country.placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType="phone-pad"
          editable={!disabled}
          style={[
            styles.input,
            inputStyle,
          ]}
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {/* MODAL */}
      <Modal visible={open} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('internationalPhoneInputModal.selectCountry')}</Text>

            <FlatList
              data={FINAL_COUNTRIES}
              keyExtractor={(item) => item.iso}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => handleSelectCountry(item)}
                >
                  <Image source={item.flag} style={styles.flagSmall} />
                  <Text style={styles.countryText}>
                    {item.name} ({item.code})
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setOpen(false)}
            >
              <Text style={styles.closeText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },

  label: {
    fontWeight: "500",
    color: colors.textMuted,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  countryBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: "100%",
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },

  flag: {
    width: 22,
    height: 16,
    borderRadius: 2,
  },

  flagSmall: {
    width: 26,
    height: 18,
    borderRadius: 2,
  },

  countryCode: {
    color: colors.text,
    fontWeight: "700",
  },

  input: {
    flex: 1,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 15,
  },

  errorBorder: {
    borderColor: colors.danger,
  },

  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "500",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: colors.backgroundSurface,
    borderRadius: 20,
    padding: 16,
    maxHeight: "50%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
    opacity: 0.9,
  },

  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  countryText: {
    color: colors.text,
    fontWeight: "500",
  },

  closeBtn: {
    marginTop: 10,
    padding: 12,
    alignItems: "center",
  },

  closeText: {
    color: colors.primary,
    fontWeight: "700",
  },
});