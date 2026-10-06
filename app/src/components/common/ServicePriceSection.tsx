import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "@/theme/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatMoneyOrDash } from "@/utils/currency";
import ServicePricingService from "@/services/ServicePricingService";
import {
  PriceEntry,
  PricingItem,
  PricingProfile,
  PriceType,
  ServicePricesResponse,
} from "@/types/pricing";
import { ErrorAlert } from "./ErrorAlert";
import { Text } from "./Text";

type Props = {
  serviceId: number;
  profile: PricingProfile;
  moeda?: string | null;
};

const itemLabels: Record<PricingItem, string> = {
  carro: "Reparação",
  desmontagem: "Desmontagem",
};

export default function ServicePriceSection({
  serviceId,
  profile,
  moeda = "BRL",
}: Props) {
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const [prices, setPrices] = useState<ServicePricesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ServicePricingService.getPrices(profile, serviceId);
      setPrices(response.data);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            t("common.error"),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [profile, serviceId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const ownPrefix = profile === "TECNICO" ? "tecnico" : "oficina";
  const otherPrefix = profile === "TECNICO" ? "oficina" : "tecnico";

  const save = async (
    item: PricingItem,
    entry: PriceEntry,
    field: "price" | "suggestion" = "price",
  ) => {
    const key = `${field}-${item}`;
    const raw = drafts[key] ?? String(entry.valor ?? "");
    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value) || value < 0 || (entry.tipo === "porcentagem" && value > 100)) {
      setError(t("common.invalidValue", "Valor inválido"));
      return;
    }

    try {
      setSaving(key);
      if (field === "suggestion") {
        await ServicePricingService.updateSuggestion(serviceId, { item, valor: value });
      } else {
        await ServicePricingService.updatePrice(profile, serviceId, {
          item,
          tipo: entry.tipo,
          valor: value,
        });
      }
      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || t("common.error"),
      );
    } finally {
      setSaving(null);
    }
  };

  const renderEntry = (
    item: PricingItem,
    entry: PriceEntry | null | undefined,
    field: "price" | "suggestion" = "price",
  ) => {
    if (!entry) return null;
    const key = `${field}-${item}`;
    const editable =
      field === "suggestion"
        ? profile === "TECNICO" && entry.habilitado_preenchimento_app === true
        : entry.habilitado_preenchimento_app === true;
    const value = drafts[key] ?? String(entry.valor ?? "");

    return (
      <View style={styles.entry} key={key}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryTitle}>
            {field === "suggestion" ? "Sugestão do técnico" : "Valor"}
          </Text>
          <Text style={styles.entryValue}>
            {entry.tipo === "porcentagem"
              ? `${entry.valor}%`
              : formatMoneyOrDash(entry.valor, moeda || "BRL", locale)}
          </Text>
        </View>
        {entry.tipo === "porcentagem" && prices?.precos_calculados?.[item] && (
          <Text style={styles.calculated}>
            {formatMoneyOrDash(
              prices.precos_calculados[item][profile === "TECNICO" ? "tecnico" : "oficina"],
              moeda || "BRL",
              locale,
            )}
          </Text>
        )}
        {editable && (
          <View style={styles.editRow}>
            <TextInput
              value={value}
              onChangeText={(next) =>
                setDrafts((current) => ({ ...current, [key]: next }))
              }
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <Pressable
              style={styles.saveButton}
              onPress={() => save(item, entry, field)}
              disabled={saving === key}
            >
              {saving === key ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveText}>{t("common.save")}</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!prices) return null;
  const hasDetailedPrices = Object.values(prices.precos_detalhados ?? {}).some(
    Boolean,
  );
  if (!hasDetailedPrices) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Preços</Text>
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      {(["carro", "desmontagem"] as PricingItem[]).map((item) => {
        const own = prices.precos_detalhados?.[
          `${ownPrefix}_${item}` as keyof typeof prices.precos_detalhados
        ] as PriceEntry | null | undefined;
        const other = prices.precos_detalhados?.[
          `${otherPrefix}_${item}` as keyof typeof prices.precos_detalhados
        ] as PriceEntry | null | undefined;
        const suggestion = prices.precos_detalhados?.[
          `tecnico_sugestao_${item}` as keyof typeof prices.precos_detalhados
        ] as PriceEntry | null | undefined;

        return (
          <View style={styles.item} key={item}>
            <Text style={styles.itemTitle}>{itemLabels[item]}</Text>
            {renderEntry(item, own)}
            {renderEntry(item, other)}
            {renderEntry(item, suggestion, "suggestion")}
            <Text style={styles.total}>
              Total:{" "}
              {formatMoneyOrDash(
                prices.precos_calculados?.[item]?.[profile === "TECNICO" ? "tecnico" : "oficina"],
                moeda || prices.moeda || "BRL",
                locale,
              )}
            </Text>
          </View>
        );
      })}
      <View style={styles.totalBox}>
        <Text style={styles.totalTitle}>Total geral</Text>
        <Text style={styles.totalAmount}>
          {formatMoneyOrDash(
            prices.precos_totais?.[profile === "TECNICO" ? "tecnico" : "oficina"],
            moeda || prices.moeda || "BRL",
            locale,
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.backgroundCard,
    gap: 10,
  },
  title: { color: colors.text, fontSize: 17, fontWeight: "700" },
  item: { gap: 8 },
  itemTitle: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  entry: { padding: 10, borderRadius: 10, backgroundColor: colors.backgroundBase },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  entryTitle: { color: colors.textMuted, fontSize: 13 },
  entryValue: { color: colors.text, fontSize: 13, fontWeight: "700" },
  calculated: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  editRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    paddingHorizontal: 10,
  },
  saveButton: {
    minWidth: 72,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  saveText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  total: { color: colors.text, fontWeight: "700", textAlign: "right" },
  totalBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalTitle: { color: colors.text, fontWeight: "700" },
  totalAmount: { color: colors.primary, fontWeight: "700" },
});
