import React, { useRef, useState, useCallback, memo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { GLOBAL } from "@/constants/global";
import { colors } from "@/theme/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const storage = GLOBAL.storage;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ITEM_SIZE = SCREEN_WIDTH * 0.38;
const OVERLAP_RATIO = 0.6;
const SNAP_INTERVAL = ITEM_SIZE * OVERLAP_RATIO;
const CONTAINER_PADDING = (SCREEN_WIDTH - SNAP_INTERVAL) / 2.5;
const SLOT_HEIGHT = ITEM_SIZE * 1.2;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export interface CarouselImage {
  id?: string;
  uri?: string;
  localUri?: string;
  placeholderSource?: any;
  label?: string;
  isPlaceholder?: boolean;
  onEdit?: () => void;
  onPress?: () => void;
  onDelete?: () => void;
}

interface InfiniteImageCarouselProps {
  images: (string | CarouselImage)[];
  onImagePress?: (uri: string) => void;
  title?: string;
  showIndicators?: boolean;
}

// -------------------------------------------------------------
// 1. COMPONENTE DO ITEM MEMOIZADO
// -------------------------------------------------------------
interface CarouselCardItemProps {
  item: CarouselImage;
  index: number;
  activeIndex: number;
  scrollX: Animated.Value;
  onImagePress?: (uri: string) => void;
}

const CarouselCardItem = memo(
  ({
    item,
    index,
    activeIndex,
    scrollX,
    onImagePress,
  }: CarouselCardItemProps) => {
    const getFullImageUri = (uri?: string): string | null => {
      if (!uri) return null;
      if (uri.startsWith("http://") || uri.startsWith("https://")) {
        return uri;
      }
      return `${storage}/${uri}`;
    };


    const fullUri = item.localUri || getFullImageUri(item.uri) || undefined;

    const isCenter = index === activeIndex;

    const source = item.localUri
      ? { uri: item.localUri }
      : item.uri
      ? { uri: getFullImageUri(item.uri)! }
      : null;

    const inputRange = [
      (index - 3) * SNAP_INTERVAL,
      (index - 1) * SNAP_INTERVAL,
      index * SNAP_INTERVAL,
      (index + 1) * SNAP_INTERVAL,
      (index + 3) * SNAP_INTERVAL,
    ];

    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [
        -ITEM_SIZE * 0.4,
        -ITEM_SIZE * 0.04,
        0,
        ITEM_SIZE * 0.04,
        ITEM_SIZE * 0.04,
      ],
      extrapolate: "clamp",
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [20, 0, 0, 0, 20],
      extrapolate: "clamp",
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.65, 0.85, 1.15, 0.85, 0.65],
      extrapolate: "clamp",
    });

    const rotateY = scrollX.interpolate({
      inputRange,
      outputRange: ["-30deg", "-15deg", "0deg", "15deg", "30deg"],
      extrapolate: "clamp",
    });

    const distanceFromCenter = Math.abs(index - activeIndex);
    const zIndexValue = Math.max(0, 100 - distanceFromCenter);

    return (
      <View style={styles.slot}>
        <AnimatedTouchable
          activeOpacity={0.9}
          onPress={() => {
            if (item.onPress) {
              item.onPress();
            } else if (item.isPlaceholder && item.onEdit) {
              item.onEdit();
            } else if (onImagePress && (item.uri || item.localUri)) {
              onImagePress(item.localUri || item.uri!);
            }
          }}
          style={[
            styles.cardContainer,
            {
              width: ITEM_SIZE,
              height: ITEM_SIZE,
              elevation: zIndexValue,
              transform: [
                { perspective: 1000 },
                { translateX },
                { translateY },
                { rotateY },
                { scale },
              ],
              zIndex: zIndexValue,
            },
          ]}
        >
          {item.isPlaceholder || !source ? (
            <View style={styles.placeholderContainer}>
              {item.placeholderSource ? (
                <>
                  <Image
                    source={item.placeholderSource}
                    style={[
                      styles.placeholderImage,
                      { borderRadius: 8, opacity: 0.6 },
                    ]}
                    resizeMode="cover"
                  />
                  {item.label && (
                    <View style={styles.labelOverlay}>
                      <Text style={styles.labelText}>{item.label}</Text>
                    </View>
                  )}
                </>
              ) : (
                <MaterialCommunityIcons
                  name="camera-plus"
                  size={40}
                  color={colors.textMuted}
                />
              )}
            </View>
          ) : (
            <>
              <Image source={source} style={styles.image} resizeMode="cover" />
              {item.label && (
                <View style={styles.labelOverlay}>
                  <Text style={styles.labelText} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              )}
              {isCenter && item.onEdit && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={item.onEdit}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={20}
                    color={colors.white}
                  />
                </TouchableOpacity>
              )}
              {isCenter && item.onDelete && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={item.onDelete}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="delete"
                    size={20}
                    color={colors.white}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </AnimatedTouchable>
      </View>
    );
  }
);

