import React, { useCallback, useState } from "react";
import * as Contacts from "expo-contacts";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppHeader from "@/components/common/AppHeader";
import ConfirmModal from "@/components/common/ConfirmModal";
import { CustomSwitch } from "@/components/common/CustomSwitch";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import WorkshopPriorityTechService from "@/services/WorkshopPriorityTechService";
import WorkshopBlockedTechService from "@/services/WorkshopBlockedTechService";
import { colors } from "@/theme/colors";
import { useAuth } from "@/contexts/AuthContext";
import { normalizePhone } from "@/utils/numbers";
import {
  buildInviteMessage2,
  buildWhatsappUrl,
  isValidPhoneWhatsapp,
} from "@/utils/whatsapp";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CircleCheck,
  Clock,
  MessageSquare,
  Phone,
  Search,
} from "lucide-react-native";

const MAX_PRIORITY_TECHNICIANS = 3;

export type TechnicianContact = {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string | null;
  isRegistered: boolean;
  status?: "registered" | "invited";
};

export default function WorkshopPriorityTechsScreen() {
  const { locale } = useLanguage();
  const { authData } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"preferred" | "blocked">(
    "preferred",
  );
  const [priorityTechs, setPriorityTechs] = useState<any[]>([]);
  const [blockedTechs, setBlockedTechs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<TechnicianContact[]>([]);
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] =
    useState<TechnicianContact | null>(null);

  const [loadingPreferred, setLoadingPreferred] = useState(false);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingSelectedContactId, setLoadingSelectedContactId] = useState<
    string | null
  >(null);
  const [loadingAddTechnician, setLoadingAddTechnician] =
    useState<boolean>(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [techToRemove, setTechToRemove] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contactsPermissionDenied, setContactsPermissionDenied] =
    useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAddMore = priorityTechs.length < MAX_PRIORITY_TECHNICIANS;
  const remainingSlots = MAX_PRIORITY_TECHNICIANS - priorityTechs.length;
  const isSelectedContactLoading =
    loadingSelectedContactId === selectedContact?.id;

  const readDeviceContacts = async () => {
    const permission = await Contacts.requestPermissionsAsync();

    if (permission.status !== "granted") {
      setContactsPermissionDenied(true);
      setContacts([]);
      return [];
    }

    setContactsPermissionDenied(false);

    const response = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    const contactMap = new Map();

    response.data.forEach((contact) => {
      const name = contact.name?.trim();
      const phone = normalizePhone(contact.phoneNumbers?.[0]?.number);

      if (!name || !phone) {
        return;
      }

      if (contactMap.has(phone)) {
        return;
      }

      contactMap.set(phone, {
        id: contact.id,
        name,
        phone,
        isRegistered: false,
      });
    });

    return Array.from(contactMap.values()).sort((a: any, b: any) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  };

  const resetModalForm = () => {
    setSearch("");
    setSelectedContact(null);
  };

  const loadContactsFromPhone = async () => {
    try {
      setError(null);
      setLoadingContacts(true);

      const localContacts = await readDeviceContacts();
      setContacts(localContacts);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("workshopPriorityTechsScreen.loadPhoneContactsError");

      setError(message);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleOpenAddModal = async () => {
    if (activeTab === "preferred" && !canAddMore) {
      setError(
        t("workshopPriorityTechsScreen.maxPriorityTechsError", {
          count: MAX_PRIORITY_TECHNICIANS,
        }),
      );
      return;
    }

    setShowAddModal(true);
    await loadContactsFromPhone();
  };

  const handleCloseAddModal = () => {
    if (selectedContact) {
      setSelectedContact(null);
    } else {
      setShowAddModal(false);
      resetModalForm();
    }
  };

  const handleSearchContacts = (value: string) => {
    setSearch(value);
  };

  const confirmRemove = (technician: any) => {
    setTechToRemove(technician);
  };

  const handleCancelRemove = () => {
    setTechToRemove(null);
  };

  const handleConfirmRemove = () => {
    if (!techToRemove) return;

    void handleRemoveTechnician(techToRemove.id);
    setTechToRemove(null);
  };

  const loadPriorityTechnicians = async () => {
    try {
      setError(null);
      setLoadingPreferred(true);

      const response =
        await WorkshopPriorityTechService.getPriorityTechnicians();
      setPriorityTechs(response.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("workshopPriorityTechsScreen.loadPriorityTechsError");

      setError(message);
    } finally {
      setLoadingPreferred(false);
    }
  };

  const loadBlockedTechnicians = async () => {
    try {
      setError(null);
      setLoadingBlocked(true);

      const response = await WorkshopBlockedTechService.getBlockedTechnicians();
      setBlockedTechs(response.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("workshopPriorityTechsScreen.loadBlockedTechsError");

      setError(message);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleSelectContact = async (contact: TechnicianContact) => {
    if (selectedContact?.id === contact.id) return;

    try {
      setLoadingSelectedContactId(contact.id);
      setSelectedContact(contact);

      const service =
        activeTab === "blocked"
          ? WorkshopBlockedTechService
          : WorkshopPriorityTechService;
  
      const response = await service.checkTechnician(contact.phone);

      setSelectedContact({
        ...contact,
        isRegistered: response.registered,
        status: response.status,
      });
    } catch (error) {
      setSelectedContact(contact);
    } finally {
      setLoadingSelectedContactId(null);
    }
  };

  const handleSendInvite = async (
    contact: TechnicianContact,
    type: "whatsapp" | "copy",
  ) => {
    setError(null);

    const workshopName = authData?.name ?? "Oficina";
    const message = buildInviteMessage2(contact.name, workshopName, locale);

    if (!isValidPhoneWhatsapp(contact.phone)) {
      setError(t("workshopPriorityTechsScreen.invalidWhatsappNumber"));
      return;
    }

    if (type === "copy") {
      try {
        await Share.share({ message });
      } catch {
        Alert.alert("Convite", message);
      }
      return;
    }

    const url = buildWhatsappUrl(contact.phone, message);

    try {
      const canOpen = await Linking.canOpenURL(url);

      if (!canOpen) {
        setError(t("workshopPriorityTechsScreen.whatsappUnavailable"));
        return;
      }

      await Linking.openURL(url);
    } catch {
      setError(t("workshopPriorityTechsScreen.sendInviteError"));
    }
  };

  const handleAddTechnician = async (phone: string) => {
    const isBlocked = activeTab === "blocked";
    const normalizedPhone = normalizePhone(phone);

    try {
      setLoadingAddTechnician(true);
      setError(null);

      if (isBlocked) {
        const response =
          await WorkshopBlockedTechService.addBlockedTechnician(phone);
        setBlockedTechs((prev) => [...prev, response.data]);
        setPriorityTechs((prev) =>
          prev.filter(
            (tech) => normalizePhone(tech.whatsapp) !== normalizedPhone,
          ),
        );
      } else {
        const response =
          await WorkshopPriorityTechService.addPriorityTechnician(phone);
        setPriorityTechs((prev) => [...prev, response.data]);
        setBlockedTechs((prev) =>
          prev.filter(
            (tech) => normalizePhone(tech.whatsapp) !== normalizedPhone,
          ),
        );
      }

      setShowAddModal(false);
      resetModalForm();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t(
          isBlocked
            ? "workshopPriorityTechsScreen.blockTechnicianError"
            : "workshopPriorityTechsScreen.addTechnicianError",
        );

      setError(message);
    } finally {
      setLoadingAddTechnician(false);
    }
  };

  const handleRemoveTechnician = async (id: string) => {
    const isBlocked = activeTab === "blocked";

    try {
      setError(null);
      setRemovingId(id);

      if (isBlocked) {
        await WorkshopBlockedTechService.removeBlockedTechnician(id);
        setBlockedTechs((prev) => prev.filter((item) => item.id !== id));
      } else {
        await WorkshopPriorityTechService.removePriorityTechnician(id);
        setPriorityTechs((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t(
          isBlocked
            ? "workshopPriorityTechsScreen.removeBlockedTechnicianError"
            : "workshopPriorityTechsScreen.removeTechnicianError",
        );

      setError(message);
    } finally {
      setRemovingId(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPriorityTechnicians();
      loadBlockedTechnicians();
    }, []),
  );

  const filteredContacts = selectedContact
    ? [selectedContact]
    : contacts.filter((contact) => {
        const query = search.toLowerCase().trim();
        if (!query) return true;
        return (
          contact.name.toLowerCase().includes(query) ||
          contact.phone.includes(query)
        );
      });

  // Construir a lista de itens para exibir na FlatList: técnicos + slot(s) de adicionar
  const getListData = () => {
    if (activeTab === "blocked") {
      return [...blockedTechs, { isSlot: true, id: "slot-blocked" }];
    }

    const items = [...priorityTechs];
    if (canAddMore) {
      const slotsCount = MAX_PRIORITY_TECHNICIANS - priorityTechs.length;
      for (let i = 0; i < slotsCount; i++) {
        items.push({
          isSlot: true,
          id: `slot-${i}`,
        });
      }
    }
    return items;
  };

  const listData = getListData();
  const loading = activeTab === "blocked" ? loadingBlocked : loadingPreferred;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader
        logo={require("@/assets/binotto-dog-logo-cropped.png")}
        title={
          activeTab === "blocked"
            ? t("workshopPriorityTechsScreen.blockedTitle")
            : t("workshopPriorityTechsScreen.title")
        }
        subtitle={
          activeTab === "blocked"
            ? t("workshopPriorityTechsScreen.blockedSubtitle", {
                count: blockedTechs.length,
              })
            : t("workshopPriorityTechsScreen.subtitle", {
                current: priorityTechs.length,
                max: MAX_PRIORITY_TECHNICIANS,
              })
        }
        onBack={() => navigation.navigate("Dashboard")}
      />
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      <View style={styles.tabSwitchRow}>
        <Text
          style={[
            styles.tabSwitchLabel,
            activeTab === "preferred" && styles.tabSwitchLabelActive,
          ]}
        >
          {t("workshopPriorityTechsScreen.preferredTab")}
        </Text>

        <CustomSwitch
          value={activeTab === "blocked"}
          onValueChange={(value) =>
            setActiveTab(value ? "blocked" : "preferred")
          }
          activeColor={colors.primary}
          inactiveColor={colors.border}
        />

        <Text
          style={[
            styles.tabSwitchLabel,
            activeTab === "blocked" && styles.tabSwitchLabelActive,
          ]}
        >
          {t("workshopPriorityTechsScreen.blockedTab")}
        </Text>
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={listData}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                if (item.isSlot) {
                  const isBlockedSlot = activeTab === "blocked";

                  return (
                    <TouchableOpacity
                      style={styles.slotCard}
                      activeOpacity={0.7}
                      onPress={() => void handleOpenAddModal()}
                    >
                      <View style={styles.slotAvatar}>
                        <MaterialCommunityIcons
                          name={isBlockedSlot ? "account-cancel-outline" : "plus"}
                          size={24}
                          color={colors.primary}
                        />
                      </View>
                      <Text style={styles.slotText}>
                        {t(
                          isBlockedSlot
                            ? "workshopPriorityTechsScreen.blockTechnician"
                            : "workshopPriorityTechsScreen.addTechnician",
                        )}
                      </Text>
                    </TouchableOpacity>
                  );
                }

                const isRemoving = removingId === item.id;

                return (
                  <View style={styles.techCard}>
                    <View style={styles.techCardTop}>
                      <View style={styles.techAvatar}>
                        <Text style={styles.techAvatarText}>
                          {item.nome_completo.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.techInfo}>
                        <Text style={styles.techName}>
                          {item.nome_completo}
                        </Text>

                        <View style={styles.phoneContainer}>
                          <Phone
                            size={15}
                            color="#666"
                            style={styles.phoneIcon}
                          />
                          <Text style={styles.techPhone}>{item.whatsapp}</Text>
                        </View>
                      </View>

                      <View style={styles.techMetaRow}>
                        <View
                          style={[
                            styles.badge,
                            item.status === "registered"
                              ? styles.badgeSuccess
                              : styles.badgeWarning,
                          ]}
                        >
                          {item.status === "registered" ? (
                            <CircleCheck
                              size={11}
                              color="#4ade80"
                              style={styles.badgeIcon}
                            />
                          ) : (
                            <Clock
                              size={11}
                              color={colors.primary}
                              style={styles.badgeIcon}
                            />
                          )}

                          <Text
                            style={[
                              styles.badgeText,
                              item.status === "registered"
                                ? styles.badgeTextSuccess
                                : styles.badgeTextWarning,
                            ]}
                          >
                            {item.status === "registered"
                              ? t("workshopPriorityTechsScreen.registered")
                              : t("workshopPriorityTechsScreen.inviteSent")}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => confirmRemove(item)}
                        disabled={isRemoving}
                        style={{
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        hitSlop={10}
                      >
                        {isRemoving ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name="close"
                            size={20}
                            color={colors.textMuted}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>

      <Modal
        visible={showAddModal}
        transparent={false}
        animationType="slide"
        onRequestClose={handleCloseAddModal}
      >
        <View style={styles.modalOverlayFull}>
          <View style={styles.modalHeaderStreamlined}>
            <TouchableOpacity
              style={styles.backCircleButton}
              onPress={handleCloseAddModal}
              hitSlop={10}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={colors.white}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitleMain}>
              {t(
                activeTab === "blocked"
                  ? "workshopPriorityTechsScreen.blockModalTitle"
                  : "workshopPriorityTechsScreen.modalTitle",
              )}
            </Text>
          </View>

          <View style={styles.searchContainerWrapper}>
            <Search
              size={22}
              color={colors.placeholder}
              style={styles.searchIconInside}
            />
            <TextInput
              placeholder={
                selectedContact
                  ? selectedContact.name
                  : t("workshopPriorityTechsScreen.searchPlaceholder")
              }
              placeholderTextColor={colors.placeholder}
              value={selectedContact ? "" : search}
              editable={!selectedContact}
              onChangeText={(value) => {
                handleSearchContacts(value);
              }}
              style={styles.searchInputClean}
            />
          </View>

          {loadingContacts && !selectedContact && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginVertical: 10 }}
            />
          )}

          {contactsPermissionDenied && (
            <View style={styles.permissionCard}>
              <MaterialCommunityIcons
                name="account-box-outline"
                size={26}
                color={colors.primary}
              />
              <Text style={styles.permissionTitle}>
                {t("workshopPriorityTechsScreen.allowContactsTitle")}
              </Text>
              <Text style={styles.permissionText}>
                {t("workshopPriorityTechsScreen.allowContactsText")}
              </Text>

              <View style={styles.permissionActions}>
                <TouchableOpacity
                  style={styles.permissionButtonSecondary}
                  onPress={() => {
                    void Linking.openSettings();
                  }}
                >
                  <Text style={styles.permissionButtonSecondaryText}>
                    {t("workshopPriorityTechsScreen.openSettings")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.permissionButtonPrimary}
                  onPress={() => loadContactsFromPhone()}
                >
                  <Text style={styles.permissionButtonPrimaryText}>
                    {t("workshopPriorityTechsScreen.tryAgain")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            style={styles.contactsListFull}
            contentContainerStyle={
              filteredContacts.length === 0
                ? styles.emptyContactsContent
                : { paddingBottom: insets.bottom + 40 }
            }
            ListEmptyComponent={
              <View style={styles.emptyContacts}>
                <Text style={styles.emptyContactsTitle}>
                  {t("workshopPriorityTechsScreen.noContactsTitle")}
                </Text>
                <Text style={styles.emptyContactsText}>
                  {t("workshopPriorityTechsScreen.noContactsText")}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedContact?.id === item.id;

              return (
                <View
                  style={[
                    styles.contactCardClean,
                    isSelected && styles.contactCardCleanSelected,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isSelected}
                    onPress={() => handleSelectContact(item)}
                    style={styles.contactHeader}
                  >
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactAvatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{item.name}</Text>

                      <View style={styles.contactPhoneRow}>
                        {!isSelected ? (
                          <Phone
                            size={13}
                            color="#666"
                            style={{ marginRight: 4 }}
                          />
                        ) : undefined}

                        <Text style={styles.contactPhoneClean}>
                          {item.phone}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {isSelected && (
                    <View style={styles.expandedContentPane}>
                      {isSelectedContactLoading ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                          style={{ marginVertical: 16 }}
                        />
                      ) : item.isRegistered ? (
                        <>
                          <Text style={styles.invitePromptText}>
                            {t(
                              activeTab === "blocked"
                                ? "workshopPriorityTechsScreen.blockPrompt"
                                : "workshopPriorityTechsScreen.addPrompt",
                              { name: item.name },
                            )}
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.contactActionButton,
                              loadingAddTechnician &&
                                styles.contactActionButtonDisabled,
                            ]}
                            disabled={loadingAddTechnician}
                            onPress={() => handleAddTechnician(item.phone)}
                          >
                            {loadingAddTechnician ? (
                              <ActivityIndicator
                                size="small"
                                color={colors.black}
                              />
                            ) : (
                              <>
                                <View>
                                  <CircleCheck
                                    size={20}
                                    color={colors.white}
                                    strokeWidth={2}
                                  />
                                </View>
                                <Text style={styles.contactActionButtonText}>
                                  {t(
                                    activeTab === "blocked"
                                      ? "workshopPriorityTechsScreen.confirmAndBlock"
                                      : "workshopPriorityTechsScreen.confirmAndAdd",
                                  )}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </>
                      ) : activeTab === "blocked" ? (
                        <View
                          style={[
                            styles.badge,
                            styles.badgeWarning,
                            styles.notRegisteredBadge,
                          ]}
                        >
                          <Clock
                            size={11}
                            color={colors.primary}
                            style={styles.badgeIcon}
                          />
                          <Text
                            style={[styles.badgeText, styles.badgeTextWarning]}
                          >
                            {t("workshopPriorityTechsScreen.notRegisteredBadge")}
                          </Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.invitePromptText}>
                            {t("workshopPriorityTechsScreen.invitePrompt", {
                              name: item.name,
                            })}
                          </Text>
                          <View style={styles.inviteActionsRowVertical}>
                            <TouchableOpacity
                              style={styles.whatsappInviteButton}
                              onPress={() => handleSendInvite(item, "whatsapp")}
                            >
                              <View style={styles.iconCircle}>
                                <MessageSquare
                                  size={20}
                                  color={colors.white}
                                  strokeWidth={2}
                                />
                              </View>
                              <Text style={styles.whatsappInviteButtonText}>
                                {t(
                                  "workshopPriorityTechsScreen.sendWhatsappInvite",
                                )}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.copyInviteButton}
                              onPress={() => handleSendInvite(item, "copy")}
                            >
                              <Text style={styles.copyInviteButtonText}>
                                {t("workshopPriorityTechsScreen.copyInvite")}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            }}
          />
        </View>
      </Modal>

      <ConfirmModal
        visible={!!techToRemove}
        variant="double"
        type="warning"
        title={t(
          activeTab === "blocked"
            ? "workshopPriorityTechsScreen.removeBlockedTechnicianTitle"
            : "workshopPriorityTechsScreen.removeTechnicianTitle",
        )}
        subtitle={t(
          activeTab === "blocked"
            ? "workshopPriorityTechsScreen.removeBlockedTechnicianMessage"
            : "workshopPriorityTechsScreen.removeTechnicianMessage",
        )}
        confirmText={t("workshopPriorityTechsScreen.remove")}
        cancelText={t("workshopPriorityTechsScreen.keep")}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 20,
    gap: 18,
  },

  tabSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  tabSwitchLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
  },

  tabSwitchLabelActive: {
    color: colors.white,
  },

  summaryCard: {
    backgroundColor: colors.backgroundSurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 18,
    gap: 14,
  },

  summaryCopy: {
    gap: 8,
  },

  summaryTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
  },

  summaryText: {
    color: colors.textMuted,
    lineHeight: 20,
  },

  primaryButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonDisabled: {
    opacity: 0.45,
  },

  primaryButtonText: {
    color: colors.black,
    fontWeight: "800",
    fontSize: 15,
  },

  helperText: {
    color: colors.textMuted,
    fontSize: 13,
  },

  listContainer: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 20,
    gap: 12,
  },

  loader: {
    marginTop: 24,
  },

  techCard: {
    backgroundColor: "#141414",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    padding: 16,
  },

  techCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  techAvatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: "#3b2f05",
    alignItems: "center",
    justifyContent: "center",
  },

  techAvatarText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 18,
  },

  techInfo: {
    flex: 1,
    gap: 4,
    width: "50%",
  },

  techName: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },

  techPhone: {
    color: colors.textMuted,
    fontSize: 13,
  },

  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  phoneIcon: {
    marginRight: 4,
  },

  techMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  notRegisteredBadge: {
    alignSelf: "flex-start",
  },

  badgeIcon: {},

  badgeText: {
    fontSize: 9,
    fontWeight: "700",
  },

  badgeSuccess: {
    backgroundColor: `${"#34D399"}30`,
    borderColor: `${"#34D399"}60`,
    borderWidth: 1,
  },

  badgeTextSuccess: {
    color: "#34D399",
  },

  badgeWarning: {
    backgroundColor: `${"#FACC15"}30`,
    borderColor: `${"#FACC15"}60`,
    borderWidth: 1,
  },

  badgeTextWarning: {
    color: "#FACC15",
  },

  slotCard: {
    backgroundColor: "#141414",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    borderStyle: "dashed",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  slotAvatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: "#3b2f05",
    alignItems: "center",
    justifyContent: "center",
  },

  slotText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "500",
  },

  modalOverlayFull: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingTop: 40,
  },

  modalHeaderStreamlined: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    marginTop: 10,
  },

  backCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitleMain: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
  },

  searchContainerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    borderRadius: 16,
    backgroundColor: "#1c1c1e",
    borderColor: colors.borderMutedCard,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  searchIconInside: {
    marginRight: 10,
  },

  searchInputClean: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },

  contactsListFull: {
    flex: 1,
  },

  permissionCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 10,
  },

  permissionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },

  permissionText: {
    color: colors.textMuted,
    lineHeight: 18,
  },

  permissionActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  permissionButtonPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  permissionButtonPrimaryText: {
    color: colors.black,
    fontWeight: "800",
  },

  permissionButtonSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  permissionButtonSecondaryText: {
    color: colors.text,
    fontWeight: "700",
  },

  emptyContactsContent: {
    flexGrow: 1,
  },

  emptyContacts: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 6,
  },

  emptyContactsTitle: {
    color: colors.white,
    fontWeight: "700",
  },

  emptyContactsText: {
    color: colors.textMuted,
    lineHeight: 18,
  },

  contactCardClean: {
    backgroundColor: "#141414",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    padding: 16,
    marginBottom: 12,
  },

  contactCardCleanSelected: {
    borderColor: colors.primary,
    backgroundColor: "#141414",
  },

  contactHeader: {
    flexDirection: "row",
    gap: 12,
  },

  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#2a2110",
    alignItems: "center",
    justifyContent: "center",
  },

  contactAvatarText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: "800",
  },

  contactInfo: {
    flex: 1,
    gap: 2,
  },

  contactName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },

  contactPhoneClean: {
    color: colors.textMuted,
    fontSize: 14,
  },

  contactPhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  expandedContentPane: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingTop: 16,
  },

  invitePromptText: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 16,
    textAlign: "left",
  },

  inviteActionsRowVertical: {
    gap: 10,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  contactActionButton: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 20,
    backgroundColor: "#21c35d",
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
    gap: 8,
  },

  contactActionButtonDisabled: {
    opacity: 0.6,
  },

  whatsappInviteButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#21c35d",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 8,
  },

  whatsappInviteButtonText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 15,
  },

  copyInviteButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2e2e2e",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  copyInviteButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },

  contactActionButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 15,
  },
});
