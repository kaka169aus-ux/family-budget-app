import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import Papa from "papaparse";
import { Colors, Spacing, BorderRadius } from "../lib/theme";
import { CATEGORY_MAP } from "../lib/constants";
import { autoCategory, fmtMoney } from "../lib/utils";
import { Settings, Transaction, TransactionType } from "../lib/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onImport: (txns: Omit<Transaction, "id" | "created_at">[]) => void;
  settings: Settings;
}

type ImportMode = "file" | "text" | null;

export default function ImportModal({ visible, onClose, onImport, settings }: Props) {
  const [mode, setMode] = useState<ImportMode>(null);
  const [preview, setPreview] = useState<Omit<Transaction, "id" | "created_at">[]>([]);
  const [person, setPerson] = useState(settings.person1);
  const [textInput, setTextInput] = useState("");
  const [parsing, setParsing] = useState(false);

  const parseRows = (rows: Record<string, string>[]) => {
    return rows
      .map((r) => {
        const vals = Object.values(r).map(String);
        let date = "";
        let amount = 0;
        let desc = "";
        for (const v of vals) {
          if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(v.trim())) {
            const parts = v.trim().split(/[-/]/);
            date = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
          } else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(v.trim())) {
            const parts = v.trim().split(/[-/]/);
            if (parts[2].length === 4) {
              date = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
            } else {
              date = `20${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
            }
          }
          const num = parseFloat(v.replace(/[$,]/g, ""));
          if (!isNaN(num) && Math.abs(num) > 0 && Math.abs(num) < 1000000) {
            if (Math.abs(num) > Math.abs(amount)) amount = num;
          }
          if (v.length > 3 && isNaN(parseFloat(v.replace(/[$,]/g, ""))) && !/^\d{4}[-/]/.test(v)) {
            desc = v.trim();
          }
        }
        if (!date) date = new Date().toISOString().slice(0, 10);
        const absAmt = Math.abs(amount);
        const cat = autoCategory(desc);
        const type: TransactionType =
          amount > 0 && cat === "income"
            ? "income"
            : cat === "investment"
            ? "investment"
            : cat === "savings"
            ? "savings"
            : "expense";
        return {
          date,
          amount: absAmt,
          category: cat,
          description: desc || "未知交易",
          person,
          type,
        };
      })
      .filter((r) => r.amount > 0);
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setParsing(true);
      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          setPreview(parseRows(res.data as Record<string, string>[]));
          setParsing(false);
        },
        error: () => {
          Alert.alert("解析失败", "CSV 文件格式无法识别");
          setParsing(false);
        },
      });
    } catch (e) {
      Alert.alert("错误", "文件读取失败");
      setParsing(false);
    }
  };

  const handleTextParse = () => {
    if (!textInput.trim()) return;
    setParsing(true);
    try {
      const lines = textInput
        .trim()
        .split("\n")
        .filter((l) => l.trim());
      const results: Omit<Transaction, "id" | "created_at">[] = [];
      for (const line of lines) {
        let date = new Date().toISOString().slice(0, 10);
        let amount = 0;
        let desc = line.trim();

        const dateMatch = line.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
        if (dateMatch) {
          const parts = dateMatch[1].split(/[-/]/);
          date = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
          desc = desc.replace(dateMatch[0], "").trim();
        }

        const amtMatch = line.match(/\$?([\d,]+\.?\d*)/);
        if (amtMatch) {
          amount = parseFloat(amtMatch[1].replace(/,/g, ""));
          desc = desc.replace(amtMatch[0], "").trim();
        }

        if (amount > 0) {
          const cat = autoCategory(desc);
          const type: TransactionType =
            cat === "income" ? "income" : cat === "investment" ? "investment" : cat === "savings" ? "savings" : "expense";
          results.push({ date, amount, category: cat, description: desc || "未知交易", person, type });
        }
      }
      setPreview(results);
    } catch {
      Alert.alert("解析失败", "文本格式无法识别");
    }
    setParsing(false);
  };

  const handleImport = () => {
    if (preview.length === 0) return;
    onImport(preview);
    setPreview([]);
    setMode(null);
    setTextInput("");
    onClose();
  };

  const reset = () => {
    setPreview([]);
    setMode(null);
    setTextInput("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={s.title}>导入账单</Text>

            {/* Person selector */}
            <Text style={s.label}>账单归属</Text>
            <View style={s.personRow}>
              {[settings.person1, settings.person2].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[s.personBtn, person === p && s.personBtnActive]}
                  onPress={() => setPerson(p)}
                >
                  <Text style={[s.personBtnText, person === p && s.personBtnTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mode selector */}
            {!mode && (
              <View style={s.modeGrid}>
                <TouchableOpacity style={s.modeCard} onPress={() => setMode("file")}>
                  <Text style={s.modeIcon}>📄</Text>
                  <Text style={s.modeName}>CSV 文件</Text>
                  <Text style={s.modeDesc}>导入 .csv 银行账单</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modeCard} onPress={() => setMode("text")}>
                  <Text style={s.modeIcon}>📝</Text>
                  <Text style={s.modeName}>文字输入</Text>
                  <Text style={s.modeDesc}>粘贴或手打账单</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* File mode */}
            {mode === "file" && preview.length === 0 && (
              <View style={s.actionArea}>
                <TouchableOpacity style={s.pickBtn} onPress={handleFilePick}>
                  <Text style={s.pickBtnText}>选择 CSV 文件</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.backBtn} onPress={reset}>
                  <Text style={s.backBtnText}>返回</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Text mode */}
            {mode === "text" && preview.length === 0 && (
              <View style={s.actionArea}>
                <TextInput
                  style={s.textArea}
                  value={textInput}
                  onChangeText={setTextInput}
                  placeholder={
                    "粘贴账单，每行一条，例如：\n2026-04-01 Woolworths 食品 $185\n2026-04-02 房租 $2100\n2026-04-03 Uber 打车 $25"
                  }
                  placeholderTextColor={Colors.text3}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                <View style={s.textBtnRow}>
                  <TouchableOpacity style={s.parseBtn} onPress={handleTextParse}>
                    <Text style={s.parseBtnText}>解析</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.backBtn} onPress={reset}>
                    <Text style={s.backBtnText}>返回</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Loading */}
            {parsing && (
              <View style={s.loadingRow}>
                <ActivityIndicator color={Colors.green} />
                <Text style={s.loadingText}>解析中...</Text>
              </View>
            )}

            {/* Preview */}
            {preview.length > 0 && (
              <View style={s.previewArea}>
                <Text style={s.previewTitle}>
                  预览（{preview.length} 条记录）
                </Text>
                {preview.slice(0, 10).map((t, i) => (
                  <View key={i} style={s.previewRow}>
                    <Text style={s.previewDate}>{t.date}</Text>
                    <Text style={s.previewDesc} numberOfLines={1}>
                      {t.description}
                    </Text>
                    <Text
                      style={[
                        s.previewAmt,
                        { color: t.type === "income" ? Colors.green : Colors.red },
                      ]}
                    >
                      {fmtMoney(t.amount)}
                    </Text>
                  </View>
                ))}
                {preview.length > 10 && (
                  <Text style={s.moreText}>...还有 {preview.length - 10} 条</Text>
                )}
                <View style={s.importBtnRow}>
                  <TouchableOpacity style={s.importBtn} onPress={handleImport}>
                    <Text style={s.importBtnText}>确认导入</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.backBtn} onPress={reset}>
                    <Text style={s.backBtnText}>取消</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Close */}
            {!mode && (
              <TouchableOpacity style={[s.backBtn, { marginTop: Spacing.lg }]} onPress={onClose}>
                <Text style={s.backBtnText}>关闭</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xxl,
    maxHeight: "85%",
    paddingBottom: Platform.OS === "ios" ? 40 : Spacing.xxl,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 12,
    color: Colors.text2,
    fontWeight: "500",
    marginBottom: 6,
  },
  personRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  personBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  personBtnActive: {
    borderColor: Colors.blue,
    backgroundColor: Colors.blueBg,
  },
  personBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text2,
  },
  personBtnTextActive: {
    color: Colors.blue,
  },
  modeGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  modeCard: {
    flex: 1,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: "center",
  },
  modeIcon: { fontSize: 28, marginBottom: 6 },
  modeName: { fontSize: 13, fontWeight: "600", color: Colors.text },
  modeDesc: { fontSize: 11, color: Colors.text2, marginTop: 4, textAlign: "center" },
  actionArea: { marginTop: Spacing.md },
  pickBtn: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: 14,
    alignItems: "center",
  },
  pickBtnText: { color: Colors.text, fontWeight: "500", fontSize: 14 },
  textArea: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 13,
    minHeight: 120,
  },
  textBtnRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  parseBtn: {
    flex: 1,
    backgroundColor: Colors.green,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  parseBtnText: { color: "#000", fontWeight: "700", fontSize: 14 },
  backBtn: {
    flex: 1,
    backgroundColor: Colors.surface2,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: { color: Colors.text2, fontWeight: "500", fontSize: 14 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  loadingText: { color: Colors.text2, fontSize: 13 },
  previewArea: { marginTop: Spacing.md },
  previewTitle: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: Spacing.md },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  previewDate: { fontSize: 11, color: Colors.text3, fontVariant: ["tabular-nums"], width: 80 },
  previewDesc: { flex: 1, fontSize: 12, color: Colors.text2 },
  previewAmt: { fontSize: 12, fontWeight: "600", fontVariant: ["tabular-nums"] },
  moreText: { fontSize: 12, color: Colors.text3, textAlign: "center", paddingVertical: 8 },
  importBtnRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.lg },
  importBtn: {
    flex: 1,
    backgroundColor: Colors.green,
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  importBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
});