// -------------------------------------------------------------
// 2. COMPONENTE PRINCIPAL DO CARROSSEL (VERSÃO CORRIGIDA)
// -------------------------------------------------------------
export default function InfiniteImageCarousel({
  images,
  onImagePress,
  title,
}: InfiniteImageCarouselProps) {

  if (!images || images.length === 0) return null;

  const normalizedImages: CarouselImage[] = images.map((img) => {
    if (typeof img === "string") {
      return { uri: img };
    }
    return img;
  });

  const imageCount = normalizedImages.length;
  // Define se usará modo infinito (apenas para 5 ou mais imagens)
  const isInfinite = imageCount >= 5;

  // Prepara os dados e índice inicial
  let virtualData: CarouselImage[];
  let initialIndex: number;

  if (isInfinite) {
    const MULTIPLIER = 10;
    virtualData = Array.from({ length: MULTIPLIER }).flatMap(
      () => normalizedImages
    );
    const middleStart = Math.floor(virtualData.length / 2);
    initialIndex = middleStart - (middleStart % imageCount);
  } else {
    virtualData = normalizedImages;
    initialIndex = 0;
  }

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const flatListRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(initialIndex * SNAP_INTERVAL))
    .current;

  // Sincroniza a posição inicial da lista com o valor do scrollX
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: initialIndex * SNAP_INTERVAL,
        animated: false,
      });
    }
    // Atualiza o scrollX para o valor correto
    scrollX.setValue(initialIndex * SNAP_INTERVAL);
  }, [initialIndex, scrollX]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.x;
      const index = Math.round(offset / SNAP_INTERVAL);
      setActiveIndex(index);

      // Reposiciona apenas se estiver no modo infinito e próximo das bordas
      if (isInfinite) {
        const totalItems = virtualData.length;
        if (index < imageCount || index > totalItems - imageCount) {
          const newIndex = initialIndex + (index % imageCount);
          flatListRef.current?.scrollToOffset({
            offset: newIndex * SNAP_INTERVAL,
            animated: false,
          });
          setActiveIndex(newIndex);
        }
      }
    },
    [isInfinite, initialIndex, imageCount, virtualData.length]
  );

  const keyExtractor = useCallback((_: any, index: number) => index.toString(), []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SNAP_INTERVAL,
      offset: SNAP_INTERVAL * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: CarouselImage; index: number }) => (
      
       <CarouselCardItem
        item={item}
        index={index}
        activeIndex={activeIndex}
        scrollX={scrollX}
        onImagePress={onImagePress}
      />
    ),
    [activeIndex, scrollX, onImagePress]
  );

  // Ajusta o padding horizontal para centralizar quando há poucos itens
  const getContentPadding = () => {
    if (virtualData.length === 1) {
      return (SCREEN_WIDTH - ITEM_SIZE) / 2;
    }
    return CONTAINER_PADDING;
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <Animated.FlatList
        ref={flatListRef}
        data={virtualData}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: getContentPadding(),
          alignItems: "center",
        }}
        getItemLayout={getItemLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={renderItem}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        initialNumToRender={5}
        windowSize={5}
        // Remove initialScrollIndex para evitar conflitos com scrollToOffset
      />
    </View>
  );
}

// -------------------------------------------------------------
// 3. ESTILOS
// -------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    backgroundColor: colors.card_item,
    borderColor: colors.borderMutedCard,
    borderWidth: 1,
    borderRadius: 16,
    gap: 12,
  },
  title: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 12,
  },
  slot: {
    width: SNAP_INTERVAL,
    height: SLOT_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: {
    position: "absolute",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  labelOverlay: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.56)",
    opacity: 1,
    bottom: 4,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  labelText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  editButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 6,
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(220, 38, 38, 0.8)",
    borderRadius: 20,
    padding: 6,
  },
});