import React, { ReactNode } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors } from "@/theme/colors";

type ListCardMetaItem = {
  key: string;
  node: ReactNode;
};

type ListCardProps = {
  onPress?: () => void;
  leftContent: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
   rowTitle?: ReactNode;
  rightContent?: ReactNode;
  metaItems?: ListCardMetaItem[];
  footer?: ReactNode;
  body?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function ListCard({
  onPress,
  leftContent,
  title,
  rowTitle,
  subtitle,
  rightContent,
  metaItems = [],
  footer,
  body,
  contentStyle,
}: ListCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={[styles.content, contentStyle]}>
        {body ?? (
          <>
            <View style={styles.headerRow}>
              <View style={styles.titleArea}>
                <View style={styles.leftContent}>{leftContent}</View>
                <View style={styles.titleTextArea}>
                  <View style={styles.titleRow}>
                    <Text style={styles.titleText}>{title}</Text>
                    {rowTitle?
                     <Text style={styles.subtitleText}>{rowTitle}</Text>
                     :undefined
                    }
                  </View>
                  {subtitle ? (
                    <Text style={styles.subtitleText}>{subtitle}</Text>
                  ) : null}
                </View>
              </View>

              {rightContent ? (
                <View style={styles.rightContent}>{rightContent}</View>
              ) : null}
            </View>

{metaItems.length>0?
            <View style={styles.metaRow}>
              {metaItems.map((item, i) => (
                <View
                  key={item.key}
                  style={[
                    styles.metaItem,
                    item.key === "price"
                      ? styles.priceMetaItem
                      : { width: "auto", marginLeft: i == 0 ? 0 : 18 },
                  ]}
                >
                  {item.node}
                </View>
              ))}
            </View>:undefined
}

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </>
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
    gap: 12,
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
  titleTextArea: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleText: {
    color: `${colors.white}`,
    fontWeight: "300",
    fontSize: 15,
    flexShrink: 1,
  },
  subtitleText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  rightContent: {
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footer: {
   marginTop: 2,
  },
});
