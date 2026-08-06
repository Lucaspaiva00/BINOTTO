import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors } from "@/theme/colors";
import { isServiceAvailableForTechnician } from "@/utils/serviceAvailability";
import { colorStatus } from "@/services/ColorStatusService";
import { getStatusLabelKey } from "@/utils/status";
import { Calendar, Car, Wrench } from "lucide-react-native";
import { formatDate } from "@/utils/date";
import { formatCurrency } from "@/utils/currency";

type ServiceCardTechnicianProps = {
  service: any;
  locale: string;
  technicianId?: number;
  loadingFinish?: boolean;
  onPress: (serviceId: number) => void;
  onAccept?: (
    serviceId: number,
    start: string,
    end: string,
  ) => void;
  onReject?: (serviceId: number) => void;
  onFinish?: (serviceId: number) => void;
  t: (key: string) => string;
};

export default function ServiceCardTechnician({
  service,
  locale,
  technicianId,
  loadingFinish,
  onPress,
  onAccept,
  onReject,
  onFinish,
  t,
}: ServiceCardTechnicianProps) {
  const inExecution = service.status === "em_execucao";
  const isComingSoon = service.status === "em_breve";
  const isAvailable = isServiceAvailableForTechnician(service, technicianId);
  const waitingApproval = service.status === "aguardando_aprovacao";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress(Number(service.id))}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleArea}>
            <View style={styles.leftContent}>
              <Wrench size={18} color={colors.primary} />
            </View>

            <Text style={styles.titleText}>
              {service.tecnico_label ? service.tecnico_label : null}
            </Text>
          </View>

          <View style={styles.rightContent}>
            <View
              style={[
                styles.badge,
                {
                  borderWidth: 1,

                  backgroundColor: `${colorStatus(service.status, true)}20`,
                  borderColor: colorStatus(service.status, true)
                    ? `${colorStatus(service.status, true)}60`
                    : colors.primary,
                },
              ]}
            >
              <Text style={{
                ...styles.badgeText,
                color: colorStatus(service.status, true),
              }}>
                {t(getStatusLabelKey(service.status, true))}
              </Text>
            </View>
          </View>
        </View>

        {(inExecution || waitingApproval) && (
          <View style={styles.contextRow}>
            {waitingApproval && (
              <Text style={styles.contextText}>
                {service.tecnico_label ? service.tecnico_label : null}
              </Text>
            )}

            {inExecution && (
              <>
                <Car size={16} color="#aaa" strokeWidth={2} />
                <Text style={styles.contextText}>
                  {
                    service.primeiro_veiculo?.placa ? 
                    service.primeiro_veiculo.placa : 
                    "--"
                  }
                </Text>
              </>
            )}
          </View>
        )}

        {isComingSoon && (
          <View style={styles.metaRow}></View>
        )}

        {(!inExecution && !isComingSoon) && (
          <View style={styles.metaRow}>
            <View style={styles.metaGroup}>
              <View style={styles.metaItem}>
                <Calendar size={16} color="#aaa" strokeWidth={2} />
                <Text style={styles.infoText}>
                  {service.data_inicio
                    ? formatDate(service.data_inicio)
                    : "--"}
                </Text>
              </View>

              <View style={styles.metaItem}>
                {service.quantidade_tipo === "carros" ? (
                  <Car size={16} color="#aaa" strokeWidth={2} />
                ) : (
                  <Calendar size={16} color="#aaa" strokeWidth={2} />
                )}
                <Text style={styles.infoText}>
                  {service.quantidade ? service.quantidade : "--"}
                </Text>
              </View>
            </View>

            <View style={styles.priceMetaItem}>
              <Text style={styles.priceText}>
                {formatCurrency(
                  service.valor_total,
                  service.moeda,
                  locale,
                )}
              </Text>
            </View>
          </View>
        )}

        {/* {isAvailable && (
          <View style={[styles.footer, {
            flexDirection: "row",
            gap: 8,
          }]}>
            <TouchableOpacity
              style={styles.fullButton}
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation?.();
                onAccept?.(
                  service.id,
                  service.data_inicio,
                  service.data_fim,
                );
              }}
            >
              <Text style={styles.fullButtonText}>
                {t("technicianDashboardScreen.accept")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fullButton, styles.rejectButton]}
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation?.();
                onReject?.(service.id);
              }}
            >
              <Text style={styles.rejectButtonText}>
                {t("technicianDashboardScreen.refuse")}
              </Text>
            </TouchableOpacity>
          </View>
        )} */}

        {inExecution && (
          <View style={[styles.footer, {
            flexDirection: "row",
            gap: 8,
          }]}>
            <TouchableOpacity
              style={{ ...styles.fullButton, width: "100%" }}
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation?.();
                onFinish?.(service.id);
              }}
            >
              {loadingFinish ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={styles.fullButtonText}>
                  {t("technicianDashboardScreen.finish")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#141414",
    marginHorizontal: 15,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
  },
  priceMetaItem: {
    marginLeft: "auto",
  },
  content: {
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  leftContent: {
    flexShrink: 0,
  },
  titleText: {
    color: `${colors.white}`,
    fontWeight: "300",
    fontSize: 15,
    flexShrink: 1,
  },
  contextText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  rightContent: {
    flexShrink: 0,
  },
  contextRow: {
    marginTop: 8,
    marginLeft: 32,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  metaRow: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  metaGroup: {
    width: "50%",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footer: {
    marginTop: 16,
  },
  fullButton: {
    width: "50%",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fullButtonText: {
    color: colors.black,
    fontWeight: "800",
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: "#bc2e2e",
  },
  rejectButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  priceText: {
    color: colors.white,
    fontWeight: "700",
  },
});
