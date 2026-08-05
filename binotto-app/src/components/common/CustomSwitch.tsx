import React, { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";

type CustomSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeColor: string;
  inactiveColor: string;
  disabled?: boolean;
};

export function CustomSwitch({
  value,
  onValueChange,
  activeColor,
  inactiveColor,
  disabled = false,
}: CustomSwitchProps) {
  const translateX = useRef(new Animated.Value(value ? 14 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 14 : 0,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [value]);

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={{
        width: 40,
        height: 22,
        borderRadius: 16,
        backgroundColor: value ? "white" : inactiveColor,
        padding: 4,
        justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Animated.View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: "black",
          transform: [{ translateX }],
        }}
      />
    </Pressable>
  );
}
