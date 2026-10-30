import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/theme/colors";

export function AccountEntryScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao BINOTTO</Text>
      <Text style={styles.subtitle}>Escolha como deseja acessar o aplicativo.</Text>
      <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate("Login")}>
        <Text style={styles.primaryText}>Entrar na minha conta</Text>
      </TouchableOpacity>
      <Text style={styles.section}>Criar uma conta</Text>
      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("RegisterTechnician")}>
        <Text style={styles.optionText}>Sou técnico</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("RegisterWorkshop")}>
        <Text style={styles.optionText}>Sou empresa / oficina</Text>
      </TouchableOpacity>
      <Text style={styles.section}>Outros perfis</Text>
      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("Login")}>
        <Text style={styles.optionText}>Administrativo — entrar com conta existente</Text>
        <Text style={styles.note}>O acesso administrativo utiliza o painel web. O login mobile ainda não está habilitado para este perfil.</Text>
      </TouchableOpacity>
      <View style={styles.option}>
        <Text style={styles.optionText}>Desmontador</Text>
        <Text style={styles.note}>Perfil em preparação. O sistema ainda não oferece cadastro ou autenticação de desmontador.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.background, gap: 16 },
  title: { fontSize: 28, fontWeight: "700", color: colors.white },
  subtitle: { color: colors.textMuted, fontSize: 15, marginBottom: 12 },
  section: { color: colors.white, fontSize: 17, fontWeight: "600", marginTop: 16 },
  primary: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: "center" },
  primaryText: { color: colors.black, fontWeight: "700" },
  option: { borderColor: colors.primary, borderWidth: 1, borderRadius: 12, padding: 16 },
  optionText: { color: colors.white, fontWeight: "600" },
  note: { color: colors.textMuted, fontSize: 12, marginTop: 12, lineHeight: 18 },
});
