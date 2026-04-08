import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Colors, Spacing, BorderRadius } from "../lib/theme";
import { CATEGORIES } from "../lib/constants";
import { Transaction, TransactionType, Settings } from "../lib/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, "id" | "created_at">) => void;
  onSaveRecurring?: (txns: Omit<Transaction, "id" | "created_at">[]) => void;
  editTx?: Transaction | null;
  settings: Settings;
}

type Recurrence = "none" | "monthly" | "yearly";

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "支出" },
  { value: "income", label: "收入" },
  { value: "investment", label: "投资" },
  { value: "savings", label: "储蓄" },
];

const RECURRENCE_OPTIONS: { value: Recurrence; label: string; desc: string }[] = [
  { value: "none", label: "不重复", desc: "仅一次" },
  { value: "monthly", label: "每月固定", desc: "每月重复生成" },
  { value: "yearly", label: "每年固定", desc: "每年重复生成" },
];

export default function AddTransactionModal({
  visible,
  onClose,
  onSave,
  onSaveRecurring,
  editTx,
  settings,
}: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [person, setPerson] = useState(settings.person1);
  const [type, setType] = useState<TransactionType>("expense");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [recurrenceCount, setRecurrenceCount] = useState("12");
  const [errors, setErrors] = useState<{ amount?: string; description?: string }>({});

  // Re-initialize when editTx or visibility changes
  useEffect(() => {
    if (visible) {
      setDate(editTx?.date || new Date().toISOString().slice(0, 10));
      setAmount(editTx?.amount?.toString() || "");
      setCategory(editTx?.category || "other");
      setDescription(editTx?.description || "");
      setPerson(editTx?.person || settings.person1);
      setType(editTx?.type || "expense");
      setRecurrence("none");
      setRecurrenceCount("12");
      setErrors({});
    }
  }, [visible, editTx]);

  const handleSave = () => {
    const amt = parseFloat(amount);
    const newErrors: { amount?: string; description?: string } = {};
    if (!amt || amt <= 0) newErrors.amount = "请输入有效金额";
    if (!description.trim()) newErrors.description = "请填写描述";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const baseTx: Omit<Transaction, "id" | "created_at"> = {
      date,
      amount: amt,
      category: type === "income" ? "income" : category,
      description: description.trim(),
      person,
      type,
    };

    if (recurrence === "none" || editTx) {
      // Single transaction (or editing existing)
      onSave(baseTx);
    } else {
      // Generate recurring transactions
      const txns: Omit<Transaction, "id" | "created_at">[] = [];
      const d = new Date(date);
      const count = parseInt(recurrenceCount) || (recurrence === "monthly" ? 12 : 3);
      const stepMonths = recurrence === "monthly" ? 1 : 12;

      for (let i = 0; i < count; i++) {
        const nd = new Date(d);
        nd.setMonth(nd.getMonth() + i * stepMonths);
        const y = nd.getFullYear();
        const m = String(nd.getMonth() + 1).padStart(2, "0");
        const day = String(Math.min(d.getDate(), new Date(y, nd.getMonth() + 1, 0).getDate())).padStart(2, "0");
        txns.push({ ...baseTx, date: `${y}-${m}-${day}` });
      }

      if (onSaveRecurring) {
        onSaveRecurring(txns);
      } else {
        // Fallback: save one by one
        onSave(baseTx);
      }
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={s.title}>{editTx ? "编辑交易" : "新增交易"}</Text>

            {/* Type selector */}
            <Text style={s.label}>类型</Text>
            <View style={s.typeRow}>
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.typeBtn, type === opt.value && s.typeBtnActive]}
                  onPress={() => {
                    setType(opt.value);
                    if (opt.value === "income") setCategory("income");
                  }}
                >
                  <Text style={[s.typeBtnText, type === opt.value && s.typeBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date */}
            <Text style={s.label}>日期</Text>
            <TextInput
              style={s.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.text3}
            />

            {/* Amount */}
            <Text style={s.label}>金额</Text>
            <TextInput
              style={[s.input, errors.amount ? s.inputError : null]}
              value={amount}
              onChangeText={(v) => { setAmount(v); setErrors((e) => ({ ...e, amount: undefined })); }}
              placeholder="0.00"
              placeholderTextColor={Colors.text3}
              keyboardType="decimal-pad"
            />
            {errors.amount ? <Text style={s.errorText}>{errors.amount}</Text> : null}

            {/* Description */}
            <Text style={s.label}>描述</Text>
            <TextInput
              style={[s.input, errors.description ? s.inputError : null]}
              value={description}
              onChangeText={(v) => { setDescription(v); setErrors((e) => ({ ...e, description: undefined })); }}
              placeholder="消费说明..."
              placeholderTextColor={Colors.text3}
            />
            {errors.description ? <Text style={s.errorText}>{errors.description}</Text> : null}

            {/* Category */}
            {type !== "income" && (
              <>
                <Text style={s.label}>类别</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={s.catScroll}
                >
                  {CATEGORIES.filter((c) => c.id !== "income").map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[s.catChip, category === c.id && { borderColor: c.color, backgroundColor: c.color + "20" }]}
                      onPress={() => setCategory(c.id)}
                    >
                      <Text style={s.catChipIcon}>{c.icon}</Text>
                      <Text
                        style={[s.catChipText, category === c.id && { color: c.color }]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Person */}
            <Text style={s.label}>成员</Text>
            <View style={s.typeRow}>
              {[settings.person1, settings.person2].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[s.typeBtn, person === p && s.typeBtnActive]}
                  onPress={() => setPerson(p)}
                >
                  <Text style={[s.typeBtnText, person === p && s.typeBtnTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recurrence (only for new transactions) */}
            {!editTx && (
              <>
                <Text style={s.label}>重复</Text>
                <View style={s.recRow}>
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        s.recBtn,
                        recurrence === opt.value && s.recBtnActive,
                      ]}
                      onPress={() => setRecurrence(opt.value)}
                    >
                      <Text style={[s.recBtnLabel, recurrence === opt.value && s.recBtnLabelActive]}>
                        {opt.label}
                      </Text>
                      <Text style={s.recBtnDesc}>{opt.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Recurrence count input */}
                {recurrence !== "none" && (
                  <View style={s.recCountContainer}>
                    <Text style={s.label}>
                      {recurrence === "monthly" ? "生成月数" : "生成年数"}
                    </Text>
                    <View style={s.recCountInputRow}>
                      <TextInput
                        style={s.recCountInput}
                        value={recurrenceCount}
                        onChangeText={setRecurrenceCount}
                        placeholder={recurrence === "monthly" ? "12" : "3"}
                        placeholderTextColor={Colors.text3}
                        keyboardType="number-pad"
                      />
                      <Text style={s.recCountUnit}>
                        {recurrence === "monthly" ? "个月" : "年"}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Buttons */}
            <View style={s.btnRow}>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                <Text style={s.saveBtnText}>
                  {recurrence !== "none" && !editTx
                    ? `保存 (${recurrenceCount}${recurrence === "monthly" ? "个月" : "年"})`
                    : "保存"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
                <Text style={s.cancelBtnText}>取消</Text>
              </TouchableOpacity>
            </View>
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
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 40 : Spacing.xxl,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 12,
    color: Colors.text2,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: Spacing.md,
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
  inputError: {
    borderColor: Colors.red,
    backgroundColor: Colors.redBg,
  },
  errorText: {
    fontSize: 11,
    color: Colors.red,
    marginTop: 4,
  },
  typeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  typeBtnActive: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenBg,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text2,
  },
  typeBtnTextActive: {
    color: Colors.green,
  },
  catScroll: {
    marginBottom: 4,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    gap: 4,
  },
  catChipIcon: {
    fontSize: 14,
  },
  catChipText: {
    fontSize: 12,
    color: Colors.text2,
    fontWeight: "500",
  },
  recRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  recBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  recBtnActive: {
    borderColor: Colors.amber,
    backgroundColor: Colors.amberBg,
  },
  recBtnLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text2,
  },
  recBtnLabelActive: {
    color: Colors.amber,
  },
  recBtnDesc: {
    fontSize: 10,
    color: Colors.text3,
    marginTop: 2,
  },
  recCountContainer: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  recCountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  recCountInput: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 14,
  },
  recCountUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text2,
    minWidth: 40,
  },
  btnRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.green,
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.surface2,
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.text2,
    fontWeight: "500",
    fontSize: 15,
  },
});
