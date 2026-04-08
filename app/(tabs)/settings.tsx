import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useBudget } from "../../src/context/BudgetContext";
import { exportAllData, importAllData } from "../../src/lib/database";
import Card from "../../src/components/Card";
import SectionTitle from "../../src/components/SectionTitle";
import { Colors, Spacing, BorderRadius } from "../../src/lib/theme";

export default function SettingsScreen() {
  const data = useBudget();
  const [person1, setPerson1] = useState(data.settings.person1);
  const [person2, setPerson2] = useState(data.settings.person2);
  const [savingsGoal, setSavingsGoal] = useState(String(data.settings.savingsGoal));

  const handleSaveSettings = async () => {
    await data.updateSettings({
      person1: person1.trim() || "我",
      person2: person2.trim() || "另一半",
      savingsGoal: Number(savingsGoal) || 50000,
      currency: data.settings.currency,
    });
    Alert.alert("已保存", "设置已更新");
  };

  const handleExport = async () => {
    try {
      const allData = await exportAllData();
      const json = JSON.stringify(allData, null, 2);
      const fileUri = `${FileSystem.documentDirectory}budget-backup.json`;
      await FileSystem.writeAsStringAsync(fileUri, json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "导出记账数据",
        });
      } else {
        Alert.alert("已导出", `文件已保存到: ${fileUri}`);
      }
    } catch (e) {
      Alert.alert("导出失败", "请稍后重试");
    }
  };

  const handleImportBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const parsed = JSON.parse(content);

      if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
        Alert.alert("格式错误", "备份文件格式不正确");
        return;
      }

      Alert.alert(
        "确认导入",
        `将导入 ${parsed.transactions.length} 条记录，这将替换当前所有数据。`,
        [
          { text: "取消", style: "cancel" },
          {
            text: "确认导入",
            style: "destructive",
            onPress: async () => {
              await importAllData(parsed);
              await data.loadData();
              if (parsed.settings) {
                setPerson1(parsed.settings.person1 || "我");
                setPerson2(parsed.settings.person2 || "另一半");
                setSavingsGoal(String(parsed.settings.savingsGoal || 50000));
              }
              Alert.alert("成功", "数据已恢复");
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert("导入失败", "文件格式错误或读取失败");
    }
  };

  const handleReset = () => {
    Alert.alert("确认清空", "所有数据将被删除，此操作不可撤销。", [
      { text: "取消", style: "cancel" },
      {
        text: "清空",
        style: "destructive",
        onPress: async () => {
          await data.resetToSample();
          setPerson1("我");
          setPerson2("另一半");
          setSavingsGoal("50000");
          Alert.alert("已清空", "所有数据已删除");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>⚙️ 设置</Text>
        </View>

        {/* Member settings */}
        <Card style={{ marginBottom: Spacing.lg }}>
          <SectionTitle>👥 成员设置</SectionTitle>
          <Text style={s.label}>成员 1 名称</Text>
          <TextInput
            style={s.input}
            value={person1}
            onChangeText={setPerson1}
            placeholder="我"
            placeholderTextColor={Colors.text3}
          />
          <Text style={[s.label, { marginTop: Spacing.md }]}>成员 2 名称</Text>
          <TextInput
            style={s.input}
            value={person2}
            onChangeText={setPerson2}
            placeholder="另一半"
            placeholderTextColor={Colors.text3}
          />
          <Text style={[s.label, { marginTop: Spacing.md }]}>储蓄目标 (AUD)</Text>
          <TextInput
            style={s.input}
            value={savingsGoal}
            onChangeText={setSavingsGoal}
            placeholder="50000"
            placeholderTextColor={Colors.text3}
            keyboardType="numeric"
          />
          <TouchableOpacity style={s.saveBtn} onPress={handleSaveSettings}>
            <Text style={s.saveBtnText}>保存设置</Text>
          </TouchableOpacity>
        </Card>

        {/* Data management */}
        <Card style={{ marginBottom: Spacing.lg }}>
          <SectionTitle>💾 数据管理</SectionTitle>
          <Text style={s.statsText}>
            当前共有 {data.transactions.length} 条交易记录
          </Text>
          <TouchableOpacity style={s.actionBtn} onPress={handleExport}>
            <Text style={s.actionBtnIcon}>💾</Text>
            <View>
              <Text style={s.actionBtnTitle}>导出备份</Text>
              <Text style={s.actionBtnDesc}>将所有数据导出为 JSON 文件</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={handleImportBackup}>
            <Text style={s.actionBtnIcon}>📥</Text>
            <View>
              <Text style={s.actionBtnTitle}>导入备份</Text>
              <Text style={s.actionBtnDesc}>从 JSON 备份文件恢复数据</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { borderColor: "rgba(248,113,113,0.3)" }]}
            onPress={handleReset}
          >
            <Text style={s.actionBtnIcon}>�️</Text>
            <View>
              <Text style={[s.actionBtnTitle, { color: Colors.red }]}>
                清空所有数据
              </Text>
              <Text style={s.actionBtnDesc}>清除所有数据并恢复示例</Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* About */}
        <Card style={{ marginBottom: 20 }}>
          <SectionTitle>关于</SectionTitle>
          <Text style={s.aboutText}>
            家庭记账本 v1.0.1{"\n"}
            双人家庭收支管理工具{"\n"}
            数据存储在本地，安全可靠
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  header: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  title: { fontSize: 18, fontWeight: "700", color: Colors.text },
  label: {
    fontSize: 12,
    color: Colors.text2,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: Colors.green,
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  saveBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
  statsText: {
    fontSize: 13,
    color: Colors.text2,
    marginBottom: Spacing.lg,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  actionBtnIcon: { fontSize: 24 },
  actionBtnTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  actionBtnDesc: { fontSize: 11, color: Colors.text3, marginTop: 2 },
  aboutText: {
    fontSize: 13,
    color: Colors.text2,
    lineHeight: 22,
  },
});
