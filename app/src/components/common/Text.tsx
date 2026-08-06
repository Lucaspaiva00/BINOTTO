import React from "react";
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from "react-native";

export interface TextProps extends RNTextProps {
  weight?: "normal" | "bold" | "light";
  oblique?: boolean;
}

export function Text({ style, weight = "normal", oblique = false, ...props }: TextProps) {
  let fontFamily = "Helvetica";

  if (weight === "bold" && oblique) {
    fontFamily = "Helvetica-BoldOblique";
  } else if (weight === "bold") {
    fontFamily = "Helvetica-Bold";
  } else if (oblique) {
    fontFamily = "Helvetica-Oblique";
  } else if (weight === "light") {
    fontFamily = "Helvetica-Light";
  }

  return <RNText style={[{ fontFamily }, style]} {...props} />;
}
