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
  Image,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
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

type ImportMode = "csv" | "pdf" | "screenshot" | "text" | null;

export default function ImportModal({ visible, onClose, onImport, settings }: Props) {
  const [mode, setMode] = useState<ImportMode>(null);
  const [preview, setPreview] = useState<Omit<Transaction, "id" | "created_at">[]>([]);
  const [person, setPerson] = useState(settings.person1);
  const [textInput, setTextInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // ─── CSV row parser ─────────────────────────────────────────────────────
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
        return { date, amount: absAmt, category: cat, description: desc || "未知交易", person, type };
      })
      .filter((r) => r.amount > 0);
  };

  // ─── Month name → number map ─────────────────────────────────────────────
  const MONTH_MAP: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
    july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04", jun: "06", jul: "07",
    aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };

  // ─── Text line parser (manual text input) ──────────────────────────────
  const parseTextLines = (raw: string) => {
    const lines = raw.trim().split("\n").filter((l) => l.trim());
    const results: Omit<Transaction, "id" | "created_at">[] = [];
    for (const line of lines) {
      let date = new Date().toISOString().slice(0, 10);
      let amount = 0;
      let desc = line.trim();

      // Try YYYY-MM-DD or YYYY/MM/DD
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
    return results;
  };

  // ─── Credit card / bank statement parser (for PDF) ─────────────────────
  const parseStatement = (raw: string) => {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    const results: Omit<Transaction, "id" | "created_at">[] = [];

    // Detect year from header (e.g. "April 1, 2026" or "March 02 to April 1, 2026")
    let year = new Date().getFullYear().toString();
    const yearMatch = raw.match(/(?:20\d{2})/g);
    if (yearMatch) year = yearMatch[yearMatch.length > 1 ? 1 : 0];

    // Pattern: "March 14 DESCRIPTION 123.45" or "March 14 DESCRIPTION 1,234.56\nCR"
    const monthPat = "(?:january|february|march|april|may|june|july|august|september|october|november|december)";
    const txRegex = new RegExp(
      `^(${monthPat})\\s+(\\d{1,2})\\s+(.+?)\\s+([\\d,]+\\.\\d{2})\\s*(cr)?$`,
      "i"
    );

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(txRegex);
      if (!m) continue;

      const monthNum = MONTH_MAP[m[1].toLowerCase()];
      if (!monthNum) continue;
      const day = m[2].padStart(2, "0");
      const date = `${year}-${monthNum}-${day}`;
      const rawDesc = m[3].trim();
      const amount = parseFloat(m[4].replace(/,/g, ""));
      const isCredit = !!m[5] || (i + 1 < lines.length && /^cr$/i.test(lines[i + 1]?.trim()));

      if (amount <= 0) continue;

      // Skip page headers, totals, etc.
      if (/^total|^page\s+\d|^opening|^closing|^statement/i.test(rawDesc)) continue;

      // Clean description: remove location-only suffixes, references
      let desc = rawDesc
        .replace(/\s*Reference:\s*/i, "")
        .replace(/\s*Routing:.*$/i, "")
        .replace(/\s*Ticket:.*$/i, "")
        .replace(/\s*Passenger:.*$/i, "")
        .replace(/\s*Card Number.*$/i, "")
        .trim();

      // Check for multi-line descriptions (next line could be category/reference)
      if (i + 1 < lines.length && !/^(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(lines[i + 1]) && !/^\d/.test(lines[i + 1]) && !/^total/i.test(lines[i + 1]) && !/^cr$/i.test(lines[i + 1]) && lines[i + 1].length < 60) {
        // might be a sub-description like "GROCERIES" or "GOVERNMENT SERVICES"
        // skip it as a separate line
      }

      const cat = autoCategory(desc);
      let type: TransactionType;
      if (isCredit) {
        type = "income";
      } else {
        type = cat === "investment" ? "investment" : cat === "savings" ? "savings" : "expense";
      }

      results.push({ date, amount, category: isCredit ? "income" : cat, description: desc || "未知交易", person, type });
    }

    return results;
  };

  // ─── CSV file pick ──────────────────────────────────────────────────────
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

  // ─── helper: read file as base64 (web vs native) ─────────────────────────
  const readFileAsBase64 = async (fileAsset: any): Promise<string> => {
    if (Platform.OS === "web") {
      // Web: DocumentPicker gives a blob URI → use fetch + FileReader
      const resp = await fetch(fileAsset.uri);
      const blob = await resp.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          // strip "data:...;base64," prefix
          resolve(dataUrl.split(",")[1] || "");
        };
        reader.onerror = () => reject(new Error("文件读取失败"));
        reader.readAsDataURL(blob);
      });
    }
    return FileSystem.readAsStringAsync(fileAsset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  };

  // ─── PDF file pick ──────────────────────────────────────────────────────
  const handlePdfPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setParsing(true);
      const base64 = await readFileAsBase64(result.assets[0]);
      const res = await fetch("http://localhost:3001/api/import/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PDF 解析失败");
      setTextInput(data.text);
      // Try statement parser first; fall back to simple text parser
      const stmtResults = parseStatement(data.text);
      setPreview(stmtResults.length > 0 ? stmtResults : parseTextLines(data.text));
      setParsing(false);
    } catch (e: any) {
      Alert.alert("PDF 解析失败", e.message || "无法读取 PDF 文件");
      setParsing(false);
    }
  };

  // ─── Screenshot / Image pick ────────────────────────────────────────────
  const handleImagePick = async (fromCamera: boolean) => {
    try {
      let result;
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("权限不足", "需要相机权限才能拍照");
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
        });
      }
      if (result.canceled || !result.assets?.[0]) return;
      setImageUri(result.assets[0].uri);
    } catch (e) {
      Alert.alert("错误", "图片选择失败");
    }
  };

  // ─── Text parse button ──────────────────────────────────────────────────
  const handleTextParse = () => {
    if (!textInput.trim()) return;
    setParsing(true);
    try {
      setPreview(parseTextLines(textInput));
    } catch {
      Alert.alert("解析失败", "文本格式无法识别");
    }
    setParsing(false);
  };

  // ─── Confirm import ─────────────────────────────────────────────────────
  const handleImport = () => {
    if (preview.length === 0) return;
    onImport(preview);
    resetAll();
    onClose();
  };

  const resetAll = () => {
    setPreview([]);
    setMode(null);
    setTextInput("");
    setImageUri(null);
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

            {/* ── Mode selector (2x2 grid) ─────────────────────────────── */}
            {!mode && preview.length === 0 && (
              <>
                <View style={s.modeGrid}>
                  <TouchableOpacity style={s.modeCard} onPress={() => setMode("csv")}>
                    <Text style={s.modeIcon}>📄</Text>
                    <Text style={s.modeName}>CSV 文件</Text>
                    <Text style={s.modeDesc}>导入 .csv 银行账单</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.modeCard} onPress={() => setMode("pdf")}>
                    <Text style={s.modeIcon}>📑</Text>
                    <Text style={s.modeName}>PDF 导入</Text>
                    <Text style={s.modeDesc}>解析 PDF 账单文件</Text>
                  </TouchableOpacity>
                </View>
                <View style={[s.modeGrid, { marginTop: Spacing.md }]}>
                  <TouchableOpacity style={s.modeCard} onPress={() => setMode("screenshot")}>
                    <Text style={s.modeIcon}>📸</Text>
                    <Text style={s.modeName}>截图识别</Text>
                    <Text style={s.modeDesc}>拍照或选图 + 手动输入</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.modeCard} onPress={() => setMode("text")}>
                    <Text style={s.modeIcon}>📝</Text>
                    <Text style={s.modeName}>文字输入</Text>
                    <Text style={s.modeDesc}>粘贴或手打账单</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── CSV mode ─────────────────────────────────────────────── */}
            {mode === "csv" && preview.length === 0 && (
              <View style={s.actionArea}>
                <TouchableOpacity style={s.pickBtn} onPress={handleFilePick}>
                  <Text style={s.pickBtnText}>选择 CSV 文件</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.backBtn} onPress={resetAll}>
                  <Text style={s.backBtnText}>返回</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── PDF mode ─────────────────────────────────────────────── */}
            {mode === "pdf" && preview.length === 0 && (
              <View style={s.actionArea}>
                <Text style={s.modeHint}>
                  选择 PDF 账单文件，系统将自动提取文字并解析交易记录
                </Text>
                <TouchableOpacity style={s.pickBtn} onPress={handlePdfPick}>
                  <Text style={s.pickBtnText}>选择 PDF 文件</Text>
                </TouchableOpacity>
                {textInput.length > 0 && (
                  <View style={s.extractedBox}>
                    <Text style={s.extractedLabel}>提取到的文字：</Text>
                    <Text style={s.extractedText} numberOfLines={8}>
                      {textInput}
                    </Text>
                  </View>
                )}
                <TouchableOpacity style={s.backBtn} onPress={resetAll}>
                  <Text style={s.backBtnText}>返回</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Screenshot mode ──────────────────────────────────────── */}
            {mode === "screenshot" && preview.length === 0 && (
              <View style={s.actionArea}>
                <Text style={s.modeHint}>
                  拍照或从相册选取账单截图，然后手动输入识别到的内容
                </Text>
                <View style={s.imgBtnRow}>
                  <TouchableOpacity style={s.imgBtn} onPress={() => handleImagePick(true)}>
                    <Text style={s.imgBtnIcon}>📷</Text>
                    <Text style={s.imgBtnText}>拍照</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.imgBtn} onPress={() => handleImagePick(false)}>
                    <Text style={s.imgBtnIcon}>🖼️</Text>
                    <Text style={s.imgBtnText}>相册选图</Text>
                  </TouchableOpacity>
                </View>

                {imageUri && (
                  <Image
                    source={{ uri: imageUri }}
                    style={s.imagePreview}
                    resizeMode="contain"
                  />
                )}

                <Text style={[s.label, { marginTop: Spacing.md }]}>
                  请输入截图中的账单内容（每行一条）
                </Text>
                <TextInput
                  style={s.textArea}
                  value={textInput}
                  onChangeText={setTextInput}
                  placeholder={
                    "参照截图输入，每行一条，例如：\n2026-04-01 Woolworths $185\n2026-04-02 房租 $2100"
                  }
                  placeholderTextColor={Colors.text3}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
                <View style={s.textBtnRow}>
                  <TouchableOpacity style={s.parseBtn} onPress={handleTextParse}>
                    <Text style={s.parseBtnText}>解析</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.backBtn} onPress={resetAll}>
                    <Text style={s.backBtnText}>返回</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── Text mode ────────────────────────────────────────────── */}
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
                  <TouchableOpacity style={s.backBtn} onPress={resetAll}>
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
                  <TouchableOpacity style={s.backBtn} onPress={resetAll}>
                    <Text style={s.backBtnText}>取消</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Close (only on mode selector) */}
            {!mode && preview.length === 0 && (
              <TouchableOpacity
                style={[s.closeBtn, { marginTop: Spacing.xl }]}
                onPress={() => { resetAll(); onClose(); }}
              >
                <Text style={s.closeBtnText}>关闭</Text>
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
  },
  modeCard: {
    flex: 1,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
  },
  modeIcon: { fontSize: 28, marginBottom: 6 },
  modeName: { fontSize: 13, fontWeight: "600", color: Colors.text },
  modeDesc: { fontSize: 11, color: Colors.text2, marginTop: 4, textAlign: "center" },
  modeHint: {
    fontSize: 12,
    color: Colors.text3,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  actionArea: { marginTop: Spacing.md, gap: Spacing.md },
  pickBtn: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: 14,
    alignItems: "center",
  },
  pickBtnText: { color: Colors.text, fontWeight: "500", fontSize: 14 },
  imgBtnRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  imgBtn: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: 16,
    alignItems: "center",
    gap: 4,
  },
  imgBtnIcon: { fontSize: 24 },
  imgBtnText: { fontSize: 12, color: Colors.text2, fontWeight: "500" },
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface2,
  },
  extractedBox: {
    backgroundColor: Colors.surface2,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  extractedLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text2,
    marginBottom: 6,
  },
  extractedText: {
    fontSize: 11,
    color: Colors.text3,
    lineHeight: 16,
  },
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
  closeBtn: {
    backgroundColor: Colors.surface2,
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeBtnText: { color: Colors.text2, fontWeight: "500", fontSize: 14 },
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
