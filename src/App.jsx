import { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc, collection, addDoc, query, orderBy, limit, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import * as XLSX from "xlsx";
import {
  Check, X, Download, RotateCcw, Zap, AlertTriangle, Sparkles,
  Award, ChevronLeft, ChevronRight, ListChecks, CalendarDays,
  BarChart3, ClipboardCheck, Sun, Moon, Trophy, AlertCircle, Camera, Eye,
  LogOut, Cloud, CloudOff, RefreshCw, User, Settings, Plus, Trash2, Edit3, Save,
  Crown, Shield, Lock, History, Undo2, Filter, FileText, Share2, Clock
} from "lucide-react";

// ============ DATA ============
const DAYS = ["週一", "週二", "週三", "週四", "週五", "週六"];

const DEFAULT_ROSTER = [
  { seq: 1,  cls: 904, num: 8,  name: "金采儀", grade: 9, sch: [1,1,1,1,0,0,1,1,0,0,0,1] },
  { seq: 2,  cls: 905, num: 23, name: "唐家寶", grade: 9, sch: [1,1,0,0,0,0,1,1,0,0,0,0] },
  { seq: 3,  cls: 906, num: 25, name: "呂誠",   grade: 9, sch: [1,1,0,0,1,1,0,0,0,0,0,0] },
  { seq: 4,  cls: 908, num: 33, name: "楊宥樂", grade: 9, sch: [0,0,0,0,1,1,0,0,1,1,0,1] },
  { seq: 5,  cls: 913, num: 26, name: "洪禮揚", grade: 9, sch: [1,1,0,0,0,0,1,1,0,0,0,1] },
  { seq: 6,  cls: 802, num: 11, name: "楊霈妮", grade: 8, sch: [1,1,0,0,1,1,0,0,1,1,0,0] },
  { seq: 7,  cls: 803, num: 23, name: "呂紹宇", grade: 8, sch: [1,1,0,0,1,1,0,0,1,1,0,0] },
  { seq: 8,  cls: 804, num: 16, name: "蔡萭潼", grade: 8, sch: [1,0,0,0,1,1,0,0,1,1,0,0] },
  { seq: 9,  cls: 810, num: 35, name: "鄭宇廷", grade: 8, sch: [1,1,0,0,1,1,0,0,0,0,0,0] },
  { seq: 10, cls: 812, num: 31, name: "楊立傳", grade: 8, sch: [1,1,0,0,1,1,0,0,0,0,0,0] },
  { seq: 11, cls: 812, num: 32, name: "楊立楷", grade: 8, sch: [1,1,0,0,1,1,0,0,0,0,0,0] },
  { seq: 12, cls: 813, num: 2,  name: "王曉霏", grade: 8, sch: [1,1,0,0,1,1,0,0,1,1,0,0] },
  { seq: 13, cls: 813, num: 21, name: "李晨睿", grade: 8, sch: [1,1,0,0,1,1,0,0,1,1,0,0] },
  { seq: 14, cls: 815, num: 26, name: "林泳廷", grade: 8, sch: [1,1,0,0,1,1,0,0,1,1,0,0] },
  { seq: 15, cls: 816, num: 1,  name: "蔡進樺", grade: 8, sch: [1,1,0,0,1,1,0,0,1,1,0,0] },
  { seq: 16, cls: 701, num: 24, name: "林子堯", grade: 7, sch: [1,1,1,1,1,1,1,1,0,0,1,0] },
  { seq: 17, cls: 702, num: 7,  name: "和怡霈", grade: 7, sch: [1,1,1,1,1,1,1,1,1,1,1,0] },
  { seq: 18, cls: 703, num: 12, name: "曾澄",   grade: 7, sch: [1,1,1,1,1,1,1,1,1,1,0,0] },
  { seq: 19, cls: 703, num: 22, name: "吳定宇", grade: 7, sch: [1,1,1,1,1,1,1,1,0,0,0,0] },
  { seq: 20, cls: 703, num: 33, name: "楊杰栩", grade: 7, sch: [1,1,1,1,1,1,1,1,1,1,0,0] },
  { seq: 21, cls: 703, num: 37, name: "蘇柏宇", grade: 7, sch: [1,1,0,0,1,1,0,0,1,1,0,0] },
  { seq: 22, cls: 706, num: 28, name: "陳羿愷", grade: 7, sch: [1,1,1,1,1,1,1,1,1,1,0,1] },
  { seq: 23, cls: 709, num: 4,  name: "朱秭儀", grade: 7, sch: [1,1,1,1,1,1,1,1,1,1,1,1] },
  { seq: 24, cls: 710, num: 3,  name: "周懿",   grade: 7, sch: [1,1,1,1,1,1,1,1,1,1,1,1] },
  { seq: 25, cls: 710, num: 5,  name: "柯柔瑄", grade: 7, sch: [1,1,0,0,1,1,1,1,0,0,1,0] },
  { seq: 26, cls: 710, num: 22, name: "何浩霆", grade: 7, sch: [1,1,1,1,1,1,1,1,1,1,0,0] },
  { seq: 27, cls: 710, num: 35, name: "鄭咏承", grade: 7, sch: [1,1,0,0,1,1,1,1,0,0,0,0] },
  { seq: 28, cls: 711, num: 10, name: "陳柏方", grade: 7, sch: [1,1,1,1,1,1,1,1,1,1,0,0] },
  { seq: 29, cls: 713, num: 12, name: "楊詠昕", grade: 7, sch: [1,1,1,1,1,1,1,1,1,1,0,0] },
  { seq: 30, cls: 714, num: 36, name: "謝東君", grade: 7, sch: [1,1,1,1,1,1,1,1,0,0,1,1] },
  { seq: 31, cls: 715, num: 2,  name: "何昕語", grade: 7, sch: [1,1,0,0,1,1,1,1,1,1,0,0] },
  { seq: 32, cls: 715, num: 14, name: "鄭郁馨", grade: 7, sch: [1,1,1,1,1,1,1,1,1,1,0,1] },
  { seq: 33, cls: 716, num: 23, name: "呂訢",   grade: 7, sch: [1,1,1,1,1,1,1,1,0,0,1,1] },
];

const GRADE_NAMES = { 9: "九年級", 8: "八年級", 7: "七年級" };

// ============ roster CONTEXT ============
const RosterContext = createContext({ roster: DEFAULT_ROSTER, setRoster: () => {} });
const useRoster = () => useContext(RosterContext);

// 找特定 seq 的 person（用於 audit log 紀錄人名）
const ROSTER_lookup = (roster, seq) => roster.find(p => p.seq === seq);

// 把成績選手名字依照點名 roster 的順序排序
// roster 內的名字 → 照 seq 排；roster 沒有的名字 → 排在後面（保持原順序）
const sortSwimmerNames = (names, roster) => {
  const orderMap = {};
  (roster || []).forEach((p, idx) => { orderMap[p.name] = idx; });
  return [...names].sort((a, b) => {
    const ia = orderMap[a];
    const ib = orderMap[b];
    if (ia !== undefined && ib !== undefined) return ia - ib;  // 都在 roster → 照順序
    if (ia !== undefined) return -1;  // a 在 roster，排前面
    if (ib !== undefined) return 1;   // b 在 roster，排前面
    return 0;  // 都不在 roster → 保持原順序
  });
};

// ============ DATE HELPERS ============
const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromDateStr = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

// ============ 場地常數 ============
const VENUES = {
  longmen: { id: "longmen", label: "龍門", short: "龍", color: "#1A3D4D", bg: "#E8EEF0", fee: 0 },
  yongyun: { id: "yongyun", label: "永運", short: "永", color: "#A85518", bg: "#FBE5D2", fee: 50 },
  closed:  { id: "closed",  label: "停練", short: "停", color: "#6F6A5C", bg: "#E8E5DD", fee: 0 },
};
const VENUE_FEE = 50;
// 場地切換時可選的場地（不含 closed，停練不能手動點選，只能由行事曆/系統設定）
const SELECTABLE_VENUES = ["longmen", "yongyun"];

// Excel 行事曆預設值（從 龍門泳隊下學期隊費 v3 自動連動版 解析而來）
// 範圍：2025-09-01 ~ 2026-08-31（一整個學年）
// 結構：{ am: 'longmen'|'yongyun'|'closed', pm: ..., note?: '...' }
const VENUE_CALENDAR = {
  "2025-09-01": { am: "longmen", pm: "yongyun" },
  "2025-09-02": { am: "closed", pm: "yongyun", note: "歲修" },
  "2025-09-03": { am: "closed", pm: "yongyun", note: "歲修" },
  "2025-09-04": { am: "closed", pm: "closed", note: "總統盃" },
  "2025-09-05": { am: "closed", pm: "closed", note: "總統盃" },
  "2025-09-06": { am: "closed", pm: "closed", note: "總統盃" },
  "2025-09-07": { am: "closed", pm: "closed", note: "總統盃" },
  "2025-09-08": { am: "closed", pm: "closed", note: "總統盃" },
  "2025-09-09": { am: "closed", pm: "closed", note: "總統盃" },
  "2025-09-10": { am: "longmen", pm: "longmen" },
  "2025-09-11": { am: "longmen", pm: "longmen" },
  "2025-09-12": { am: "closed", pm: "longmen" },
  "2025-09-13": { am: "yongyun", pm: "yongyun" },
  "2025-09-14": { am: "closed", pm: "closed" },
  "2025-09-15": { am: "longmen", pm: "longmen" },
  "2025-09-16": { am: "longmen", pm: "longmen" },
  "2025-09-17": { am: "longmen", pm: "longmen" },
  "2025-09-18": { am: "longmen", pm: "longmen" },
  "2025-09-19": { am: "longmen", pm: "longmen" },
  "2025-09-20": { am: "yongyun", pm: "yongyun" },
  "2025-09-21": { am: "closed", pm: "closed" },
  "2025-09-22": { am: "longmen", pm: "longmen" },
  "2025-09-23": { am: "longmen", pm: "closed" },
  "2025-09-24": { am: "longmen", pm: "longmen" },
  "2025-09-25": { am: "longmen", pm: "longmen" },
  "2025-09-26": { am: "closed", pm: "closed", note: "北區B" },
  "2025-09-27": { am: "closed", pm: "closed", note: "北區B" },
  "2025-09-28": { am: "closed", pm: "closed", note: "北區B" },
  "2025-09-29": { am: "closed", pm: "closed" },
  "2025-09-30": { am: "longmen", pm: "longmen" },
  "2025-10-01": { am: "longmen", pm: "longmen" },
  "2025-10-02": { am: "longmen", pm: "longmen" },
  "2025-10-03": { am: "longmen", pm: "longmen" },
  "2025-10-04": { am: "yongyun", pm: "yongyun" },
  "2025-10-05": { am: "closed", pm: "closed" },
  "2025-10-06": { am: "closed", pm: "closed" },
  "2025-10-07": { am: "longmen", pm: "longmen" },
  "2025-10-08": { am: "longmen", pm: "longmen" },
  "2025-10-09": { am: "longmen", pm: "longmen" },
  "2025-10-10": { am: "yongyun", pm: "yongyun" },
  "2025-10-11": { am: "yongyun", pm: "yongyun" },
  "2025-10-12": { am: "closed", pm: "closed" },
  "2025-10-13": { am: "longmen", pm: "closed" },
  "2025-10-14": { am: "closed", pm: "closed", note: "月考I" },
  "2025-10-15": { am: "closed", pm: "longmen", note: "月考I" },
  "2025-10-16": { am: "longmen", pm: "longmen" },
  "2025-10-17": { am: "longmen", pm: "longmen" },
  "2025-10-18": { am: "yongyun", pm: "yongyun" },
  "2025-10-19": { am: "closed", pm: "closed" },
  "2025-10-20": { am: "longmen", pm: "longmen" },
  "2025-10-21": { am: "longmen", pm: "longmen" },
  "2025-10-22": { am: "longmen", pm: "longmen" },
  "2025-10-23": { am: "longmen", pm: "longmen" },
  "2025-10-24": { am: "yongyun", pm: "yongyun" },
  "2025-10-25": { am: "closed", pm: "closed", note: "幼獅盃" },
  "2025-10-26": { am: "closed", pm: "closed" },
  "2025-10-27": { am: "longmen", pm: "longmen" },
  "2025-10-28": { am: "longmen", pm: "longmen" },
  "2025-10-29": { am: "longmen", pm: "longmen" },
  "2025-10-30": { am: "longmen", pm: "longmen" },
  "2025-10-31": { am: "longmen", pm: "longmen" },
  "2025-11-01": { am: "yongyun", pm: "yongyun" },
  "2025-11-02": { am: "closed", pm: "closed", note: "中正盃" },
  "2025-11-03": { am: "longmen", pm: "longmen" },
  "2025-11-04": { am: "longmen", pm: "longmen" },
  "2025-11-05": { am: "longmen", pm: "longmen" },
  "2025-11-06": { am: "longmen", pm: "longmen" },
  "2025-11-07": { am: "longmen", pm: "closed" },
  "2025-11-08": { am: "yongyun", pm: "closed" },
  "2025-11-09": { am: "closed", pm: "closed" },
  "2025-11-10": { am: "longmen", pm: "longmen" },
  "2025-11-11": { am: "longmen", pm: "longmen" },
  "2025-11-12": { am: "longmen", pm: "longmen" },
  "2025-11-13": { am: "longmen", pm: "longmen" },
  "2025-11-14": { am: "longmen", pm: "longmen" },
  "2025-11-15": { am: "closed", pm: "closed", note: "校慶" },
  "2025-11-16": { am: "closed", pm: "closed" },
  "2025-11-17": { am: "longmen", pm: "closed" },
  "2025-11-18": { am: "longmen", pm: "longmen" },
  "2025-11-19": { am: "longmen", pm: "longmen" },
  "2025-11-20": { am: "longmen", pm: "longmen" },
  "2025-11-21": { am: "longmen", pm: "longmen" },
  "2025-11-22": { am: "yongyun", pm: "yongyun" },
  "2025-11-23": { am: "closed", pm: "closed" },
  "2025-11-24": { am: "longmen", pm: "longmen" },
  "2025-11-25": { am: "longmen", pm: "longmen" },
  "2025-11-26": { am: "longmen", pm: "longmen" },
  "2025-11-27": { am: "longmen", pm: "longmen" },
  "2025-11-28": { am: "longmen", pm: "longmen" },
  "2025-11-29": { am: "yongyun", pm: "yongyun" },
  "2025-11-30": { am: "closed", pm: "closed" },
  "2025-12-01": { am: "longmen", pm: "closed" },
  "2025-12-02": { am: "closed", pm: "closed", note: "月考II" },
  "2025-12-03": { am: "closed", pm: "longmen", note: "月考II" },
  "2025-12-04": { am: "longmen", pm: "longmen" },
  "2025-12-05": { am: "longmen", pm: "longmen" },
  "2025-12-06": { am: "yongyun", pm: "yongyun" },
  "2025-12-07": { am: "yongyun", pm: "closed" },
  "2025-12-08": { am: "longmen", pm: "longmen" },
  "2025-12-09": { am: "longmen", pm: "longmen" },
  "2025-12-10": { am: "longmen", pm: "longmen" },
  "2025-12-11": { am: "longmen", pm: "longmen" },
  "2025-12-12": { am: "longmen", pm: "longmen" },
  "2025-12-13": { am: "yongyun", pm: "yongyun" },
  "2025-12-14": { am: "yongyun", pm: "closed" },
  "2025-12-15": { am: "longmen", pm: "longmen" },
  "2025-12-16": { am: "longmen", pm: "longmen" },
  "2025-12-17": { am: "longmen", pm: "longmen" },
  "2025-12-18": { am: "longmen", pm: "longmen" },
  "2025-12-19": { am: "longmen", pm: "longmen" },
  "2025-12-20": { am: "yongyun", pm: "yongyun" },
  "2025-12-21": { am: "yongyun", pm: "closed" },
  "2025-12-22": { am: "longmen", pm: "longmen" },
  "2025-12-23": { am: "longmen", pm: "longmen" },
  "2025-12-24": { am: "longmen", pm: "longmen" },
  "2025-12-25": { am: "yongyun", pm: "yongyun" },
  "2025-12-26": { am: "longmen", pm: "longmen" },
  "2025-12-27": { am: "yongyun", pm: "yongyun" },
  "2025-12-28": { am: "yongyun", pm: "closed" },
  "2025-12-29": { am: "longmen", pm: "longmen" },
  "2025-12-30": { am: "longmen", pm: "longmen" },
  "2025-12-31": { am: "longmen", pm: "longmen" },
  "2026-01-01": { am: "yongyun", pm: "yongyun" },
  "2026-01-02": { am: "longmen", pm: "closed" },
  "2026-01-03": { am: "closed", pm: "closed", note: "市中運" },
  "2026-01-04": { am: "closed", pm: "closed", note: "市中運" },
  "2026-01-05": { am: "closed", pm: "closed", note: "市中運" },
  "2026-01-06": { am: "closed", pm: "closed" },
  "2026-01-07": { am: "longmen", pm: "longmen" },
  "2026-01-08": { am: "longmen", pm: "longmen" },
  "2026-01-09": { am: "longmen", pm: "longmen" },
  "2026-01-10": { am: "yongyun", pm: "yongyun" },
  "2026-01-11": { am: "closed", pm: "closed" },
  "2026-01-12": { am: "longmen", pm: "longmen" },
  "2026-01-13": { am: "longmen", pm: "longmen" },
  "2026-01-14": { am: "longmen", pm: "longmen" },
  "2026-01-15": { am: "longmen", pm: "closed" },
  "2026-01-16": { am: "closed", pm: "closed", note: "月考III" },
  "2026-01-17": { am: "closed", pm: "closed" },
  "2026-01-18": { am: "closed", pm: "closed" },
  "2026-01-19": { am: "closed", pm: "longmen", note: "月考III" },
  "2026-01-20": { am: "longmen", pm: "longmen" },
  "2026-01-21": { am: "longmen", pm: "longmen" },
  "2026-01-22": { am: "longmen", pm: "longmen" },
  "2026-01-23": { am: "longmen", pm: "longmen" },
  "2026-01-24": { am: "yongyun", pm: "yongyun" },
  "2026-01-25": { am: "closed", pm: "closed" },
  "2026-01-26": { am: "closed", pm: "closed", note: "北區B" },
  "2026-01-27": { am: "closed", pm: "closed", note: "北區B" },
  "2026-01-28": { am: "closed", pm: "closed", note: "北區B" },
  "2026-01-29": { am: "longmen", pm: "yongyun" },
  "2026-01-30": { am: "longmen", pm: "yongyun" },
  "2026-01-31": { am: "yongyun", pm: "yongyun" },
  "2026-02-01": { am: "closed", pm: "closed" },
  "2026-02-02": { am: "longmen", pm: "yongyun" },
  "2026-02-03": { am: "longmen", pm: "yongyun" },
  "2026-02-04": { am: "longmen", pm: "yongyun" },
  "2026-02-05": { am: "yongyun", pm: "yongyun" },
  "2026-02-06": { am: "yongyun", pm: "yongyun" },
  "2026-02-07": { am: "yongyun", pm: "yongyun" },
  "2026-02-08": { am: "closed", pm: "closed" },
  "2026-02-09": { am: "yongyun", pm: "yongyun" },
  "2026-02-10": { am: "yongyun", pm: "yongyun" },
  "2026-02-11": { am: "yongyun", pm: "yongyun" },
  "2026-02-12": { am: "yongyun", pm: "yongyun" },
  "2026-02-13": { am: "yongyun", pm: "yongyun" },
  "2026-02-14": { am: "yongyun", pm: "yongyun" },
  "2026-02-15": { am: "closed", pm: "closed" },
  "2026-02-16": { am: "closed", pm: "closed", note: "除夕" },
  "2026-02-17": { am: "closed", pm: "closed", note: "初一" },
  "2026-02-18": { am: "closed", pm: "closed", note: "初二" },
  "2026-02-19": { am: "closed", pm: "closed", note: "初三" },
  "2026-02-20": { am: "yongyun", pm: "closed" },
  "2026-02-21": { am: "yongyun", pm: "closed" },
  "2026-02-22": { am: "closed", pm: "closed" },
  "2026-02-23": { am: "longmen", pm: "longmen" },
  "2026-02-24": { am: "longmen", pm: "longmen" },
  "2026-02-25": { am: "longmen", pm: "longmen" },
  "2026-02-26": { am: "longmen", pm: "longmen" },
  "2026-02-27": { am: "yongyun", pm: "yongyun" },
  "2026-02-28": { am: "yongyun", pm: "yongyun" },
  "2026-03-01": { am: "closed", pm: "closed" },
  "2026-03-02": { am: "longmen", pm: "longmen" },
  "2026-03-03": { am: "longmen", pm: "longmen" },
  "2026-03-04": { am: "longmen", pm: "longmen" },
  "2026-03-05": { am: "longmen", pm: "longmen" },
  "2026-03-06": { am: "longmen", pm: "longmen" },
  "2026-03-07": { am: "yongyun", pm: "yongyun" },
  "2026-03-08": { am: "closed", pm: "closed" },
  "2026-03-09": { am: "longmen", pm: "closed" },
  "2026-03-10": { am: "longmen", pm: "longmen" },
  "2026-03-11": { am: "longmen", pm: "longmen" },
  "2026-03-12": { am: "closed", pm: "longmen" },
  "2026-03-13": { am: "closed", pm: "longmen" },
  "2026-03-14": { am: "yongyun", pm: "yongyun" },
  "2026-03-15": { am: "closed", pm: "closed" },
  "2026-03-16": { am: "longmen", pm: "longmen" },
  "2026-03-17": { am: "longmen", pm: "longmen" },
  "2026-03-18": { am: "longmen", pm: "longmen" },
  "2026-03-19": { am: "longmen", pm: "longmen" },
  "2026-03-20": { am: "longmen", pm: "closed" },
  "2026-03-21": { am: "yongyun", pm: "closed" },
  "2026-03-22": { am: "yongyun", pm: "closed" },
  "2026-03-23": { am: "longmen", pm: "longmen" },
  "2026-03-24": { am: "longmen", pm: "longmen" },
  "2026-03-25": { am: "longmen", pm: "longmen" },
  "2026-03-26": { am: "longmen", pm: "longmen" },
  "2026-03-27": { am: "longmen", pm: "longmen" },
  "2026-03-28": { am: "closed", pm: "closed" },
  "2026-03-29": { am: "closed", pm: "closed", note: "青年盃" },
  "2026-03-30": { am: "longmen", pm: "closed" },
  "2026-03-31": { am: "closed", pm: "closed", note: "月考I" },
  "2026-04-01": { am: "closed", pm: "longmen", note: "月考I" },
  "2026-04-02": { am: "longmen", pm: "longmen" },
  "2026-04-03": { am: "yongyun", pm: "yongyun" },
  "2026-04-04": { am: "yongyun", pm: "yongyun", note: "兒童節" },
  "2026-04-05": { am: "yongyun", pm: "closed", note: "清明節" },
  "2026-04-06": { am: "yongyun", pm: "yongyun" },
  "2026-04-07": { am: "longmen", pm: "longmen" },
  "2026-04-08": { am: "longmen", pm: "longmen" },
  "2026-04-09": { am: "longmen", pm: "longmen" },
  "2026-04-10": { am: "longmen", pm: "longmen" },
  "2026-04-11": { am: "yongyun", pm: "yongyun" },
  "2026-04-12": { am: "yongyun", pm: "closed" },
  "2026-04-13": { am: "longmen", pm: "longmen" },
  "2026-04-14": { am: "longmen", pm: "longmen" },
  "2026-04-15": { am: "longmen", pm: "longmen" },
  "2026-04-16": { am: "longmen", pm: "longmen" },
  "2026-04-17": { am: "closed", pm: "closed" },
  "2026-04-18": { am: "closed", pm: "closed", note: "全中運" },
  "2026-04-19": { am: "closed", pm: "closed", note: "全中運" },
  "2026-04-20": { am: "closed", pm: "closed", note: "全中運" },
  "2026-04-21": { am: "closed", pm: "closed", note: "全中運" },
  "2026-04-22": { am: "closed", pm: "closed", note: "全中運" },
  "2026-04-23": { am: "closed", pm: "longmen" },
  "2026-04-24": { am: "longmen", pm: "closed" },
  "2026-04-25": { am: "yongyun", pm: "yongyun" },
  "2026-04-26": { am: "closed", pm: "closed" },
  "2026-04-27": { am: "longmen", pm: "longmen" },
  "2026-04-28": { am: "longmen", pm: "longmen" },
  "2026-04-29": { am: "longmen", pm: "longmen" },
  "2026-04-30": { am: "longmen", pm: "longmen" },
  "2026-05-01": { am: "yongyun", pm: "yongyun", note: "勞動節" },
  "2026-05-02": { am: "yongyun", pm: "yongyun" },
  "2026-05-03": { am: "closed", pm: "closed" },
  "2026-05-04": { am: "longmen", pm: "longmen" },
  "2026-05-05": { am: "longmen", pm: "longmen" },
  "2026-05-06": { am: "longmen", pm: "longmen" },
  "2026-05-07": { am: "longmen", pm: "longmen" },
  "2026-05-08": { am: "longmen", pm: "longmen" },
  "2026-05-09": { am: "yongyun", pm: "yongyun" },
  "2026-05-10": { am: "closed", pm: "closed" },
  "2026-05-11": { am: "longmen", pm: "longmen" },
  "2026-05-12": { am: "longmen", pm: "closed" },
  "2026-05-13": { am: "closed", pm: "closed", note: "月考II" },
  "2026-05-14": { am: "closed", pm: "longmen", note: "月考II" },
  "2026-05-15": { am: "longmen", pm: "longmen" },
  "2026-05-16": { am: "yongyun", pm: "yongyun" },
  "2026-05-17": { am: "closed", pm: "closed" },
  "2026-05-18": { am: "longmen", pm: "longmen" },
  "2026-05-19": { am: "longmen", pm: "longmen" },
  "2026-05-20": { am: "longmen", pm: "longmen" },
  "2026-05-21": { am: "longmen", pm: "longmen" },
  "2026-05-22": { am: "longmen", pm: "longmen" },
  "2026-05-23": { am: "yongyun", pm: "yongyun" },
  "2026-05-24": { am: "closed", pm: "closed" },
  "2026-05-25": { am: "longmen", pm: "longmen" },
  "2026-05-26": { am: "longmen", pm: "longmen" },
  "2026-05-27": { am: "longmen", pm: "longmen" },
  "2026-05-28": { am: "longmen", pm: "longmen" },
  "2026-05-29": { am: "longmen", pm: "longmen" },
  "2026-05-30": { am: "yongyun", pm: "yongyun" },
  "2026-05-31": { am: "closed", pm: "closed" },
  "2026-06-01": { am: "longmen", pm: "longmen" },
  "2026-06-02": { am: "longmen", pm: "longmen" },
  "2026-06-03": { am: "longmen", pm: "longmen" },
  "2026-06-04": { am: "longmen", pm: "longmen" },
  "2026-06-05": { am: "longmen", pm: "longmen" },
  "2026-06-06": { am: "yongyun", pm: "yongyun" },
  "2026-06-07": { am: "closed", pm: "closed" },
  "2026-06-08": { am: "longmen", pm: "longmen" },
  "2026-06-09": { am: "longmen", pm: "longmen" },
  "2026-06-10": { am: "longmen", pm: "longmen" },
  "2026-06-11": { am: "longmen", pm: "longmen" },
  "2026-06-12": { am: "longmen", pm: "longmen" },
  "2026-06-13": { am: "yongyun", pm: "yongyun" },
  "2026-06-14": { am: "closed", pm: "closed" },
  "2026-06-15": { am: "longmen", pm: "longmen" },
  "2026-06-16": { am: "longmen", pm: "longmen" },
  "2026-06-17": { am: "longmen", pm: "longmen" },
  "2026-06-18": { am: "longmen", pm: "longmen" },
  "2026-06-19": { am: "yongyun", pm: "yongyun", note: "端午節" },
  "2026-06-20": { am: "yongyun", pm: "yongyun" },
  "2026-06-21": { am: "closed", pm: "closed" },
  "2026-06-22": { am: "longmen", pm: "longmen" },
  "2026-06-23": { am: "longmen", pm: "longmen" },
  "2026-06-24": { am: "longmen", pm: "longmen" },
  "2026-06-25": { am: "longmen", pm: "closed" },
  "2026-06-26": { am: "closed", pm: "closed", note: "月考III" },
  "2026-06-27": { am: "yongyun", pm: "yongyun" },
  "2026-06-28": { am: "closed", pm: "closed" },
  "2026-06-29": { am: "closed", pm: "longmen", note: "月考III" },
  "2026-06-30": { am: "longmen", pm: "longmen" },
  "2026-07-01": { am: "yongyun", pm: "yongyun" },
  "2026-07-02": { am: "yongyun", pm: "yongyun" },
  "2026-07-03": { am: "yongyun", pm: "yongyun" },
  "2026-07-04": { am: "yongyun", pm: "yongyun" },
  "2026-07-05": { am: "closed", pm: "closed" },
  "2026-07-06": { am: "yongyun", pm: "yongyun" },
  "2026-07-07": { am: "yongyun", pm: "yongyun" },
  "2026-07-08": { am: "yongyun", pm: "yongyun" },
  "2026-07-09": { am: "yongyun", pm: "yongyun" },
  "2026-07-10": { am: "yongyun", pm: "yongyun" },
  "2026-07-11": { am: "yongyun", pm: "yongyun" },
  "2026-07-12": { am: "closed", pm: "closed" },
  "2026-07-13": { am: "longmen", pm: "yongyun" },
  "2026-07-14": { am: "longmen", pm: "yongyun" },
  "2026-07-15": { am: "longmen", pm: "yongyun" },
  "2026-07-16": { am: "longmen", pm: "yongyun" },
  "2026-07-17": { am: "longmen", pm: "yongyun" },
  "2026-07-18": { am: "yongyun", pm: "yongyun" },
  "2026-07-19": { am: "closed", pm: "closed" },
  "2026-07-20": { am: "longmen", pm: "yongyun" },
  "2026-07-21": { am: "longmen", pm: "yongyun" },
  "2026-07-22": { am: "longmen", pm: "yongyun" },
  "2026-07-23": { am: "longmen", pm: "yongyun" },
  "2026-07-24": { am: "longmen", pm: "yongyun" },
  "2026-07-25": { am: "yongyun", pm: "yongyun" },
  "2026-07-26": { am: "closed", pm: "closed" },
  "2026-07-27": { am: "longmen", pm: "yongyun" },
  "2026-07-28": { am: "longmen", pm: "yongyun" },
  "2026-07-29": { am: "longmen", pm: "yongyun" },
  "2026-07-30": { am: "longmen", pm: "yongyun" },
  "2026-07-31": { am: "longmen", pm: "yongyun" },
  "2026-08-01": { am: "yongyun", pm: "yongyun" },
  "2026-08-02": { am: "closed", pm: "closed" },
  "2026-08-03": { am: "longmen", pm: "yongyun" },
  "2026-08-04": { am: "longmen", pm: "yongyun" },
  "2026-08-05": { am: "longmen", pm: "yongyun" },
  "2026-08-06": { am: "longmen", pm: "yongyun" },
  "2026-08-07": { am: "longmen", pm: "yongyun" },
  "2026-08-08": { am: "yongyun", pm: "yongyun" },
  "2026-08-09": { am: "closed", pm: "closed" },
  "2026-08-10": { am: "yongyun", pm: "yongyun" },
  "2026-08-11": { am: "yongyun", pm: "yongyun" },
  "2026-08-12": { am: "yongyun", pm: "yongyun" },
  "2026-08-13": { am: "yongyun", pm: "yongyun" },
  "2026-08-14": { am: "yongyun", pm: "yongyun" },
  "2026-08-15": { am: "yongyun", pm: "yongyun" },
  "2026-08-16": { am: "closed", pm: "closed" },
  "2026-08-17": { am: "yongyun", pm: "yongyun" },
  "2026-08-18": { am: "yongyun", pm: "yongyun" },
  "2026-08-19": { am: "yongyun", pm: "yongyun" },
  "2026-08-20": { am: "yongyun", pm: "yongyun" },
  "2026-08-21": { am: "yongyun", pm: "yongyun" },
  "2026-08-22": { am: "yongyun", pm: "yongyun" },
  "2026-08-23": { am: "closed", pm: "closed" },
  "2026-08-24": { am: "yongyun", pm: "yongyun" },
  "2026-08-25": { am: "yongyun", pm: "yongyun" },
  "2026-08-26": { am: "yongyun", pm: "yongyun" },
  "2026-08-27": { am: "yongyun", pm: "yongyun" },
  "2026-08-28": { am: "yongyun", pm: "yongyun" },
  "2026-08-29": { am: "yongyun", pm: "yongyun" },
  "2026-08-30": { am: "closed", pm: "closed" },
  "2026-08-31": { am: "yongyun", pm: "yongyun" },
  // ===== 2026 上學期 (2026/09 ~ 2027/02) =====
  "2026-09-01": { am: "longmen", pm: "longmen" },
  "2026-09-02": { am: "longmen", pm: "longmen" },
  "2026-09-03": { am: "longmen", pm: "longmen" },
  "2026-09-04": { am: "longmen", pm: "longmen" },
  "2026-09-05": { am: "longmen", pm: "closed" },
  "2026-09-06": { am: "closed", pm: "closed" },
  "2026-09-07": { am: "longmen", pm: "longmen" },
  "2026-09-08": { am: "longmen", pm: "longmen" },
  "2026-09-09": { am: "longmen", pm: "longmen" },
  "2026-09-10": { am: "longmen", pm: "longmen" },
  "2026-09-11": { am: "longmen", pm: "longmen" },
  "2026-09-12": { am: "longmen", pm: "closed" },
  "2026-09-13": { am: "closed", pm: "closed" },
  "2026-09-14": { am: "longmen", pm: "longmen" },
  "2026-09-15": { am: "longmen", pm: "longmen" },
  "2026-09-16": { am: "longmen", pm: "longmen" },
  "2026-09-17": { am: "longmen", pm: "longmen" },
  "2026-09-18": { am: "longmen", pm: "longmen" },
  "2026-09-19": { am: "longmen", pm: "closed" },
  "2026-09-20": { am: "closed", pm: "closed" },
  "2026-09-21": { am: "longmen", pm: "longmen" },
  "2026-09-22": { am: "longmen", pm: "longmen" },
  "2026-09-23": { am: "longmen", pm: "longmen" },
  "2026-09-24": { am: "longmen", pm: "longmen" },
  "2026-09-25": { am: "longmen", pm: "longmen" },
  "2026-09-26": { am: "longmen", pm: "closed" },
  "2026-09-27": { am: "closed", pm: "closed" },
  "2026-09-28": { am: "longmen", pm: "longmen" },
  "2026-09-29": { am: "longmen", pm: "longmen" },
  "2026-09-30": { am: "longmen", pm: "longmen" },
  "2026-10-01": { am: "longmen", pm: "longmen" },
  "2026-10-02": { am: "longmen", pm: "longmen" },
  "2026-10-03": { am: "longmen", pm: "closed" },
  "2026-10-04": { am: "closed", pm: "closed" },
  "2026-10-05": { am: "longmen", pm: "longmen" },
  "2026-10-06": { am: "longmen", pm: "longmen" },
  "2026-10-07": { am: "longmen", pm: "longmen" },
  "2026-10-08": { am: "longmen", pm: "longmen" },
  "2026-10-09": { am: "longmen", pm: "longmen" },
  "2026-10-10": { am: "longmen", pm: "closed" },
  "2026-10-11": { am: "closed", pm: "closed" },
  "2026-10-12": { am: "longmen", pm: "longmen" },
  "2026-10-13": { am: "longmen", pm: "longmen" },
  "2026-10-14": { am: "longmen", pm: "longmen" },
  "2026-10-15": { am: "longmen", pm: "longmen" },
  "2026-10-16": { am: "longmen", pm: "longmen" },
  "2026-10-17": { am: "longmen", pm: "closed" },
  "2026-10-18": { am: "closed", pm: "closed" },
  "2026-10-19": { am: "longmen", pm: "longmen" },
  "2026-10-20": { am: "longmen", pm: "longmen" },
  "2026-10-21": { am: "longmen", pm: "longmen" },
  "2026-10-22": { am: "longmen", pm: "longmen" },
  "2026-10-23": { am: "longmen", pm: "longmen" },
  "2026-10-24": { am: "longmen", pm: "closed" },
  "2026-10-25": { am: "closed", pm: "closed" },
  "2026-10-26": { am: "longmen", pm: "longmen" },
  "2026-10-27": { am: "longmen", pm: "longmen" },
  "2026-10-28": { am: "longmen", pm: "longmen" },
  "2026-10-29": { am: "longmen", pm: "longmen" },
  "2026-10-30": { am: "longmen", pm: "longmen" },
  "2026-10-31": { am: "longmen", pm: "closed" },
  "2026-11-01": { am: "closed", pm: "closed" },
  "2026-11-02": { am: "longmen", pm: "longmen" },
  "2026-11-03": { am: "longmen", pm: "longmen" },
  "2026-11-04": { am: "longmen", pm: "longmen" },
  "2026-11-05": { am: "longmen", pm: "longmen" },
  "2026-11-06": { am: "longmen", pm: "longmen" },
  "2026-11-07": { am: "longmen", pm: "closed" },
  "2026-11-08": { am: "closed", pm: "closed" },
  "2026-11-09": { am: "longmen", pm: "longmen" },
  "2026-11-10": { am: "longmen", pm: "longmen" },
  "2026-11-11": { am: "longmen", pm: "longmen" },
  "2026-11-12": { am: "longmen", pm: "longmen" },
  "2026-11-13": { am: "longmen", pm: "longmen" },
  "2026-11-14": { am: "longmen", pm: "closed" },
  "2026-11-15": { am: "closed", pm: "closed" },
  "2026-11-16": { am: "longmen", pm: "longmen" },
  "2026-11-17": { am: "longmen", pm: "longmen" },
  "2026-11-18": { am: "longmen", pm: "longmen" },
  "2026-11-19": { am: "longmen", pm: "longmen" },
  "2026-11-20": { am: "longmen", pm: "longmen" },
  "2026-11-21": { am: "longmen", pm: "closed" },
  "2026-11-22": { am: "closed", pm: "closed" },
  "2026-11-23": { am: "longmen", pm: "longmen" },
  "2026-11-24": { am: "longmen", pm: "longmen" },
  "2026-11-25": { am: "longmen", pm: "longmen" },
  "2026-11-26": { am: "longmen", pm: "longmen" },
  "2026-11-27": { am: "longmen", pm: "longmen" },
  "2026-11-28": { am: "longmen", pm: "closed" },
  "2026-11-29": { am: "closed", pm: "closed" },
  "2026-11-30": { am: "longmen", pm: "longmen" },
  "2026-12-01": { am: "longmen", pm: "longmen" },
  "2026-12-02": { am: "longmen", pm: "longmen" },
  "2026-12-03": { am: "longmen", pm: "longmen" },
  "2026-12-04": { am: "longmen", pm: "longmen" },
  "2026-12-05": { am: "longmen", pm: "closed" },
  "2026-12-06": { am: "closed", pm: "closed" },
  "2026-12-07": { am: "longmen", pm: "longmen" },
  "2026-12-08": { am: "longmen", pm: "longmen" },
  "2026-12-09": { am: "longmen", pm: "longmen" },
  "2026-12-10": { am: "longmen", pm: "longmen" },
  "2026-12-11": { am: "longmen", pm: "longmen" },
  "2026-12-12": { am: "longmen", pm: "closed" },
  "2026-12-13": { am: "closed", pm: "closed" },
  "2026-12-14": { am: "longmen", pm: "longmen" },
  "2026-12-15": { am: "longmen", pm: "longmen" },
  "2026-12-16": { am: "longmen", pm: "longmen" },
  "2026-12-17": { am: "longmen", pm: "longmen" },
  "2026-12-18": { am: "longmen", pm: "longmen" },
  "2026-12-19": { am: "longmen", pm: "closed" },
  "2026-12-20": { am: "closed", pm: "closed" },
  "2026-12-21": { am: "longmen", pm: "longmen" },
  "2026-12-22": { am: "longmen", pm: "longmen" },
  "2026-12-23": { am: "longmen", pm: "longmen" },
  "2026-12-24": { am: "longmen", pm: "longmen" },
  "2026-12-25": { am: "longmen", pm: "longmen" },
  "2026-12-26": { am: "longmen", pm: "closed" },
  "2026-12-27": { am: "closed", pm: "closed" },
  "2026-12-28": { am: "longmen", pm: "longmen" },
  "2026-12-29": { am: "longmen", pm: "longmen" },
  "2026-12-30": { am: "longmen", pm: "longmen" },
  "2026-12-31": { am: "longmen", pm: "longmen" },
  "2027-01-01": { am: "longmen", pm: "longmen" },
  "2027-01-02": { am: "longmen", pm: "closed" },
  "2027-01-03": { am: "closed", pm: "closed" },
  "2027-01-04": { am: "longmen", pm: "longmen" },
  "2027-01-05": { am: "longmen", pm: "longmen" },
  "2027-01-06": { am: "longmen", pm: "longmen" },
  "2027-01-07": { am: "longmen", pm: "longmen" },
  "2027-01-08": { am: "longmen", pm: "longmen" },
  "2027-01-09": { am: "longmen", pm: "closed" },
  "2027-01-10": { am: "closed", pm: "closed" },
  "2027-01-11": { am: "longmen", pm: "longmen" },
  "2027-01-12": { am: "longmen", pm: "longmen" },
  "2027-01-13": { am: "longmen", pm: "longmen" },
  "2027-01-14": { am: "longmen", pm: "longmen" },
  "2027-01-15": { am: "longmen", pm: "longmen" },
  "2027-01-16": { am: "longmen", pm: "closed" },
  "2027-01-17": { am: "closed", pm: "closed" },
  "2027-01-18": { am: "longmen", pm: "longmen" },
  "2027-01-19": { am: "longmen", pm: "longmen" },
  "2027-01-20": { am: "longmen", pm: "longmen" },
  "2027-01-21": { am: "longmen", pm: "longmen" },
  "2027-01-22": { am: "longmen", pm: "longmen" },
  "2027-01-23": { am: "longmen", pm: "closed" },
  "2027-01-24": { am: "closed", pm: "closed" },
  "2027-01-25": { am: "longmen", pm: "longmen" },
  "2027-01-26": { am: "longmen", pm: "longmen" },
  "2027-01-27": { am: "longmen", pm: "longmen" },
  "2027-01-28": { am: "longmen", pm: "longmen" },
  "2027-01-29": { am: "longmen", pm: "longmen" },
  "2027-01-30": { am: "longmen", pm: "closed" },
  "2027-01-31": { am: "closed", pm: "closed" },
  "2027-02-01": { am: "longmen", pm: "longmen" },
  "2027-02-02": { am: "longmen", pm: "longmen" },
  "2027-02-03": { am: "longmen", pm: "longmen" },
  "2027-02-04": { am: "longmen", pm: "longmen" },
  "2027-02-05": { am: "longmen", pm: "longmen" },
  "2027-02-06": { am: "longmen", pm: "closed" },
  "2027-02-07": { am: "closed", pm: "closed" },
  "2027-02-08": { am: "longmen", pm: "longmen" },
  "2027-02-09": { am: "longmen", pm: "longmen" },
  "2027-02-10": { am: "longmen", pm: "longmen" },
  "2027-02-11": { am: "longmen", pm: "longmen" },
  "2027-02-12": { am: "longmen", pm: "longmen" },
  "2027-02-13": { am: "longmen", pm: "closed" },
  "2027-02-14": { am: "closed", pm: "closed" },
  "2027-02-15": { am: "longmen", pm: "longmen" },
  "2027-02-16": { am: "longmen", pm: "longmen" },
  "2027-02-17": { am: "longmen", pm: "longmen" },
  "2027-02-18": { am: "longmen", pm: "longmen" },
  "2027-02-19": { am: "longmen", pm: "longmen" },
  "2027-02-20": { am: "longmen", pm: "closed" },
  "2027-02-21": { am: "closed", pm: "closed" },
  "2027-02-22": { am: "longmen", pm: "longmen" },
  "2027-02-23": { am: "longmen", pm: "longmen" },
  "2027-02-24": { am: "longmen", pm: "longmen" },
  "2027-02-25": { am: "longmen", pm: "longmen" },
  "2027-02-26": { am: "longmen", pm: "longmen" },
  "2027-02-27": { am: "longmen", pm: "closed" },
  "2027-02-28": { am: "closed", pm: "closed" },
  "2027-03-01": { am: "longmen", pm: "longmen" },
  "2027-03-02": { am: "longmen", pm: "longmen" },
  "2027-03-03": { am: "longmen", pm: "longmen" },
  "2027-03-04": { am: "longmen", pm: "longmen" },
  "2027-03-05": { am: "longmen", pm: "longmen" },
  "2027-03-06": { am: "longmen", pm: "closed" },
  "2027-03-07": { am: "closed", pm: "closed" },
  "2027-03-08": { am: "longmen", pm: "longmen" },
  "2027-03-09": { am: "longmen", pm: "longmen" },
  "2027-03-10": { am: "longmen", pm: "longmen" },
  "2027-03-11": { am: "longmen", pm: "longmen" },
  "2027-03-12": { am: "longmen", pm: "longmen" },
  "2027-03-13": { am: "longmen", pm: "closed" },
  "2027-03-14": { am: "closed", pm: "closed" },
  "2027-03-15": { am: "longmen", pm: "longmen" },
  "2027-03-16": { am: "longmen", pm: "longmen" },
  "2027-03-17": { am: "longmen", pm: "longmen" },
  "2027-03-18": { am: "longmen", pm: "longmen" },
  "2027-03-19": { am: "longmen", pm: "longmen" },
  "2027-03-20": { am: "longmen", pm: "closed" },
  "2027-03-21": { am: "closed", pm: "closed" },
  "2027-03-22": { am: "longmen", pm: "longmen" },
  "2027-03-23": { am: "longmen", pm: "longmen" },
  "2027-03-24": { am: "longmen", pm: "longmen" },
  "2027-03-25": { am: "longmen", pm: "longmen" },
  "2027-03-26": { am: "longmen", pm: "longmen" },
  "2027-03-27": { am: "longmen", pm: "closed" },
  "2027-03-28": { am: "closed", pm: "closed" },
  "2027-03-29": { am: "longmen", pm: "longmen" },
  "2027-03-30": { am: "longmen", pm: "longmen" },
  "2027-03-31": { am: "longmen", pm: "longmen" },
  "2027-04-01": { am: "longmen", pm: "longmen" },
  "2027-04-02": { am: "longmen", pm: "longmen" },
  "2027-04-03": { am: "longmen", pm: "closed" },
  "2027-04-04": { am: "closed", pm: "closed" },
  "2027-04-05": { am: "longmen", pm: "longmen" },
  "2027-04-06": { am: "longmen", pm: "longmen" },
  "2027-04-07": { am: "longmen", pm: "longmen" },
  "2027-04-08": { am: "longmen", pm: "longmen" },
  "2027-04-09": { am: "longmen", pm: "longmen" },
  "2027-04-10": { am: "longmen", pm: "closed" },
  "2027-04-11": { am: "closed", pm: "closed" },
  "2027-04-12": { am: "longmen", pm: "longmen" },
  "2027-04-13": { am: "longmen", pm: "longmen" },
  "2027-04-14": { am: "longmen", pm: "longmen" },
  "2027-04-15": { am: "longmen", pm: "longmen" },
  "2027-04-16": { am: "longmen", pm: "longmen" },
  "2027-04-17": { am: "longmen", pm: "closed" },
  "2027-04-18": { am: "closed", pm: "closed" },
  "2027-04-19": { am: "longmen", pm: "longmen" },
  "2027-04-20": { am: "longmen", pm: "longmen" },
  "2027-04-21": { am: "longmen", pm: "longmen" },
  "2027-04-22": { am: "longmen", pm: "longmen" },
  "2027-04-23": { am: "longmen", pm: "longmen" },
  "2027-04-24": { am: "longmen", pm: "closed" },
  "2027-04-25": { am: "closed", pm: "closed" },
  "2027-04-26": { am: "longmen", pm: "longmen" },
  "2027-04-27": { am: "longmen", pm: "longmen" },
  "2027-04-28": { am: "longmen", pm: "longmen" },
  "2027-04-29": { am: "longmen", pm: "longmen" },
  "2027-04-30": { am: "longmen", pm: "longmen" },
  "2027-05-01": { am: "longmen", pm: "closed" },
  "2027-05-02": { am: "closed", pm: "closed" },
  "2027-05-03": { am: "longmen", pm: "longmen" },
  "2027-05-04": { am: "longmen", pm: "longmen" },
  "2027-05-05": { am: "longmen", pm: "longmen" },
  "2027-05-06": { am: "longmen", pm: "longmen" },
  "2027-05-07": { am: "longmen", pm: "longmen" },
  "2027-05-08": { am: "longmen", pm: "closed" },
  "2027-05-09": { am: "closed", pm: "closed" },
  "2027-05-10": { am: "longmen", pm: "longmen" },
  "2027-05-11": { am: "longmen", pm: "longmen" },
  "2027-05-12": { am: "longmen", pm: "longmen" },
  "2027-05-13": { am: "longmen", pm: "longmen" },
  "2027-05-14": { am: "longmen", pm: "longmen" },
  "2027-05-15": { am: "longmen", pm: "closed" },
  "2027-05-16": { am: "closed", pm: "closed" },
  "2027-05-17": { am: "longmen", pm: "longmen" },
  "2027-05-18": { am: "longmen", pm: "longmen" },
  "2027-05-19": { am: "longmen", pm: "longmen" },
  "2027-05-20": { am: "longmen", pm: "longmen" },
  "2027-05-21": { am: "longmen", pm: "longmen" },
  "2027-05-22": { am: "longmen", pm: "closed" },
  "2027-05-23": { am: "closed", pm: "closed" },
  "2027-05-24": { am: "longmen", pm: "longmen" },
  "2027-05-25": { am: "longmen", pm: "longmen" },
  "2027-05-26": { am: "longmen", pm: "longmen" },
  "2027-05-27": { am: "longmen", pm: "longmen" },
  "2027-05-28": { am: "longmen", pm: "longmen" },
  "2027-05-29": { am: "longmen", pm: "closed" },
  "2027-05-30": { am: "closed", pm: "closed" },
  "2027-05-31": { am: "longmen", pm: "longmen" },
  "2027-06-01": { am: "longmen", pm: "longmen" },
  "2027-06-02": { am: "longmen", pm: "longmen" },
  "2027-06-03": { am: "longmen", pm: "longmen" },
  "2027-06-04": { am: "longmen", pm: "longmen" },
  "2027-06-05": { am: "longmen", pm: "closed" },
  "2027-06-06": { am: "closed", pm: "closed" },
  "2027-06-07": { am: "longmen", pm: "longmen" },
  "2027-06-08": { am: "longmen", pm: "longmen" },
  "2027-06-09": { am: "longmen", pm: "longmen" },
  "2027-06-10": { am: "longmen", pm: "longmen" },
  "2027-06-11": { am: "longmen", pm: "longmen" },
  "2027-06-12": { am: "longmen", pm: "closed" },
  "2027-06-13": { am: "closed", pm: "closed" },
  "2027-06-14": { am: "longmen", pm: "longmen" },
  "2027-06-15": { am: "longmen", pm: "longmen" },
  "2027-06-16": { am: "longmen", pm: "longmen" },
  "2027-06-17": { am: "longmen", pm: "longmen" },
  "2027-06-18": { am: "longmen", pm: "longmen" },
  "2027-06-19": { am: "longmen", pm: "closed" },
  "2027-06-20": { am: "closed", pm: "closed" },
  "2027-06-21": { am: "longmen", pm: "longmen" },
  "2027-06-22": { am: "longmen", pm: "longmen" },
  "2027-06-23": { am: "longmen", pm: "longmen" },
  "2027-06-24": { am: "longmen", pm: "longmen" },
  "2027-06-25": { am: "longmen", pm: "longmen" },
  "2027-06-26": { am: "longmen", pm: "closed" },
  "2027-06-27": { am: "closed", pm: "closed" },
  "2027-06-28": { am: "longmen", pm: "longmen" },
  "2027-06-29": { am: "longmen", pm: "longmen" },
  "2027-06-30": { am: "longmen", pm: "longmen" },
  "2027-07-01": { am: "longmen", pm: "longmen" },
  "2027-07-02": { am: "longmen", pm: "longmen" },
  "2027-07-03": { am: "longmen", pm: "closed" },
  "2027-07-04": { am: "closed", pm: "closed" },
  "2027-07-05": { am: "longmen", pm: "longmen" },
  "2027-07-06": { am: "longmen", pm: "longmen" },
  "2027-07-07": { am: "longmen", pm: "longmen" },
  "2027-07-08": { am: "longmen", pm: "longmen" },
  "2027-07-09": { am: "longmen", pm: "longmen" },
  "2027-07-10": { am: "longmen", pm: "closed" },
  "2027-07-11": { am: "closed", pm: "closed" },
  "2027-07-12": { am: "longmen", pm: "longmen" },
  "2027-07-13": { am: "longmen", pm: "longmen" },
  "2027-07-14": { am: "longmen", pm: "longmen" },
  "2027-07-15": { am: "longmen", pm: "longmen" },
  "2027-07-16": { am: "longmen", pm: "longmen" },
  "2027-07-17": { am: "longmen", pm: "closed" },
  "2027-07-18": { am: "closed", pm: "closed" },
  "2027-07-19": { am: "longmen", pm: "longmen" },
  "2027-07-20": { am: "longmen", pm: "longmen" },
  "2027-07-21": { am: "longmen", pm: "longmen" },
  "2027-07-22": { am: "longmen", pm: "longmen" },
  "2027-07-23": { am: "longmen", pm: "longmen" },
  "2027-07-24": { am: "longmen", pm: "closed" },
  "2027-07-25": { am: "closed", pm: "closed" },
  "2027-07-26": { am: "longmen", pm: "longmen" },
  "2027-07-27": { am: "longmen", pm: "longmen" },
  "2027-07-28": { am: "longmen", pm: "longmen" },
  "2027-07-29": { am: "longmen", pm: "longmen" },
  "2027-07-30": { am: "longmen", pm: "longmen" },
  "2027-07-31": { am: "longmen", pm: "closed" },
  "2027-08-01": { am: "closed", pm: "closed" },
  "2027-08-02": { am: "longmen", pm: "longmen" },
  "2027-08-03": { am: "longmen", pm: "longmen" },
  "2027-08-04": { am: "longmen", pm: "longmen" },
  "2027-08-05": { am: "longmen", pm: "longmen" },
  "2027-08-06": { am: "longmen", pm: "longmen" },
  "2027-08-07": { am: "longmen", pm: "closed" },
  "2027-08-08": { am: "closed", pm: "closed" },
  "2027-08-09": { am: "longmen", pm: "longmen" },
  "2027-08-10": { am: "longmen", pm: "longmen" },
  "2027-08-11": { am: "longmen", pm: "longmen" },
  "2027-08-12": { am: "longmen", pm: "longmen" },
  "2027-08-13": { am: "longmen", pm: "longmen" },
  "2027-08-14": { am: "longmen", pm: "closed" },
  "2027-08-15": { am: "closed", pm: "closed" },
  "2027-08-16": { am: "longmen", pm: "longmen" },
  "2027-08-17": { am: "longmen", pm: "longmen" },
  "2027-08-18": { am: "longmen", pm: "longmen" },
  "2027-08-19": { am: "longmen", pm: "longmen" },
  "2027-08-20": { am: "longmen", pm: "longmen" },
  "2027-08-21": { am: "longmen", pm: "closed" },
  "2027-08-22": { am: "closed", pm: "closed" },
  "2027-08-23": { am: "longmen", pm: "longmen" },
  "2027-08-24": { am: "longmen", pm: "longmen" },
  "2027-08-25": { am: "longmen", pm: "longmen" },
  "2027-08-26": { am: "longmen", pm: "longmen" },
  "2027-08-27": { am: "longmen", pm: "longmen" },
  "2027-08-28": { am: "longmen", pm: "closed" },
  "2027-08-29": { am: "closed", pm: "closed" },
  "2027-08-30": { am: "longmen", pm: "longmen" },
  "2027-08-31": { am: "longmen", pm: "longmen" },
};

// 取得行事曆預設場地（如果該日有 Excel 行事曆設定 → 用之；否則回 fallback）
const getCalendarVenue = (dateStr, period) => {
  const entry = VENUE_CALENDAR[dateStr];
  if (entry && entry[period]) return entry[period];
  // fallback：週六預設永運，平日預設龍門
  const d = fromDateStr(dateStr);
  return d.getDay() === 6 ? "yongyun" : "longmen";
};
// 取得某天該日的整日備註（如果行事曆有設定）
const getCalendarNote = (dateStr) => {
  const entry = VENUE_CALENDAR[dateStr];
  return entry?.note || null;
};
// 預設場地（保留舊 API 但改為呼叫 calendar）
const getDefaultVenue = (dateStr) => getCalendarVenue(dateStr, "am");
// 取得某天某時段的場地（優先順序：手動設定 > 行事曆預設 > fallback）
const getVenue = (attendance, dateStr, period) => {
  const venueObj = attendance?.[dateStr]?.venue;
  if (venueObj && venueObj[period]) return venueObj[period];
  return getCalendarVenue(dateStr, period);
};

// 取得某天某人的 sch 值（優先：當天快照 > 月鎖定快照 > 當前 roster.sch）
// 這個函式讓「修改 roster.sch」不會影響已鎖定月份的歷史統計
const getSch = (attendance, dateStr, person, idx) => {
  const day = attendance?.[dateStr];
  // 1. 當天有 sch 快照（鎖定時寫入）
  if (day?.schSnapshot && day.schSnapshot[person.seq]) {
    return day.schSnapshot[person.seq][idx] === 1;
  }
  // 2. 月份有快照（按月鎖定的格式）
  const month = dateStr.slice(0, 7);
  const monthSnap = attendance?.[`__lock_${month}`];
  if (monthSnap?.schSnapshot && monthSnap.schSnapshot[person.seq]) {
    return monthSnap.schSnapshot[person.seq][idx] === 1;
  }
  // 3. fallback：當前 roster
  return person.sch?.[idx] === 1;
};
// 月份是否已鎖定
const isMonthLocked = (attendance, monthStr) => {
  return !!attendance?.[`__lock_${monthStr}`];
};

const getDateInfo = (dateStr) => {
  const date = fromDateStr(dateStr);
  const dow = date.getDay();
  // 週一 ~ 週六 = dow 1-6 → dayIdx 0-5
  // 週日 = dow 0 → 借用週六的時段索引（amIdx=10, pmIdx=11）
  // 週日預設「不訓練」(off=true)，但若行事曆/手動設定有指定場地，仍可訓練
  const isSun = dow === 0;
  const dayIdx = isSun ? 5 : dow - 1;
  // 判斷週日是否「實質訓練」：行事曆有非 closed 的場地 OR 月曆編輯後設置場地
  // 為了避免循環依賴（getVenue 需要 attendance），這裡只看 VENUE_CALENDAR
  let off = isSun;
  if (isSun) {
    const calEntry = VENUE_CALENDAR[dateStr];
    if (calEntry && (calEntry.am !== "closed" || calEntry.pm !== "closed")) {
      off = false; // 週日有訓練（永運加練等）
    }
  }
  return {
    off, dow,
    dayLabel: isSun ? "週日" : DAYS[dayIdx],
    amIdx: dayIdx * 2,
    pmIdx: dayIdx * 2 + 1,
    isSat: dow === 6,
    isSun,
  };
};

// Build month/training days dynamically based on Y/M
const buildMonthDays = (Y, M) => {
  const arr = [];
  const last = new Date(Y, M + 1, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const ds = `${Y}-${pad(M + 1)}-${pad(d)}`;
    arr.push({ d, dateStr: ds, info: getDateInfo(ds) });
  }
  return arr;
};

// Display labels
const MONTH_NAMES_EN = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const MONTH_NAMES_CN = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

// Get year/month from date string
const monthFromDate = (dateStr) => {
  const [Y, m] = dateStr.split("-").map(Number);
  return { Y, M: m - 1 };
};

// 歷史名單合併：看某年某月的統計時,把「該月還在隊上、之後才畢業/刪除」的人納入
// 判斷：deletedAt 在該月最後一天之後 = 該月整月在隊 → 納入
// （M 為 0-indexed）
const withGraduated = (roster, deletedPersons, Y, M) => {
  if (!deletedPersons || deletedPersons.length === 0) return roster;
  const monthEnd = new Date(Y, M + 1, 0, 23, 59, 59, 999).getTime();  // 該月最後一刻
  const currentSeqs = new Set(roster.map(p => p.seq));
  const stillActive = deletedPersons.filter(p =>
    (p.deletedAt || 0) > monthEnd && !currentSeqs.has(p.seq)
  );
  if (stillActive.length === 0) return roster;
  return [...roster, ...stillActive].sort((a, b) => a.seq - b.seq);
};

// Find first/last training day in a month
const firstTrainingDay = (Y, M) => {
  const days = buildMonthDays(Y, M).filter(x => !x.info.off);
  return days[0]?.dateStr;
};
const lastTrainingDay = (Y, M) => {
  const days = buildMonthDays(Y, M).filter(x => !x.info.off);
  return days[days.length - 1]?.dateStr;
};

// Find next/prev month
const shiftMonth = (Y, M, delta) => {
  const d = new Date(Y, M + delta, 1);
  return { Y: d.getFullYear(), M: d.getMonth() };
};

// ============ STYLES ============
const CSS = `
  .att-root {
    --bg: #F2EDE2; --bg-2: #EAE3D4; --panel: #FFFCF6; --panel-2: #F8F3E8;
    --ink: #141210; --ink-2: #2E2820; --mute: #8B8275;
    --line: #DDD3BF; --line-strong: #B7AC93;
    --green: #1F5C3A; --green-2: #2D8C5A; --green-bg: #E4EEDF;
    --red: #B23A28; --red-2: #D9543C; --red-bg: #F4DDD4;
    --amber: #B8860B; --amber-bg: #F6EAC4;
    --blue: #2F4FA8; --blue-bg: #DEE5F2;
    --accent: #2DBFA8; --accent-2: #1A3D4D; --accent-bg: #DCF1ED;
    background-color: var(--bg);
    color: var(--ink);
    font-family: 'Noto Sans TC', system-ui, -apple-system, sans-serif;
    line-height: 1.5;
    min-height: 100vh;
    background-image:
      linear-gradient(to right, rgba(20,18,16,0.035) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(20,18,16,0.035) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  .display { font-family: 'Anton', 'Noto Sans TC', sans-serif; letter-spacing: 0.01em; line-height: 0.9; }
  .display-cn { font-family: 'Noto Sans TC', sans-serif; font-weight: 900; letter-spacing: 0.04em; }
  .num { font-family: 'JetBrains Mono', ui-monospace, monospace; font-feature-settings: "tnum"; }
  .tk-x { letter-spacing: 0.32em; }
  .tk-l { letter-spacing: 0.16em; }
  .pulse-dot { display:inline-block; width:8px; height:8px; border-radius:50%;
    background: var(--red-2); box-shadow: 0 0 0 0 rgba(217,84,60,0.6);
    animation: pulse 1.8s infinite; }
  @keyframes pulse { 0% { box-shadow:0 0 0 0 rgba(217,84,60,0.55);} 70% {box-shadow:0 0 0 10px rgba(217,84,60,0);} 100% {box-shadow:0 0 0 0 rgba(217,84,60,0);} }
  .row-fade-in { animation: fadeIn 0.25s ease-out; }
  .tab-fade { animation: fadeIn 0.3s ease-out; }
  @keyframes fadeIn { from { opacity:0; transform: translateY(2px);} to {opacity:1; transform: none;} }
  .btn-tactile { transition: transform 0.1s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease; }
  .btn-tactile:active { transform: scale(0.94); }
  .heat-cell { transition: transform 0.15s ease; }
  .heat-cell:hover { transform: scale(1.6); z-index: 10; position: relative; }
  .scrollx { overflow-x: auto; }
  .scrollx::-webkit-scrollbar { height: 6px; }
  .scrollx::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 3px; }
`;

// ============ MAIN APP ============
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // 處理 iOS Safari redirect 登入回傳結果
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // 登入成功，onAuthStateChanged 會接管
          console.log("Redirect 登入成功:", result.user.email);
        }
      })
      .catch((err) => {
        console.error("Redirect 登入錯誤:", err);
      });

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  if (authLoading) {
    return (
      <div className="att-root w-full min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (!user) return <LoginScreen />;
  return <AttendanceApp user={user} />;
}

function AttendanceApp({ user }) {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.innerHTML = CSS;
    document.head.appendChild(style);
    return () => {
      try { document.head.removeChild(link); } catch (e) {}
      try { document.head.removeChild(style); } catch (e) {}
    };
  }, []);

  const [tab, setTab] = useState("rollcall");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const ts = toDateStr(today);
    if (!getDateInfo(ts).off) return ts;
    // Today is Sunday, find next training day
    for (let i = 1; i <= 7; i++) {
      const next = new Date(today);
      next.setDate(today.getDate() + i);
      const ns = toDateStr(next);
      if (!getDateInfo(ns).off) return ns;
    }
    return ts;
  });

  // Derive current month from selectedDate (auto-rolls when month changes)
  const { Y, M } = monthFromDate(selectedDate);
  const MONTH_DAYS = useMemo(() => buildMonthDays(Y, M), [Y, M]);
  const TRAINING_DAYS = useMemo(() => MONTH_DAYS.filter(x => !x.info.off), [MONTH_DAYS]);
  const [period, setPeriod] = useState("am");
  const [attendance, setAttendanceLocal] = useState({});
  const [roster, setRosterLocal] = useState(DEFAULT_ROSTER);
  const [config, setConfigLocal] = useState({ admins: [] });
  const [configLoaded, setConfigLoaded] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState("connecting"); // connecting / synced / saving / error
  const [lastSaveTime, setLastSaveTime] = useState(null);
  // 比賽成績資料
  const [swimStats, setSwimStatsLocal] = useState({ events: [], meets: [], swimmers: {}, _version: null });
  const [swimStatsLoaded, setSwimStatsLoaded] = useState(false);
  // 已刪除人員（畢業生等）— 供歷史月份統計使用,僅管理員訂閱
  const [deletedPersons, setDeletedPersons] = useState([]);

  // === Firestore real-time sync: attendance ===
  useEffect(() => {
    const ref = doc(db, "teams", "longmen", "data", "attendance");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setAttendanceLocal(snap.data().value || {});
        }
        setSyncStatus("synced");
      },
      (err) => {
        console.error("Firestore listen error:", err);
        setSyncStatus("error");
      }
    );
    return unsub;
  }, []);

  // === Firestore real-time sync: roster ===
  useEffect(() => {
    const ref = doc(db, "teams", "longmen", "data", "roster");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().value)) {
          setRosterLocal(snap.data().value);
        }
      },
      (err) => console.error("Roster listen error:", err)
    );
    return unsub;
  }, []);

  // === Firestore real-time sync: config (admin list) ===
  useEffect(() => {
    const ref = doc(db, "teams", "longmen", "data", "config");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setConfigLocal(snap.data() || { admins: [] });
        } else {
          setConfigLocal({ admins: [] });
        }
        setConfigLoaded(true);
      },
      (err) => {
        console.error("Config listen error:", err);
        setConfigLoaded(true);
      }
    );
    return unsub;
  }, []);

  // === Firestore real-time sync: swim_stats (比賽成績) ===
  useEffect(() => {
    const ref = doc(db, "teams", "longmen", "data", "swim_stats");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSwimStatsLocal({
            events: data.events || [],
            meets: data.meets || [],
            swimmers: data.swimmers || {},
            _version: data._version || null,
          });
        }
        setSwimStatsLoaded(true);
      },
      (err) => {
        console.error("Swim stats listen error:", err);
        setSwimStatsLoaded(true);
      }
    );
    return unsub;
  }, []);

  // setSwimStats wrapper：寫入 Firebase
  const setSwimStats = async (updater) => {
    const next = typeof updater === "function" ? updater(swimStats) : updater;
    setSwimStatsLocal(next);
    const ref = doc(db, "teams", "longmen", "data", "swim_stats");
    await setDoc(ref, {
      ...next,
      _version: new Date().toISOString(),
      updatedBy: user.email,
    });
    // 寫入失敗會 throw 出去,讓呼叫者（如 SwimStatsImporter）能 catch 並顯示錯誤
  };

  const userEmail = (user.email || "").toLowerCase();
  const ownerEmail = (config.owner || "").toLowerCase();
  const adminList = (config.admins || []).map(e => (e || "").toLowerCase());
  const viewerList = (config.viewers || []).map(e => (e || "").toLowerCase());
  const pendingList = (config.pending || []).map(p => (p?.email || "").toLowerCase());
  const isOwner = ownerEmail === userEmail;
  const isAdmin = isOwner || adminList.includes(userEmail);
  const isViewer = viewerList.includes(userEmail);
  const isApproved = isAdmin || isViewer;  // 管理員或已核准訪客
  const isPending = pendingList.includes(userEmail);
  const noAdminsYet = configLoaded && !ownerEmail && adminList.length === 0;

  // === Firestore sync: deleted_persons（畢業生等）— 供歷史月份統計,僅管理員可讀 ===
  useEffect(() => {
    if (!isAdmin) { setDeletedPersons([]); return; }
    const ref = doc(db, "teams", "longmen", "data", "deleted_persons");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists() && Array.isArray(snap.data().value)) {
        setDeletedPersons(snap.data().value);
      } else {
        setDeletedPersons([]);
      }
    }, () => setDeletedPersons([]));
    return unsub;
  }, [isAdmin]);

  // === 24 小時寬限期：判斷某個日期是否還可以被一般管理員修改 ===
  // 規則：訓練日當天的 23:59 之後鎖定，需主管理員才能改
  const canEditDate = (dateStr) => {
    if (isOwner) return true; // 主管理員不受限
    if (!isAdmin) return false; // 非管理員不能改舊資料（只能改今天）
    // 一般管理員：只能改今天 + 昨天（因為昨天的 23:59 = 今天午夜）
    const now = new Date();
    const target = fromDateStr(dateStr);
    target.setHours(23, 59, 59, 999); // 該日的 23:59
    return now <= target || isToday(dateStr);
  };
  const isToday = (dateStr) => {
    const today = new Date();
    return toDateStr(today) === dateStr;
  };

  // 包裝版 setAttendance：點名修改 + 時間限制 + 編輯紀錄
  // 用法不變：setAttendance(prev => ...) 或 setAttendance({...})
  // 但會自動：1) 記錄差異 2) 超時擋下
  const setAttendance = (updater, opts = {}) => {
    setAttendanceLocal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // 找出哪一天 / 哪個時段被改 → 用 opts.dateStr 提示
      const dateStr = opts.dateStr;
      if (dateStr && !canEditDate(dateStr)) {
        // 不允許 → 不寫入，跳警告（由 caller 處理）
        if (opts.onBlocked) opts.onBlocked(dateStr);
        return prev;
      }
      setSyncStatus("saving");
      const ref = doc(db, "teams", "longmen", "data", "attendance");
      setDoc(ref, {
        value: next,
        updatedBy: user.email || user.uid,
        updatedAt: Date.now(),
      })
        .then(() => {
          setSyncStatus("synced");
          setLastSaveTime(Date.now());
          // 寫紀錄
          if (opts.logPayload) {
            logAction("edit_attendance", opts.logPayload);
          }
        })
        .catch((err) => {
          console.error("Save failed:", err);
          setSyncStatus("error");
        });
      return next;
    });
  };

  const setRoster = (updater, opts = {}) => {
    setRosterLocal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setSyncStatus("saving");
      const ref = doc(db, "teams", "longmen", "data", "roster");
      setDoc(ref, {
        value: next,
        updatedBy: user.email || user.uid,
        updatedAt: Date.now(),
      })
        .then(() => {
          setSyncStatus("synced");
          setLastSaveTime(Date.now());
          if (opts.logAction) {
            logAction(opts.logAction, opts.logPayload || {});
          }
        })
        .catch((err) => {
          console.error("Roster save failed:", err);
          setSyncStatus("error");
        });
      return next;
    });
  };

  const setConfig = (updater) => {
    setConfigLocal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setSyncStatus("saving");
      const ref = doc(db, "teams", "longmen", "data", "config");
      setDoc(ref, {
        ...next,
        updatedBy: user.email || user.uid,
        updatedAt: Date.now(),
      })
        .then(() => {
          setSyncStatus("synced");
          setLastSaveTime(Date.now());
        })
        .catch((err) => {
          console.error("Config save failed:", err);
          setSyncStatus("error");
        });
      return next;
    });
  };

  // === 寫入編輯紀錄（audit log） ===
  // action: 動作類型（例如 "edit_attendance", "add_person", "delete_person"...）
  // payload: { target?, before?, after?, note? }
  const logAction = async (action, payload = {}) => {
    try {
      const colRef = collection(db, "teams", "longmen", "audit_log");
      await addDoc(colRef, {
        action,
        user: user.email || user.uid,
        userName: user.displayName || "",
        timestamp: Date.now(),
        ...payload,
      });
    } catch (err) {
      console.error("Failed to log action:", err);
      // 失敗也不影響主操作
    }
  };

  // 匯出 xlsx 三分頁：個人匯總 / 場次彙整 / 完整紀錄
  const exportAll = () => {
    const wb = XLSX.utils.book_new();
    // 匯出用名單：歷史月份自動納入該月仍在隊的已畢業成員
    const exportRoster = withGraduated(roster, deletedPersons, Y, M);

    // ========== Sheet 1: 個人匯總 ==========
    // 按序號排序（依名冊順序，方便家長/教練查找）
    const personData = [...exportRoster].sort((a, b) => a.seq - b.seq).map(p => {
      let scheduled = 0, present = 0, absent = 0, pending = 0, late = 0, bonus = 0;
      let yyAm = 0, yyPm = 0;
      let soloAm = 0, soloPm = 0;  // 個練計數
      let yyAmPaid = 0, yyPmPaid = 0;  // 實際應收場次（排除個練日）
      TRAINING_DAYS.forEach(day => {
        const dayData = attendance[day.dateStr] || {};
        const amVenue = getVenue(attendance, day.dateStr, "am");
        const pmVenue = getVenue(attendance, day.dateStr, "pm");
        // 此人當日是否個練（任一場勾就整天免費）
        const dayHasSolo = !!(dayData.am_solo?.[p.seq] || dayData.pm_solo?.[p.seq]);
        // AM
        const amSch = getSch(attendance, day.dateStr, p, day.info.amIdx);
        const amAc = dayData.am?.[p.seq];
        const amIsLate = !!dayData.am_late?.[p.seq];
        const amIsSolo = !!dayData.am_solo?.[p.seq];
        if (amSch) scheduled++;
        if (amSch && amAc === "present") {
          present++;
          if (amIsLate) late++;
          if (amVenue === "yongyun") {
            yyAm++;
            if (amIsSolo) soloAm++;
            if (!dayHasSolo) yyAmPaid++;
          }
        }
        if (amSch && amAc === "absent") absent++;
        if (amSch && !amAc) pending++;
        if (!amSch && amAc === "present") {
          bonus++;
          if (amIsLate) late++;
          if (amVenue === "yongyun") {
            yyAm++;
            if (amIsSolo) soloAm++;
            if (!dayHasSolo) yyAmPaid++;
          }
        }
        // PM
        const pmSch = getSch(attendance, day.dateStr, p, day.info.pmIdx);
        const pmAc = dayData.pm?.[p.seq];
        const pmIsLate = !!dayData.pm_late?.[p.seq];
        const pmIsSolo = !!dayData.pm_solo?.[p.seq];
        if (pmSch) scheduled++;
        if (pmSch && pmAc === "present") {
          present++;
          if (pmIsLate) late++;
          if (pmVenue === "yongyun") {
            yyPm++;
            if (pmIsSolo) soloPm++;
            if (!dayHasSolo) yyPmPaid++;
          }
        }
        if (pmSch && pmAc === "absent") absent++;
        if (pmSch && !pmAc) pending++;
        if (!pmSch && pmAc === "present") {
          bonus++;
          if (pmIsLate) late++;
          if (pmVenue === "yongyun") {
            yyPm++;
            if (pmIsSolo) soloPm++;
            if (!dayHasSolo) yyPmPaid++;
          }
        }
      });
      const rate = scheduled === 0 ? 0 : Math.round(present / scheduled * 100);
      const yyTotal = yyAm + yyPm;
      const yyPaid = yyAmPaid + yyPmPaid;
      const soloTotal = soloAm + soloPm;
      const yyFee = yyPaid * VENUE_FEE;
      return {
        "序號": p.seq,
        "班級": p.cls,
        "座號": p.num,
        "姓名": p.name,
        "年級": GRADE_NAMES[p.grade],
        "表定": scheduled,
        "實到": present,
        "缺席": absent,
        "待點名": pending,
        "補訓": bonus,
        "遲到": late,
        "出席率": `${rate}%`,
        "永運早訓": yyAm,
        "永運午訓": yyPm,
        "永運總場": yyTotal,
        "個練場次": soloTotal,
        "應收場次": yyPaid,
        "應收費用": yyFee > 0 ? yyFee : "",
      };
    });
    const totalFee = personData.reduce((acc, r) => acc + (r["應收費用"] || 0), 0);
    const totalScheduled = personData.reduce((acc, r) => acc + r["表定"], 0);
    const totalPresent = personData.reduce((acc, r) => acc + r["實到"], 0);
    personData.push({
      "序號": "",
      "班級": "",
      "座號": "",
      "姓名": "─ 全隊合計 ─",
      "年級": "",
      "表定": totalScheduled,
      "實到": totalPresent,
      "缺席": personData.reduce((a, r) => a + r["缺席"], 0),
      "待點名": personData.reduce((a, r) => a + r["待點名"], 0),
      "補訓": personData.reduce((a, r) => a + r["補訓"], 0),
      "遲到": personData.reduce((a, r) => a + r["遲到"], 0),
      "出席率": totalScheduled === 0 ? "0%" : `${Math.round(totalPresent / totalScheduled * 100)}%`,
      "永運早訓": personData.reduce((a, r) => a + r["永運早訓"], 0),
      "永運午訓": personData.reduce((a, r) => a + r["永運午訓"], 0),
      "永運總場": personData.reduce((a, r) => a + r["永運總場"], 0),
      "個練場次": personData.reduce((a, r) => a + r["個練場次"], 0),
      "應收場次": personData.reduce((a, r) => a + r["應收場次"], 0),
      "應收費用": totalFee,
    });
    const ws1 = XLSX.utils.json_to_sheet(personData);
    ws1["!cols"] = [
      { wch: 6 }, { wch: 8 }, { wch: 6 }, { wch: 10 }, { wch: 8 },
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 8 }, { wch: 6 }, { wch: 6 },
      { wch: 8 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, "個人匯總");

    // ========== Sheet 2: 場次彙整 ==========
    // 在每場次內，隊員按序號排序
    const sortedRoster = [...exportRoster].sort((a, b) => a.seq - b.seq);
    const sessionData = [];
    TRAINING_DAYS.forEach(day => {
      const dayData = attendance[day.dateStr] || {};
      ["am", "pm"].forEach(per => {
        const idx = per === "am" ? day.info.amIdx : day.info.pmIdx;
        const slot = dayData[per] || {};
        const lateSlot = dayData[per === "am" ? "am_late" : "pm_late"] || {};
        const venue = getVenue(attendance, day.dateStr, per);
        let sch = 0, on = 0, no = 0, pn = 0, bn = 0, lt = 0, yyOn = 0, yyPaid = 0, soloCnt = 0;
        sortedRoster.forEach(p => {
          const isSch = getSch(attendance, day.dateStr, p, idx);
          const ac = slot[p.seq];
          const isLate = !!lateSlot[p.seq];
          // 整天個練判斷
          const dayHasSolo = !!(dayData.am_solo?.[p.seq] || dayData.pm_solo?.[p.seq]);
          const isSoloThis = !!(per === "am" ? dayData.am_solo?.[p.seq] : dayData.pm_solo?.[p.seq]);
          if (isSch) sch++;
          if (isSch && ac === "present") {
            on++;
            if (isLate) lt++;
            if (venue === "yongyun") {
              yyOn++;
              if (isSoloThis) soloCnt++;
              if (!dayHasSolo) yyPaid++;
            }
          }
          if (isSch && ac === "absent") no++;
          if (isSch && !ac) pn++;
          if (!isSch && ac === "present") {
            bn++;
            if (isLate) lt++;
            if (venue === "yongyun") {
              yyOn++;
              if (isSoloThis) soloCnt++;
              if (!dayHasSolo) yyPaid++;
            }
          }
        });
        const fee = venue === "yongyun" ? yyPaid * VENUE_FEE : 0;
        sessionData.push({
          "日期": day.dateStr,
          "星期": day.info.dayLabel,
          "時段": per === "am" ? "早訓" : "午訓",
          "場地": VENUES[venue].label,
          "表定": sch,
          "實到": on,
          "缺席": no,
          "待點名": pn,
          "補訓": bn,
          "遲到": lt,
          "出席率": sch === 0 ? "—" : `${Math.round(on / sch * 100)}%`,
          "個練": venue === "yongyun" ? soloCnt : "",
          "永運費": fee > 0 ? fee : "",
          "整日備註": dayData.notes || "",
        });
      });
    });
    const sessionTotalFee = sessionData.reduce((a, r) => a + (r["永運費"] || 0), 0);
    sessionData.push({
      "日期": "",
      "星期": "",
      "時段": "",
      "場地": "─ 合計 ─",
      "表定": sessionData.reduce((a, r) => a + r["表定"], 0),
      "實到": sessionData.reduce((a, r) => a + r["實到"], 0),
      "缺席": sessionData.reduce((a, r) => a + r["缺席"], 0),
      "待點名": sessionData.reduce((a, r) => a + r["待點名"], 0),
      "補訓": sessionData.reduce((a, r) => a + r["補訓"], 0),
      "遲到": sessionData.reduce((a, r) => a + r["遲到"], 0),
      "出席率": "",
      "個練": sessionData.reduce((a, r) => a + (typeof r["個練"] === "number" ? r["個練"] : 0), 0),
      "永運費": sessionTotalFee,
      "整日備註": "",
    });
    const ws2 = XLSX.utils.json_to_sheet(sessionData);
    ws2["!cols"] = [
      { wch: 12 }, { wch: 6 }, { wch: 6 }, { wch: 8 },
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 8 }, { wch: 6 }, { wch: 6 },
      { wch: 8 }, { wch: 6 }, { wch: 8 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "場次彙整");

    // ========== Sheet 3: 完整紀錄 ==========
    // 在每場次內，隊員按序號排序（sortedRoster 已在 Sheet 2 定義）
    const fullData = [];
    TRAINING_DAYS.forEach(day => {
      const dayData = attendance[day.dateStr] || {};
      ["am", "pm"].forEach(per => {
        const idx = per === "am" ? day.info.amIdx : day.info.pmIdx;
        const slot = dayData[per] || {};
        const lateSlot = dayData[per === "am" ? "am_late" : "pm_late"] || {};
        const noteSlot = dayData[per === "am" ? "am_notes" : "pm_notes"] || {};
        const soloSlot = dayData[per === "am" ? "am_solo" : "pm_solo"] || {};
        const venue = getVenue(attendance, day.dateStr, per);
        const isYy = venue === "yongyun";
        sortedRoster.forEach(p => {
          const sch = getSch(attendance, day.dateStr, p, idx);
          const ac = slot[p.seq];
          const isLate = !!lateSlot[p.seq];
          const isSolo = !!soloSlot[p.seq];
          // 整天個練判斷
          const dayHasSolo = !!(dayData.am_solo?.[p.seq] || dayData.pm_solo?.[p.seq]);
          const note = noteSlot[p.seq] || "";
          // 永運場次出席：個練日 → 免費；否則 $50
          const fee = isYy && ac === "present" ? (dayHasSolo ? "" : VENUE_FEE) : "";
          fullData.push({
            "日期": day.dateStr,
            "星期": day.info.dayLabel,
            "時段": per === "am" ? "早訓" : "午訓",
            "場地": VENUES[venue].label,
            "序號": p.seq,
            "班級": p.cls,
            "座號": p.num,
            "姓名": p.name,
            "年級": GRADE_NAMES[p.grade],
            "表定": sch ? "出席" : "不出席",
            "實際": ac === "present" ? "出席" : ac === "absent" ? "未到" : "未點名",
            "遲到": isLate ? "是" : "",
            "個練": isYy && isSolo ? "是" : "",
            "備註": note,
            "永運費": fee,
          });
        });
      });
      // 整日備註
      if (dayData.notes) {
        fullData.push({
          "日期": day.dateStr,
          "星期": day.info.dayLabel,
          "時段": "整日備註",
          "場地": "",
          "序號": "",
          "班級": "",
          "座號": "",
          "姓名": "",
          "年級": "",
          "表定": "",
          "實際": "",
          "遲到": "",
          "個練": "",
          "備註": dayData.notes,
          "永運費": "",
        });
      }
    });
    const ws3 = XLSX.utils.json_to_sheet(fullData);
    ws3["!cols"] = [
      { wch: 12 }, { wch: 6 }, { wch: 8 }, { wch: 6 },
      { wch: 6 }, { wch: 8 }, { wch: 6 }, { wch: 10 }, { wch: 8 },
      { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 6 }, { wch: 24 }, { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, "完整紀錄");

    // 寫檔
    XLSX.writeFile(wb, `龍門泳隊_${Y}年${M + 1}月報表.xlsx`);
  };

  // === 訪客審核機制 ===
  // 如果尚未核准 (非 owner、admin、viewer) 且 config 已載入 → 顯示等候畫面
  // 例外：noAdminsYet 時不擋（讓初始化能進行）
  if (configLoaded && !noAdminsYet && !isApproved) {
    return (
      <PendingApprovalScreen
        user={user}
        config={config}
        setConfig={setConfig}
        isPending={isPending}
        ownerEmail={ownerEmail}
      />
    );
  }

  // Screenshot mode: render clean view only
  if (screenshotMode) {
    return (
      <RosterContext.Provider value={{ roster, setRoster }}>
        <div className="att-root w-full">
          <ScreenshotView
            selectedDate={selectedDate}
            attendance={attendance}
            onExit={() => setScreenshotMode(false)}
            onPrevDay={() => {
              const idx = TRAINING_DAYS.findIndex(d => d.dateStr === selectedDate);
              if (idx === -1) return;
              const ni = (idx - 1 + TRAINING_DAYS.length) % TRAINING_DAYS.length;
              setSelectedDate(TRAINING_DAYS[ni].dateStr);
            }}
            onNextDay={() => {
              const idx = TRAINING_DAYS.findIndex(d => d.dateStr === selectedDate);
              if (idx === -1) return;
              const ni = (idx + 1) % TRAINING_DAYS.length;
              setSelectedDate(TRAINING_DAYS[ni].dateStr);
            }}
          />
        </div>
      </RosterContext.Provider>
    );
  }

  return (
    <RosterContext.Provider value={{ roster, setRoster }}>
    <div className="att-root w-full">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-8 sm:py-10">
        <header className="mb-6">
          {/* Sync status + User bar */}
          <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-lg border"
               style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
            <SyncStatusBadge status={syncStatus} lastSaveTime={lastSaveTime} />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-2)" }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <User size={14} />
                )}
                <span className="hidden sm:inline">{user.displayName || user.email}</span>
              </div>
              <button onClick={() => signOut(auth)}
                      className="btn-tactile flex items-center gap-1 px-2 py-1 rounded text-xs border"
                      style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
                <LogOut size={12} />
                登出
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Team badge */}
              <div className="shrink-0">
                <TeamBadge size={64} />
              </div>
              <div>
                <div className="text-[10px] sm:text-xs tk-x mb-2 flex items-center gap-2"
                     style={{ color: "var(--mute)" }}>
                  <span className="inline-block w-6 sm:w-8 h-px" style={{ background: "var(--accent-2)" }} />
                  LONGMEN JUNIOR HIGH · SWIM TEAM
                </div>
                <h1 className="display text-4xl sm:text-7xl" style={{ color: "var(--accent-2)" }}>
                  LONGMEN<span style={{ color: "var(--accent)" }}>·</span>SWIM
                </h1>
                <div className="display-cn text-lg sm:text-2xl mt-2" style={{ color: "var(--accent-2)" }}>
                  龍門國中泳隊
                </div>
                <div className="text-sm sm:text-base mt-1" style={{ color: "var(--ink-2)" }}>
                  訓練點名簿　·　{Y} / {MONTH_NAMES_EN[M]}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => setScreenshotMode(true)}
                      className="btn-tactile w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-sm rounded-lg border-2 font-medium"
                      style={{ borderColor: "var(--accent)", background: "var(--accent)", color: "#fff" }}>
                <Camera size={16} strokeWidth={2.5} />
                截圖模式（傳給老師）
              </button>
              {isAdmin && (
                <button onClick={exportAll}
                        className="btn-tactile w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg border-2 font-medium"
                        style={{ borderColor: "var(--accent-2)", background: "var(--accent-2)", color: "var(--bg)" }}
                        title="匯出 Excel 三分頁：個人匯總 / 場次彙整 / 完整紀錄">
                  <Download size={16} strokeWidth={2.5} />
                  匯出全月報表
                </button>
              )}
            </div>
          </div>
        </header>

        <TabBar tab={tab} setTab={setTab} isOwner={isOwner} isAdmin={isAdmin} />

        <div className="tab-fade">
          {tab === "rollcall" && (
            <RollCallView
              selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              period={period} setPeriod={setPeriod}
              attendance={attendance} setAttendance={setAttendance}
              Y={Y} M={M} MONTH_DAYS={MONTH_DAYS} TRAINING_DAYS={TRAINING_DAYS}
              isOwner={isOwner} isAdmin={isAdmin} canEditDate={canEditDate}
              user={user}
            />
          )}
          {tab === "daily" && (
            <DailyView
              selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              attendance={attendance}
              setTab={setTab} setPeriod={setPeriod}
              screenshotMode={screenshotMode} setScreenshotMode={setScreenshotMode}
              Y={Y} M={M} MONTH_DAYS={MONTH_DAYS} TRAINING_DAYS={TRAINING_DAYS}
              isAdmin={isAdmin}
              deletedPersons={deletedPersons}
            />
          )}
          {tab === "monthly" && (
            <MonthlyView attendance={attendance} setSelectedDate={setSelectedDate} setTab={setTab}
                         Y={Y} M={M} TRAINING_DAYS={TRAINING_DAYS} isAdmin={isAdmin}
                         deletedPersons={deletedPersons} />
          )}
          {tab === "manage" && (
            <ManagementView
              user={user}
              config={config}
              setConfig={setConfig}
              isOwner={isOwner}
              isAdmin={isAdmin}
              noAdminsYet={noAdminsYet}
              logAction={logAction}
            />
          )}
          {tab === "audit" && isOwner && (
            <AuditLogView user={user} logAction={logAction} />
          )}
          {tab === "stats" && (
            <SwimStatsView
              swimStats={swimStats}
              setSwimStats={setSwimStats}
              swimStatsLoaded={swimStatsLoaded}
              isAdmin={isAdmin}
              isOwner={isOwner}
              logAction={logAction}
              user={user}
            />
          )}
          {tab === "calendar_editor" && (
            <CalendarEditorView
              attendance={attendance}
              setAttendance={setAttendance}
              logAction={logAction}
              isOwner={isOwner}
              isAdmin={isAdmin}
            />
          )}
          {tab === "settings" && isOwner && (
            <SettingsView
              user={user}
              attendance={attendance}
              setAttendance={setAttendance}
              roster={roster}
              setRoster={setRoster}
              logAction={logAction}
            />
          )}
        </div>

        <footer className="mt-10 pt-6 border-t flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-xs tk-l"
                style={{ borderColor: "var(--line)", color: "var(--mute)" }}>
          <span className="num">{roster.length} ATHLETES</span>
          <span>·</span>
          <span className="num">{TRAINING_DAYS.length} TRAINING DAYS</span>
          <span>·</span>
          <span className="num">{TRAINING_DAYS.length * 2} SESSIONS</span>
        </footer>
      </div>
    </div>
    </RosterContext.Provider>
  );
}

// ============ TAB BAR ============
function TabBar({ tab, setTab, isOwner, isAdmin }) {
  const tabs = [
    { k: "rollcall", l: "點名", icon: ClipboardCheck },
    { k: "daily", l: "總覽", icon: ListChecks },
    { k: "monthly", l: "統計", icon: BarChart3 },
    { k: "stats", l: "成績", icon: Trophy },
    { k: "calendar_editor", l: "行事曆", icon: CalendarDays },
    { k: "manage", l: "管理", icon: Settings },
    ...(isOwner ? [{ k: "audit", l: "紀錄", icon: History }] : []),
    ...(isOwner ? [{ k: "settings", l: "設定", icon: Settings }] : []),
  ];
  return (
    <div className="flex gap-1 mb-4 p-1 rounded-2xl border-2 overflow-x-auto"
         style={{ borderColor: "var(--ink)", background: "var(--panel)" }}>
      {tabs.map(t => {
        const active = tab === t.k;
        const Ic = t.icon;
        return (
          <button key={t.k} onClick={() => setTab(t.k)}
                  className="btn-tactile flex-1 flex items-center justify-center gap-1 px-1.5 sm:px-3 py-2 rounded-xl text-[12px] sm:text-base font-medium whitespace-nowrap min-w-0"
                  style={{
                    background: active ? "var(--ink)" : "transparent",
                    color: active ? "var(--bg)" : "var(--ink-2)",
                    flexShrink: 0,
                    minWidth: "fit-content",
                  }}>
            <Ic size={14} strokeWidth={2.5} className="flex-shrink-0" />
            <span>{t.l}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============ MINI CALENDAR ============
// ============ DATE PICKER (三層：年/月/日) ============
function DatePicker({ selectedDate, onPick, attendance }) {
  const { Y: selY, M: selM } = monthFromDate(selectedDate);
  // viewY/viewM = 月曆當前顯示的月份（可獨立於 selectedDate）
  const [viewY, setViewY] = useState(selY);
  const [viewM, setViewM] = useState(selM);
  // mode: "calendar" | "year" | "month"
  const [mode, setMode] = useState("calendar");

  // 當 selectedDate 改變時同步 view（除非使用者正在切月份）
  const lastSelRef = useRef(selectedDate);
  useEffect(() => {
    if (selectedDate !== lastSelRef.current) {
      const { Y, M } = monthFromDate(selectedDate);
      setViewY(Y);
      setViewM(M);
      lastSelRef.current = selectedDate;
    }
  }, [selectedDate]);

  const goPrevMonth = () => {
    const { Y: nY, M: nM } = shiftMonth(viewY, viewM, -1);
    setViewY(nY); setViewM(nM);
  };
  const goNextMonth = () => {
    const { Y: nY, M: nM } = shiftMonth(viewY, viewM, 1);
    setViewY(nY); setViewM(nM);
  };
  const handlePick = (ds) => {
    lastSelRef.current = ds;
    onPick(ds);
  };

  // ===== 月份檢視 =====
  if (mode === "month") {
    return (
      <div>
        {/* 年份切換 */}
        <div className="flex items-center justify-between mb-3 px-2">
          <button onClick={() => setViewY(y => y - 1)}
                  className="btn-tactile w-9 h-9 rounded-md border flex items-center justify-center"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <button onClick={() => setMode("year")}
                  className="btn-tactile px-4 py-1.5 rounded-md font-bold text-lg"
                  style={{ background: "var(--panel-2)", color: "var(--ink)" }}>
            {viewY} 年 ▾
          </button>
          <button onClick={() => setViewY(y => y + 1)}
                  className="btn-tactile w-9 h-9 rounded-md border flex items-center justify-center"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* 12 個月格子 */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 12 }, (_, m) => {
            const isCurrent = viewY === selY && m === selM;
            const isToday = (() => {
              const t = new Date();
              return t.getFullYear() === viewY && t.getMonth() === m;
            })();
            return (
              <button key={m}
                      onClick={() => { setViewM(m); setMode("calendar"); }}
                      className="btn-tactile py-3 rounded-lg border-2 font-medium"
                      style={{
                        background: isCurrent ? "var(--ink)" : "var(--panel-2)",
                        color: isCurrent ? "var(--bg)" : "var(--ink)",
                        borderColor: isToday && !isCurrent ? "var(--accent)" : "transparent",
                      }}>
                {m + 1} 月
              </button>
            );
          })}
        </div>

        <button onClick={() => setMode("calendar")}
                className="btn-tactile w-full mt-3 py-2 rounded-md text-xs"
                style={{ color: "var(--mute)" }}>
          ← 回月曆
        </button>
      </div>
    );
  }

  // ===== 年份檢視 =====
  if (mode === "year") {
    const startY = Math.floor(viewY / 12) * 12;
    return (
      <div>
        <div className="flex items-center justify-between mb-3 px-2">
          <button onClick={() => setViewY(y => y - 12)}
                  className="btn-tactile w-9 h-9 rounded-md border flex items-center justify-center"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <span className="font-bold text-lg" style={{ color: "var(--ink)" }}>
            {startY} - {startY + 11}
          </span>
          <button onClick={() => setViewY(y => y + 12)}
                  className="btn-tactile w-9 h-9 rounded-md border flex items-center justify-center"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 12 }, (_, i) => {
            const y = startY + i;
            const isCurrent = y === selY;
            const isThisYear = y === new Date().getFullYear();
            return (
              <button key={y}
                      onClick={() => { setViewY(y); setMode("month"); }}
                      className="btn-tactile py-3 rounded-lg border-2 font-medium"
                      style={{
                        background: isCurrent ? "var(--ink)" : "var(--panel-2)",
                        color: isCurrent ? "var(--bg)" : "var(--ink)",
                        borderColor: isThisYear && !isCurrent ? "var(--accent)" : "transparent",
                      }}>
                {y}
              </button>
            );
          })}
        </div>

        <button onClick={() => setMode("month")}
                className="btn-tactile w-full mt-3 py-2 rounded-md text-xs"
                style={{ color: "var(--mute)" }}>
          ← 回月份選擇
        </button>
      </div>
    );
  }

  // ===== 月曆檢視（預設） =====
  const Y = viewY, M = viewM;
  const firstDay = new Date(Y, M, 1).getDay();
  const lastDate = new Date(Y, M + 1, 0).getDate();
  const cells = [];
  const lead = (firstDay + 6) % 7;
  for (let i = 0; i < lead; i++) cells.push({ blank: true });
  for (let d = 1; d <= lastDate; d++) cells.push({ d });
  while (cells.length % 7 !== 0) cells.push({ blank: true });

  const dayHasData = (d) => {
    const ds = `${Y}-${pad(M + 1)}-${pad(d)}`;
    const a = attendance[ds];
    if (!a) return false;
    return Object.keys(a.am || {}).length > 0 || Object.keys(a.pm || {}).length > 0;
  };
  const today = new Date();
  const todayStr = (today.getFullYear() === Y && today.getMonth() === M) ? toDateStr(today) : null;

  return (
    <div>
      {/* 月份標頭：點可進「月份選擇」 */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={goPrevMonth}
                className="btn-tactile w-8 h-8 rounded-md border flex items-center justify-center"
                style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}
                title="上個月">
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
        <button onClick={() => setMode("month")}
                className="btn-tactile px-3 py-1.5 rounded-md hover:opacity-80"
                style={{ background: "var(--panel-2)", color: "var(--ink)" }}
                title="點此選月份／年份">
          <span className="display-cn text-base font-bold">
            {Y} 年 {MONTH_NAMES_CN[M]} ▾
          </span>
        </button>
        <button onClick={goNextMonth}
                className="btn-tactile w-8 h-8 rounded-md border flex items-center justify-center"
                style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}
                title="下個月">
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* 星期標頭 */}
      <div className="grid grid-cols-7 gap-1 mb-1.5 text-[10px] sm:text-xs"
           style={{ color: "var(--mute)" }}>
        {["一","二","三","四","五","六","日"].map((d, i) => (
          <div key={d} className="text-center font-medium tk-l py-1"
               style={{ color: i === 6 ? "var(--mute)" : "var(--ink-2)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (c.blank) return <div key={i} />;
          const ds = `${Y}-${pad(M + 1)}-${pad(c.d)}`;
          const info = getDateInfo(ds);
          const isOff = info.off;
          const isSelected = ds === selectedDate;
          const isToday = ds === todayStr;
          const hasData = dayHasData(c.d);
          const amV = !isOff ? getVenue(attendance, ds, "am") : null;
          const pmV = !isOff ? getVenue(attendance, ds, "pm") : null;
          const isYongyun = amV === "yongyun" || pmV === "yongyun";
          const isAllClosed = !isOff && amV === "closed" && pmV === "closed";
          return (
            <button key={i}
                    onClick={() => !isOff && handlePick(ds)}
                    disabled={isOff}
                    className="btn-tactile relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm sm:text-base"
                    style={{
                      background: isSelected ? "var(--ink)"
                        : isOff ? "transparent"
                        : isAllClosed ? VENUES.closed.bg
                        : isYongyun ? VENUES.yongyun.bg
                        : "var(--panel-2)",
                      color: isSelected ? "var(--bg)"
                        : isOff ? "var(--mute)"
                        : isAllClosed ? VENUES.closed.color
                        : isYongyun ? VENUES.yongyun.color
                        : "var(--ink)",
                      border: isToday && !isSelected ? "2px solid var(--accent)" : "2px solid transparent",
                      cursor: isOff ? "not-allowed" : "pointer",
                      fontWeight: isSelected ? 700 : 400,
                      opacity: isAllClosed && !isSelected ? 0.6 : 1,
                    }}>
              <span className="num">{c.d}</span>
              {isYongyun && !isAllClosed && !isSelected && (
                <span className="absolute top-0.5 right-0.5 text-[8px] font-bold leading-none"
                      style={{ color: VENUES.yongyun.color }}>
                  永
                </span>
              )}
              {isAllClosed && !isSelected && (
                <span className="absolute top-0.5 right-0.5 text-[8px] font-bold leading-none"
                      style={{ color: VENUES.closed.color }}>
                  停
                </span>
              )}
              {hasData && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full"
                      style={{ background: isAllClosed ? VENUES.closed.color : isYongyun ? VENUES.yongyun.color : "var(--green-2)" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* 圖例 */}
      <div className="mt-2 flex items-center gap-3 text-[10px] flex-wrap" style={{ color: "var(--mute)" }}>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--ink)" }} />
          已選
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm border-2" style={{ borderColor: "var(--accent)" }} />
          今日
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full" style={{ background: "var(--green-2)" }} />
          有點名
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm flex items-center justify-center text-[7px] font-bold"
                style={{ background: VENUES.yongyun.bg, color: VENUES.yongyun.color }}>
            永
          </span>
          永運
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm flex items-center justify-center text-[7px] font-bold"
                style={{ background: VENUES.closed.bg, color: VENUES.closed.color }}>
            停
          </span>
          停練
        </span>
      </div>
    </div>
  );
}

// ============ MINI CALENDAR (舊版，保留給其他可能還在用的地方) ============
function MiniCalendar({ selectedDate, onPick, attendance }) {
  // viewY/viewM 是月曆當前顯示的月份
  const [viewY, setViewY] = useState(() => monthFromDate(selectedDate).Y);
  const [viewM, setViewM] = useState(() => monthFromDate(selectedDate).M);
  // 追蹤上次點選的日期，用來區分「使用者點月曆」vs「外部改 selectedDate」
  const lastPickedRef = useRef(selectedDate);

  // 當 selectedDate 「外部」改變時（不是透過點此月曆）→ 同步月曆 view
  useEffect(() => {
    if (selectedDate === lastPickedRef.current) return; // 是內部點選引起的，不同步
    const { Y: nY, M: nM } = monthFromDate(selectedDate);
    setViewY(nY);
    setViewM(nM);
    lastPickedRef.current = selectedDate;
  }, [selectedDate]);

  // 包裝 onPick，記錄已選的日期
  const handlePick = (ds) => {
    lastPickedRef.current = ds;
    onPick(ds);
  };

  const Y = viewY, M = viewM;
  const goPrev = () => {
    const { Y: nY, M: nM } = shiftMonth(Y, M, -1);
    setViewY(nY); setViewM(nM);
  };
  const goNext = () => {
    const { Y: nY, M: nM } = shiftMonth(Y, M, 1);
    setViewY(nY); setViewM(nM);
  };
  const goToday = () => {
    const today = new Date();
    setViewY(today.getFullYear());
    setViewM(today.getMonth());
  };

  const firstDay = new Date(Y, M, 1).getDay();
  const lastDate = new Date(Y, M + 1, 0).getDate();
  const cells = [];
  const lead = (firstDay + 6) % 7;
  for (let i = 0; i < lead; i++) cells.push({ blank: true });
  for (let d = 1; d <= lastDate; d++) cells.push({ d });
  while (cells.length % 7 !== 0) cells.push({ blank: true });

  const dayHasData = (d) => {
    const ds = `${Y}-${pad(M + 1)}-${pad(d)}`;
    const a = attendance[ds];
    if (!a) return false;
    return Object.keys(a.am || {}).length > 0 || Object.keys(a.pm || {}).length > 0;
  };

  const today = new Date();
  const todayStr = (today.getFullYear() === Y && today.getMonth() === M) ? toDateStr(today) : null;

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={goPrev}
                className="btn-tactile w-7 h-7 rounded-md border flex items-center justify-center"
                style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}
                title="上個月">
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
        <button onClick={goToday}
                className="btn-tactile flex items-baseline gap-1.5 px-2 py-1 rounded-md hover:bg-[var(--panel-2)]"
                title="回到本月">
          <span className="display-cn text-base font-bold" style={{ color: "var(--ink)" }}>
            {Y} 年 {MONTH_NAMES_CN[M]}
          </span>
        </button>
        <button onClick={goNext}
                className="btn-tactile w-7 h-7 rounded-md border flex items-center justify-center"
                style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}
                title="下個月">
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1.5 text-[10px] sm:text-xs"
           style={{ color: "var(--mute)" }}>
        {["一","二","三","四","五","六","日"].map((d, i) => (
          <div key={d} className="text-center font-medium tk-l py-1"
               style={{ color: i === 6 ? "var(--mute)" : "var(--ink-2)" }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (c.blank) return <div key={i} />;
          const ds = `${Y}-${pad(M + 1)}-${pad(c.d)}`;
          const info = getDateInfo(ds);
          const isOff = info.off;
          const isSelected = ds === selectedDate;
          const isToday = ds === todayStr;
          const hasData = dayHasData(c.d);
          const amV = !isOff ? getVenue(attendance, ds, "am") : null;
          const pmV = !isOff ? getVenue(attendance, ds, "pm") : null;
          const isYongyun = amV === "yongyun" || pmV === "yongyun";
          // 整天停練（兩場都 closed）= 灰色
          const isAllClosed = !isOff && amV === "closed" && pmV === "closed";
          return (
            <button key={i}
                    onClick={() => !isOff && handlePick(ds)}
                    disabled={isOff}
                    className="btn-tactile relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm sm:text-base"
                    style={{
                      background: isSelected ? "var(--ink)"
                        : isOff ? "transparent"
                        : isAllClosed ? VENUES.closed.bg
                        : isYongyun ? VENUES.yongyun.bg
                        : "var(--panel-2)",
                      color: isSelected ? "var(--bg)"
                        : isOff ? "var(--mute)"
                        : isAllClosed ? VENUES.closed.color
                        : isYongyun ? VENUES.yongyun.color
                        : "var(--ink)",
                      border: isToday && !isSelected ? "2px solid var(--accent)" : "2px solid transparent",
                      cursor: isOff ? "not-allowed" : "pointer",
                      fontWeight: isSelected ? 700 : 400,
                      opacity: isAllClosed && !isSelected ? 0.6 : 1,
                    }}>
              <span className="num">{c.d}</span>
              {isYongyun && !isAllClosed && !isSelected && (
                <span className="absolute top-0.5 right-0.5 text-[8px] font-bold leading-none"
                      style={{ color: VENUES.yongyun.color }}>
                  永
                </span>
              )}
              {isAllClosed && !isSelected && (
                <span className="absolute top-0.5 right-0.5 text-[8px] font-bold leading-none"
                      style={{ color: VENUES.closed.color }}>
                  停
                </span>
              )}
              {hasData && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full"
                      style={{ background: isAllClosed ? VENUES.closed.color : isYongyun ? VENUES.yongyun.color : "var(--green-2)" }} />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] flex-wrap" style={{ color: "var(--mute)" }}>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--ink)" }} />
          已選
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm border-2" style={{ borderColor: "var(--accent)" }} />
          今日
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full" style={{ background: "var(--green-2)" }} />
          有點名
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm flex items-center justify-center text-[7px] font-bold"
                style={{ background: VENUES.yongyun.bg, color: VENUES.yongyun.color }}>
            永
          </span>
          永運
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm flex items-center justify-center text-[7px] font-bold"
                style={{ background: VENUES.closed.bg, color: VENUES.closed.color }}>
            停
          </span>
          停練
        </span>
      </div>
    </div>
  );
}

// ============ ROLL CALL VIEW ============
function RollCallView({ selectedDate, setSelectedDate, period, setPeriod, attendance, setAttendance,
                        Y, M, MONTH_DAYS, TRAINING_DAYS,
                        isOwner, isAdmin, canEditDate, user }) {
  const { roster } = useRoster();
  const [filter, setFilter] = useState("all");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const navDate = (delta) => {
    const idx = TRAINING_DAYS.findIndex(d => d.dateStr === selectedDate);
    if (idx === -1) return;
    const ni = (idx + delta + TRAINING_DAYS.length) % TRAINING_DAYS.length;
    setSelectedDate(TRAINING_DAYS[ni].dateStr);
  };
  const dateInfo = getDateInfo(selectedDate);
  const sessionIdx = period === "am" ? dateInfo.amIdx : dateInfo.pmIdx;
  const periodLabel = period === "am" ? "早訓" : "午訓";
  const fullLabel = `${dateInfo.dayLabel}${periodLabel}`;
  const sessionAtt = attendance[selectedDate]?.[period] || {};
  const lateKey = period === "am" ? "am_late" : "pm_late";
  const notesKey = period === "am" ? "am_notes" : "pm_notes";
  const soloKey = period === "am" ? "am_solo" : "pm_solo";
  const sessionLate = attendance[selectedDate]?.[lateKey] || {};
  const sessionNotes = attendance[selectedDate]?.[notesKey] || {};
  const sessionSolo = attendance[selectedDate]?.[soloKey] || {};
  // 個練判斷：當日任一場勾個練 → 整天免費
  const dayAnyAmSolo = attendance[selectedDate]?.am_solo || {};
  const dayAnyPmSolo = attendance[selectedDate]?.pm_solo || {};
  const dayNote = attendance[selectedDate]?.notes || "";

  const rows = useMemo(() => roster.map(p => {
    const scheduled = getSch(attendance, selectedDate, p, sessionIdx);
    const actual = sessionAtt[p.seq] || null;
    const late = !!sessionLate[p.seq];
    const solo = !!sessionSolo[p.seq];
    // 此人當日是否個練（任一場勾就算）
    const dayHasSolo = !!(dayAnyAmSolo[p.seq] || dayAnyPmSolo[p.seq]);
    const note = sessionNotes[p.seq] || "";
    let status = "pending_excused";
    if (scheduled && actual === "present") status = "on_time";
    else if (scheduled && actual === "absent") status = "no_show";
    else if (!scheduled && actual === "present") status = "bonus";
    else if (!scheduled && actual === "absent") status = "confirmed_excused";
    else if (scheduled && !actual) status = "pending";
    return { ...p, scheduled, actual, status, late, solo, dayHasSolo, note };
  }), [sessionIdx, sessionAtt, sessionLate, sessionNotes, sessionSolo, dayAnyAmSolo, dayAnyPmSolo, roster]);

  const stats = useMemo(() => ({
    scheduledTotal: rows.filter(r => r.scheduled).length,
    excusedTotal: rows.filter(r => !r.scheduled).length,
    onTime: rows.filter(r => r.status === "on_time").length,
    noShow: rows.filter(r => r.status === "no_show").length,
    pending: rows.filter(r => r.status === "pending").length,
    bonus: rows.filter(r => r.status === "bonus").length,
    totalRoster: rows.length,
  }), [rows]);
  // 實際到場 = 表定到 + 補訓到
  const actualPresent = stats.onTime + stats.bonus;
  // 表定出席率 = 表定到 / 表定總數
  // 看「該來的有沒有來」，最高 100%
  const scheduledRate = stats.scheduledTotal === 0
    ? null
    : Math.round(stats.onTime / stats.scheduledTotal * 100);
  // 實際出席率 = (表定到 + 補訓到) / 全隊人數
  // 看「整隊到場率」
  const actualRate = rows.length === 0
    ? null
    : Math.round(actualPresent / rows.length * 100);

  // 是否被鎖定（一般教練 / 管理員不能改超過寬限期的舊資料）
  const locked = !canEditDate(selectedDate);
  const [lockedAlert, setLockedAlert] = useState(false);
  const triggerLockedAlert = () => {
    setLockedAlert(true);
    setTimeout(() => setLockedAlert(false), 4000);
  };

  const mark = (seq, st) => {
    if (locked) { triggerLockedAlert(); return; }
    const person = ROSTER_lookup(roster, seq);
    const before = sessionAtt[seq] || null;
    setAttendance(prev => {
      const day = { ...(prev[selectedDate] || {}) };
      const slot = { ...(day[period] || {}) };
      let after;
      if (slot[seq] === st) { delete slot[seq]; after = null; }
      else { slot[seq] = st; after = st; }
      day[period] = slot;
      // 切換到非 present 時順便清掉 late 與 solo 標記
      const lateKey = period === "am" ? "am_late" : "pm_late";
      const lateSlot = { ...(day[lateKey] || {}) };
      if (after !== "present" && lateSlot[seq]) {
        delete lateSlot[seq];
        day[lateKey] = lateSlot;
      }
      const soloKeyLocal = period === "am" ? "am_solo" : "pm_solo";
      const soloSlot = { ...(day[soloKeyLocal] || {}) };
      if (after !== "present" && soloSlot[seq]) {
        delete soloSlot[seq];
        day[soloKeyLocal] = soloSlot;
      }
      return { ...prev, [selectedDate]: day };
    }, {
      dateStr: selectedDate,
      logPayload: {
        target: `attendance/${selectedDate}/${period}/${seq}`,
        targetLabel: `${selectedDate} ${period === "am" ? "早訓" : "午訓"} - ${person?.name || `#${seq}`}`,
        before: { value: before },
        after: { value: st === before ? null : st },
      },
    });
  };

  // 切換「遲到未下水」標記（僅當該人 status === "present" 時生效）
  const markLate = (seq) => {
    if (locked) { triggerLockedAlert(); return; }
    const person = ROSTER_lookup(roster, seq);
    const lateKey = period === "am" ? "am_late" : "pm_late";
    const beforeLate = !!(attendance[selectedDate]?.[lateKey]?.[seq]);
    setAttendance(prev => {
      const day = { ...(prev[selectedDate] || {}) };
      const lateSlot = { ...(day[lateKey] || {}) };
      if (lateSlot[seq]) { delete lateSlot[seq]; }
      else { lateSlot[seq] = true; }
      day[lateKey] = lateSlot;
      return { ...prev, [selectedDate]: day };
    }, {
      dateStr: selectedDate,
      logPayload: {
        target: `attendance/${selectedDate}/${period}/${seq}/late`,
        targetLabel: `${selectedDate} ${period === "am" ? "早訓" : "午訓"} - ${person?.name || `#${seq}`} - 遲到標記`,
        before: { late: beforeLate },
        after: { late: !beforeLate },
      },
    });
  };

  // 切換「個練」標記（永運場次 + 出席時生效）
  // 注意：當日任一場勾個練 → 整天永運免費（在費用計算時處理）
  const markSolo = (seq) => {
    if (locked) { triggerLockedAlert(); return; }
    const person = ROSTER_lookup(roster, seq);
    const soloKey = period === "am" ? "am_solo" : "pm_solo";
    const beforeSolo = !!(attendance[selectedDate]?.[soloKey]?.[seq]);
    setAttendance(prev => {
      const day = { ...(prev[selectedDate] || {}) };
      const soloSlot = { ...(day[soloKey] || {}) };
      if (soloSlot[seq]) { delete soloSlot[seq]; }
      else { soloSlot[seq] = true; }
      day[soloKey] = soloSlot;
      return { ...prev, [selectedDate]: day };
    }, {
      dateStr: selectedDate,
      logPayload: {
        target: `attendance/${selectedDate}/${period}/${seq}/solo`,
        targetLabel: `${selectedDate} ${period === "am" ? "早訓" : "午訓"} - ${person?.name || `#${seq}`} - 個練標記`,
        before: { solo: beforeSolo },
        after: { solo: !beforeSolo },
      },
    });
  };

  // 設定 / 清空個人備註
  const setPersonNote = (seq, text) => {
    if (locked) { triggerLockedAlert(); return; }
    const person = ROSTER_lookup(roster, seq);
    const notesKey = period === "am" ? "am_notes" : "pm_notes";
    const beforeNote = attendance[selectedDate]?.[notesKey]?.[seq] || "";
    const trimmed = (text || "").trim();
    if (beforeNote === trimmed) return; // 沒變不做
    setAttendance(prev => {
      const day = { ...(prev[selectedDate] || {}) };
      const notesSlot = { ...(day[notesKey] || {}) };
      if (trimmed === "") { delete notesSlot[seq]; }
      else { notesSlot[seq] = trimmed; }
      day[notesKey] = notesSlot;
      return { ...prev, [selectedDate]: day };
    }, {
      dateStr: selectedDate,
      logPayload: {
        target: `attendance/${selectedDate}/${period}/${seq}/note`,
        targetLabel: `${selectedDate} ${period === "am" ? "早訓" : "午訓"} - ${person?.name || `#${seq}`} - 個人備註`,
        before: { note: beforeNote },
        after: { note: trimmed },
      },
    });
  };

  // 整日備註（不分早午訓）
  const setDayNote = (text) => {
    if (locked) { triggerLockedAlert(); return; }
    const beforeNote = attendance[selectedDate]?.notes || "";
    const trimmed = (text || "").trim();
    if (beforeNote === trimmed) return;
    setAttendance(prev => {
      const day = { ...(prev[selectedDate] || {}) };
      if (trimmed === "") { delete day.notes; }
      else { day.notes = trimmed; }
      return { ...prev, [selectedDate]: day };
    }, {
      dateStr: selectedDate,
      logPayload: {
        target: `attendance/${selectedDate}/notes`,
        targetLabel: `${selectedDate} - 整日備註`,
        before: { note: beforeNote },
        after: { note: trimmed },
      },
    });
  };

  // 切換場地（早訓 / 午訓 各自）
  const setVenue = (newVenueId) => {
    if (locked) { triggerLockedAlert(); return; }
    if (!VENUES[newVenueId]) return;
    const beforeVenue = getVenue(attendance, selectedDate, period);
    if (beforeVenue === newVenueId) return;
    setAttendance(prev => {
      const day = { ...(prev[selectedDate] || {}) };
      const venueObj = { ...(day.venue || {}) };
      venueObj[period] = newVenueId;
      day.venue = venueObj;
      return { ...prev, [selectedDate]: day };
    }, {
      dateStr: selectedDate,
      logPayload: {
        target: `attendance/${selectedDate}/venue/${period}`,
        targetLabel: `${selectedDate} ${period === "am" ? "早訓" : "午訓"} - 場地切換`,
        before: { venue: beforeVenue },
        after: { venue: newVenueId },
      },
    });
  };
  const currentVenue = getVenue(attendance, selectedDate, period);
  const markAllPresent = () => {
    if (locked) { triggerLockedAlert(); return; }
    const beforeSlot = { ...(attendance[selectedDate]?.[period] || {}) };
    const changes = [];
    setAttendance(prev => {
      const day = { ...(prev[selectedDate] || {}) };
      const slot = { ...(day[period] || {}) };
      rows.forEach(r => {
        if (r.scheduled && !r.actual) {
          slot[r.seq] = "present";
          changes.push(r.name);
        }
      });
      day[period] = slot;
      return { ...prev, [selectedDate]: day };
    }, {
      dateStr: selectedDate,
      logPayload: {
        target: `attendance/${selectedDate}/${period}`,
        targetLabel: `${selectedDate} ${period === "am" ? "早訓" : "午訓"} - 一鍵全到`,
        note: `批次標記 ${changes.length} 人為出席：${changes.join("、")}`,
      },
    });
  };
  const handleReset = () => {
    if (locked) { triggerLockedAlert(); return; }
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    setResetConfirm(false);
    const beforeSlot = { ...(attendance[selectedDate]?.[period] || {}) };
    setAttendance(prev => {
      const day = { ...(prev[selectedDate] || {}) };
      day[period] = {};
      return { ...prev, [selectedDate]: day };
    }, {
      dateStr: selectedDate,
      logPayload: {
        target: `attendance/${selectedDate}/${period}`,
        targetLabel: `${selectedDate} ${period === "am" ? "早訓" : "午訓"} - 重設`,
        note: `清除整場點名（共 ${Object.keys(beforeSlot).length} 筆紀錄）`,
        before: { value: beforeSlot },
      },
    });
  };
  const exportSession = () => {
    const csvSafe = (s) => `"${(s || "").replace(/"/g, '""')}"`;
    const venueLabel = VENUES[currentVenue].label;
    const fee = VENUES[currentVenue].fee;
    const lines = [
      [`場地：${venueLabel}${fee > 0 ? ` (每人 $${fee})` : ""}`].join(","),
      ["序號", "班級", "座號", "姓名", "年級", "表定", "實際", "遲到", "備註"].join(","),
      ...rows.map(r => [
        r.seq, r.cls, r.num, r.name, GRADE_NAMES[r.grade],
        r.scheduled ? "出席" : "不出席",
        r.actual === "present" ? "出席" : r.actual === "absent" ? "未到" : "未點名",
        r.late ? "是" : "",
        csvSafe(r.note),
      ].join(","))
    ];
    if (dayNote) lines.push(`整日備註,${csvSafe(dayNote)}`);
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `點名_${selectedDate}_${fullLabel}_${venueLabel}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = rows.filter(r => {
    if (filter === "all") return true;
    if (filter === "pending") return r.status === "pending";
    if (filter === "on_time") return r.status === "on_time";
    if (filter === "no_show") return r.status === "no_show";
    if (filter === "scheduled") return r.scheduled;
    if (filter === "excused") return !r.scheduled;
    if (filter === "bonus") return r.status === "bonus";
    return true;
  });
  const grouped = [9, 8, 7]
    .map(g => ({ grade: g, label: GRADE_NAMES[g], members: filtered.filter(r => r.grade === g) }))
    .filter(g => g.members.length > 0);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl p-4 sm:p-5 border-2"
               style={{ background: "var(--panel)", borderColor: "var(--ink)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] sm:text-xs tk-x" style={{ color: "var(--mute)" }}>
            DATE · 日期
          </div>
          <button onClick={() => {
                    const today = toDateStr(new Date());
                    setSelectedDate(today);
                    setShowCalendar(false);
                  }}
                  className="btn-tactile flex items-center gap-1 text-[10px] sm:text-xs px-2.5 py-1 rounded-md border"
                  style={{
                    borderColor: "var(--accent)",
                    background: "var(--accent-bg)",
                    color: "var(--accent)",
                  }}
                  title="跳到今天">
            <RotateCcw size={11} strokeWidth={2.5} />
            回今天
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navDate(-1)}
                  className="btn-tactile w-10 h-10 sm:w-11 sm:h-11 rounded-lg border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}
                  title="上一個訓練日">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <button onClick={() => setShowCalendar(s => !s)}
                  className="btn-tactile flex-1 text-center px-2 py-2 rounded-lg border-2"
                  style={{
                    background: showCalendar ? "var(--ink)" : "var(--panel-2)",
                    borderColor: showCalendar ? "var(--ink)" : "var(--line)",
                  }}
                  title="點此切換月份/年份">
            <div className="display-cn text-xl sm:text-3xl leading-tight"
                 style={{ color: showCalendar ? "var(--bg)" : "var(--ink)" }}>
              {selectedDate.split("-").join(" / ")}
            </div>
            <div className="num text-sm sm:text-base font-medium"
                 style={{ color: showCalendar ? "rgba(255,252,246,0.85)" : "var(--ink-2)" }}>
              {dateInfo.dayLabel}
            </div>
          </button>
          <button onClick={() => navDate(1)}
                  className="btn-tactile w-10 h-10 sm:w-11 sm:h-11 rounded-lg border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}
                  title="下一個訓練日">
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="text-center text-[11px] mt-1.5" style={{ color: "var(--mute)" }}>
          {showCalendar ? "點下方月曆選日期" : "點上方日期可切換月份／年份"}
        </div>
        {showCalendar && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--line)" }}>
            <DatePicker selectedDate={selectedDate}
                        onPick={(ds) => { setSelectedDate(ds); setShowCalendar(false); }}
                        attendance={attendance} />
          </div>
        )}
      </section>

      <section className="rounded-2xl p-4 sm:p-5 border-2"
               style={{ background: "var(--panel)", borderColor: "var(--line-strong)" }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="text-[10px] sm:text-xs tk-x" style={{ color: "var(--mute)" }}>
            SESSION · 訓練時段
          </div>
          <div className="display-cn text-base sm:text-lg" style={{ color: "var(--ink)" }}>
            {fullLabel}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { k: "am", l: "早訓", Ic: Sun },
            { k: "pm", l: "午訓", Ic: Moon },
          ].map(p => {
            const active = period === p.k;
            const Ic = p.Ic;
            return (
              <button key={p.k} onClick={() => setPeriod(p.k)}
                      className="btn-tactile flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium"
                      style={{
                        borderColor: active ? "var(--red)" : "var(--line)",
                        background: active ? "var(--red)" : "transparent",
                        color: active ? "#fff" : "var(--ink-2)",
                      }}>
                <Ic size={16} strokeWidth={2.5} />
                {p.l}
              </button>
            );
          })}
        </div>

        {/* 場地切換（極簡單行） — 停練日不顯示按鈕 */}
        {currentVenue === "closed" ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
               style={{ background: VENUES.closed.bg, color: VENUES.closed.color }}>
            <span style={{ fontSize: 14 }}>🚫</span>
            <span className="text-[12px] font-medium">本場停練（行事曆設定）</span>
            <span className="ml-auto text-[10px]" style={{ opacity: 0.7 }}>
              如需點名請至「⚙️ 設定」改場地
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-wrap"
               style={{ background: "var(--panel-2)" }}>
            <span className="text-[11px]" style={{ color: "var(--mute)" }}>場地</span>
            {SELECTABLE_VENUES.map(vid => {
              const v = VENUES[vid];
              const active = currentVenue === v.id;
              return (
                <button key={v.id} onClick={() => setVenue(v.id)} disabled={locked}
                        className="btn-tactile px-3 py-1 rounded-md text-[13px] font-medium"
                        style={{
                          background: active ? v.color : "transparent",
                          color: active ? "#fff" : "var(--ink-2)",
                          border: active ? `1px solid ${v.color}` : "0.5px solid var(--line-strong)",
                          opacity: locked ? 0.6 : 1,
                        }}>
                  {v.label}
                </button>
              );
            })}
            {currentVenue === "yongyun" && (
              <span className="ml-auto text-[11px] font-bold"
                    style={{ color: VENUES.yongyun.color }}>
                永運 +${VENUE_FEE}/人/次
              </span>
            )}
          </div>
        )}
      </section>

      {/* 鎖定提示：超過 24 小時且非主管理員（訪客不顯示，避免干擾家長） */}
      {locked && isAdmin && (
        <div className={"rounded-xl p-3 sm:p-4 border-2 flex items-start gap-3 " + (lockedAlert ? "animate-pulse" : "")}
             style={{
               background: "var(--amber-bg)",
               borderColor: "var(--amber)",
             }}>
          <Lock size={18} strokeWidth={2.5} style={{ color: "#5C4810", marginTop: 2, flexShrink: 0 }} />
          <div className="flex-1 text-xs sm:text-sm" style={{ color: "#5C4810" }}>
            <div className="font-bold mb-0.5">此日期已超過編輯期限</div>
            <div>已過寬限期（訓練日當天 23:59 之後鎖定）。如需修改，請聯絡主管理員。</div>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard tag="SCHEDULED" label="表定出席" value={stats.scheduledTotal} sub={`／ 實到 ${stats.onTime}`} color="var(--ink)" />
        <StatCard tag="PRESENT" label="實際出席" value={actualPresent}
                  sub={stats.bonus > 0 ? `${stats.onTime}+補${stats.bonus}` : "人"}
                  color="var(--green)" bg="var(--green-bg)" />
        <StatCard tag="ABSENT" label="缺席" value={stats.noShow} sub="人" color="var(--red)" bg="var(--red-bg)" alert={stats.noShow > 0} />
        {/* RATE 卡片：自訂顯示兩個率 */}
        <div className="relative rounded-xl border-2 p-3 sm:p-4 flex flex-col"
             style={{ background: "var(--panel)", borderColor: "var(--ink)" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] tk-l" style={{ color: "var(--mute)", letterSpacing: "0.1em" }}>RATE</span>
          </div>
          <div className="text-xs sm:text-sm font-medium mb-2" style={{ color: "var(--ink-2)" }}>
            出席率
          </div>
          {scheduledRate === null && actualRate === null ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-2xl" style={{ color: "var(--mute)" }}>—</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-1.5 justify-center">
              {/* 表定出席率 */}
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] sm:text-xs" style={{ color: "var(--mute)" }}>表定</span>
                <span>
                  <span className="num text-base sm:text-lg font-bold"
                        style={{ color: scheduledRate !== null && scheduledRate >= 90 ? "var(--green)" : "var(--ink)" }}>
                    {scheduledRate === null ? "—" : scheduledRate}
                  </span>
                  {scheduledRate !== null && (
                    <span className="text-[10px] ml-0.5" style={{ color: "var(--mute)" }}>%</span>
                  )}
                </span>
              </div>
              {/* 實際出席率 */}
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] sm:text-xs" style={{ color: "var(--mute)" }}>實際</span>
                <span>
                  <span className="num text-base sm:text-lg font-bold"
                        style={{ color: actualRate !== null && actualRate >= 90 ? "var(--green)" : "var(--ink)" }}>
                    {actualRate === null ? "—" : actualRate}
                  </span>
                  {actualRate !== null && (
                    <span className="text-[10px] ml-0.5" style={{ color: "var(--mute)" }}>%</span>
                  )}
                </span>
              </div>
              {stats.bonus > 0 && (
                <div className="text-[9px] sm:text-[10px] text-right" style={{ color: "var(--blue)" }}>
                  含補訓 +{stats.bonus}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 點名進度橫條 */}
      {(() => {
        const pointed = stats.scheduledTotal - stats.pending;
        const allDone = stats.pending === 0;
        return (
          <div className="rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 border-2 flex items-center gap-2 sm:gap-3 flex-wrap"
               style={{
                 background: allDone ? "var(--green-bg)" : "var(--amber-bg)",
                 borderColor: allDone ? "var(--green)" : "var(--amber)",
               }}>
            <span style={{ color: allDone ? "var(--green)" : "#5C4810", fontWeight: 700, fontSize: 14 }}>
              {allDone ? "✅" : "⏳"}
            </span>
            <span className="text-xs sm:text-sm font-bold" style={{ color: allDone ? "var(--green)" : "#5C4810" }}>
              點名進度
            </span>
            <span className="num text-base sm:text-lg font-bold" style={{ color: allDone ? "var(--green)" : "#5C4810" }}>
              {pointed} / {stats.scheduledTotal}
            </span>
            <span className="flex-1 text-xs sm:text-sm" style={{ color: allDone ? "var(--green)" : "#5C4810" }}>
              {allDone ? (
                <>全部表定隊員已點名完畢</>
              ) : (
                <>尚有 <span className="num font-bold">{stats.pending}</span> 位表定隊員未點名</>
              )}
            </span>
            {/* 進度條 */}
            <div style={{
              width: "min(120px, 30%)", height: 6, borderRadius: 3,
              background: "rgba(0,0,0,0.08)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${stats.scheduledTotal === 0 ? 0 : Math.round(pointed / stats.scheduledTotal * 100)}%`,
                background: allDone ? "var(--green)" : "var(--amber)",
                transition: "width 0.3s",
              }} />
            </div>
          </div>
        );
      })()}

      {/* 整日備註 - 只給管理員 */}
      {isAdmin && (
        <DayNoteSection dayNote={dayNote} setDayNote={setDayNote} locked={locked} />
      )}

      {stats.bonus > 0 && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm border"
               style={{ background: "var(--blue-bg)", borderColor: "var(--blue)", color: "var(--blue)" }}>
            <Sparkles size={14} strokeWidth={2.5} />
            <span className="font-medium"><span className="num">{stats.bonus}</span> 位補訓出席</span>
          </div>
        </div>
      )}

      <section className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {[
            { k: "all", l: `全部 ${rows.length}` },
            { k: "pending", l: `待點名 ${stats.pending}`, danger: stats.pending > 0 },
            { k: "on_time", l: `已到 ${stats.onTime}` },
            { k: "no_show", l: `缺席 ${stats.noShow}` },
            { k: "scheduled", l: `表定出席 ${stats.scheduledTotal}` },
            { k: "excused", l: `表定請假 ${stats.excusedTotal}` },
            ...(stats.bonus > 0 ? [{ k: "bonus", l: `補訓 ${stats.bonus}` }] : []),
          ].map(f => {
            const active = filter === f.k;
            return (
              <button key={f.k} onClick={() => setFilter(f.k)}
                      className="btn-tactile text-xs sm:text-sm px-3 py-1.5 rounded-full border"
                      style={{
                        borderColor: active ? "var(--ink)" : "var(--line)",
                        background: active ? "var(--ink)" : "transparent",
                        color: active ? "var(--bg)" : "var(--ink-2)",
                      }}>
                {f.l}{f.danger && !active && <span className="pulse-dot ml-1.5 align-middle" />}
              </button>
            );
          })}
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportSession}
                    className="btn-tactile flex items-center gap-1 text-xs sm:text-sm px-3 py-1.5 rounded-full border"
                    style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
              <Download size={13} strokeWidth={2.5} />
              匯出本場
            </button>
            <button onClick={handleReset}
                    className="btn-tactile flex items-center gap-1 text-xs sm:text-sm px-3 py-1.5 rounded-full border-2"
                    style={{
                      borderColor: resetConfirm ? "var(--red)" : "var(--line-strong)",
                      background: resetConfirm ? "var(--red)" : "transparent",
                      color: resetConfirm ? "#fff" : "var(--ink-2)",
                    }}>
              <RotateCcw size={13} strokeWidth={2.5} />
              {resetConfirm ? "確定重設？" : "重設本場"}
            </button>
            <button onClick={markAllPresent} disabled={stats.pending === 0}
                    className="btn-tactile flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-full border-2 font-medium"
                    style={{
                      borderColor: stats.pending === 0 ? "var(--line)" : "var(--green)",
                      background: stats.pending === 0 ? "transparent" : "var(--green)",
                      color: stats.pending === 0 ? "var(--mute)" : "#fff",
                      cursor: stats.pending === 0 ? "not-allowed" : "pointer",
                    }}>
              <Zap size={13} strokeWidth={2.5} />
              一鍵全到
            </button>
          </div>
        )}
      </section>

      {currentVenue === "closed" ? (
        <section className="rounded-2xl p-8 border-2 text-center"
                 style={{ background: VENUES.closed.bg, borderColor: VENUES.closed.color }}>
          <div style={{ fontSize: 36 }}>🚫</div>
          <div className="display-cn text-xl sm:text-2xl mt-2 font-bold"
               style={{ color: VENUES.closed.color }}>
            今日停練
          </div>
          {getCalendarNote(selectedDate) && (
            <div className="mt-1 text-sm" style={{ color: VENUES.closed.color }}>
              {getCalendarNote(selectedDate)}
            </div>
          )}
          <div className="mt-3 text-xs" style={{ color: VENUES.closed.color, opacity: 0.7 }}>
            行事曆排定本場停練，無需點名
          </div>
          <div className="mt-3 text-[11px]" style={{ color: VENUES.closed.color, opacity: 0.6 }}>
            如需臨時開訓，可至「⚙️ 設定」改場地後再來點名
          </div>
        </section>
      ) : (
      <section className="space-y-5">
        {grouped.length === 0 ? (
          <div className="text-center py-12 rounded-xl border-2 border-dashed"
               style={{ borderColor: "var(--line)", color: "var(--mute)" }}>
            此篩選條件下沒有隊員
          </div>
        ) : grouped.map(g => (
          <div key={g.grade}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-1.5 h-7" style={{ background: "var(--ink)" }} />
              <h2 className="display-cn text-lg sm:text-xl" style={{ color: "var(--ink)" }}>{g.label}</h2>
              <div className="num text-xs" style={{ color: "var(--mute)" }}>{g.members.length}</div>
              <div className="flex-1 border-b border-dashed" style={{ borderColor: "var(--line-strong)" }} />
            </div>
            <div className="space-y-2">
              {g.members.map(m => <CallRow key={m.seq} m={m} mark={mark} markLate={markLate} markSolo={markSolo} setPersonNote={setPersonNote} isYongyun={currentVenue === "yongyun"} isAdmin={isAdmin} />)}
            </div>
          </div>
        ))}
      </section>
      )}

      {stats.noShow > 0 && (
        <section className="p-4 sm:p-5 rounded-2xl border-2"
                 style={{ borderColor: "var(--red)", background: "var(--red-bg)" }}>
          <div className="text-[10px] tk-x mb-2" style={{ color: "var(--red)" }}>
            ABSENT LIST · 缺席名單
          </div>
          <div className="flex flex-wrap gap-2">
            {rows.filter(r => r.status === "no_show").map(r => (
              <span key={r.seq} className="px-2.5 py-1 rounded-md text-sm flex items-center gap-1.5"
                    style={{ background: "var(--red)", color: "#fff" }}>
                <span className="num text-xs opacity-70">{pad(r.seq)}</span>
                {r.name}
                <span className="num text-xs opacity-70">{r.cls}-{r.num}</span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CallRow({ m, mark, markLate, markSolo, setPersonNote, isYongyun, isAdmin }) {
  const isPresent = m.actual === "present";
  const isAbsent = m.actual === "absent";
  const [showNote, setShowNote] = useState(!!m.note);
  const [noteText, setNoteText] = useState(m.note || "");

  // 同步外部 note 變動
  useEffect(() => { setNoteText(m.note || ""); setShowNote(!!m.note || showNote); }, [m.note]);

  let bg = "var(--panel)", bd = "var(--line)", dim = 1;
  if (m.status === "on_time") { bg = "var(--green-bg)"; bd = "var(--green)"; }
  else if (m.status === "no_show") { bg = "var(--red-bg)"; bd = "var(--red)"; }
  else if (m.status === "pending") { bd = "var(--ink)"; }
  else if (m.status === "pending_excused") { bg = "transparent"; dim = 0.55; }
  else if (m.status === "bonus") { bg = "var(--blue-bg)"; bd = "var(--blue)"; }
  else if (m.status === "confirmed_excused") { bg = "var(--panel-2)"; bd = "var(--line-strong)"; dim = 0.7; }

  // 遲到時用橘色框框
  if (m.late && isPresent) { bd = "#E07B30"; bg = "rgba(224, 123, 48, 0.08)"; }

  // 個練優先級高於遲到（紫色）— 出席+永運+當日有勾任一場才生效
  if (isYongyun && m.dayHasSolo && isPresent) {
    bd = "#7C4DBC";
    bg = "rgba(124, 77, 188, 0.08)";
  }

  let actualLabel = null;
  if (m.status === "on_time") {
    if (m.solo) actualLabel = { t: "✓ 出席（個練）", b: "#7C4DBC", f: "#fff" };
    else if (m.late) actualLabel = { t: "✓ 出席（遲到）", b: "#E07B30", f: "#fff" };
    else actualLabel = { t: "✓ 實際出席", b: "var(--green)", f: "#fff" };
  }
  else if (m.status === "no_show") actualLabel = { t: "✗ 未到", b: "var(--red)", f: "#fff" };
  else if (m.status === "bonus") {
    if (m.solo) actualLabel = { t: "+ 補訓（個練）", b: "#7C4DBC", f: "#fff" };
    else if (m.late) actualLabel = { t: "+ 補訓（遲到）", b: "#E07B30", f: "#fff" };
    else actualLabel = { t: "+ 補訓出席", b: "var(--blue)", f: "#fff" };
  }
  else if (m.status === "confirmed_excused") actualLabel = { t: "已確認請假", b: "var(--ink-2)", f: "#fff" };

  const handleNoteBlur = () => {
    if (noteText !== (m.note || "")) {
      setPersonNote(m.seq, noteText);
    }
  };
  const clearNote = () => {
    setNoteText("");
    setPersonNote(m.seq, "");
    setShowNote(false);
  };

  return (
    <div className="row-fade-in flex flex-col gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2"
         style={{ background: bg, borderColor: bd, opacity: dim, transition: "all 0.2s" }}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="num text-[11px] sm:text-xs tabular-nums shrink-0"
             style={{ color: "var(--mute)", minWidth: "22px" }}>{pad(m.seq)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-medium truncate" style={{ color: "var(--ink)" }}>{m.name}</span>
            <span className="num text-[10px] sm:text-xs" style={{ color: "var(--mute)" }}>{m.cls}-{pad(m.num)}</span>
            {/* 個練 chip：當日有任一場勾個練 + 永運場 → 顯示 */}
            {isYongyun && m.dayHasSolo && (
              <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-bold"
                    style={{ background: "#7C4DBC", color: "#fff" }}
                    title="當日已勾選個練，整天永運免費">
                ⭐ 個練（免費）
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{
                    background: m.scheduled ? "var(--green)" : "transparent",
                    color: m.scheduled ? "#fff" : "var(--mute)",
                    border: `1px solid ${m.scheduled ? "var(--green)" : "var(--line-strong)"}`,
                  }}>
              {m.scheduled ? "● 表定出席" : "○ 表定不出席"}
            </span>
            {actualLabel && (
              <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{ background: actualLabel.b, color: actualLabel.f }}>
                {actualLabel.t}
              </span>
            )}
            {m.status === "pending" && (
              <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
                    style={{ color: "var(--amber)" }}>
                <span className="pulse-dot" style={{ background: "var(--amber)" }} />
                待點名
              </span>
            )}
            {m.note && !showNote && (
              <button onClick={() => setShowNote(true)}
                      className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: "var(--amber-bg)", color: "#5C4810", border: "1px dashed var(--amber)" }}
                      title="有備註，點擊查看">
                📝 有備註
              </button>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1 sm:gap-1.5 shrink-0">
            <button onClick={() => mark(m.seq, "present")}
                    className="btn-tactile w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center"
                    style={{
                      background: isPresent ? "var(--green)" : "transparent",
                      color: isPresent ? "#fff" : "var(--green)",
                      border: `2px solid var(--green)`,
                    }} title="出席">
              <Check size={18} strokeWidth={3.5} />
            </button>
            <button onClick={() => mark(m.seq, "absent")}
                    className="btn-tactile w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center"
                    style={{
                      background: isAbsent ? "var(--red)" : "transparent",
                      color: isAbsent ? "#fff" : "var(--red)",
                      border: `2px solid var(--red)`,
                    }} title="未到">
              <X size={18} strokeWidth={3.5} />
            </button>
          </div>
        )}
      </div>

      {/* 出席時的次要標記列：遲到 + 個練（永運場才有個練）— 訪客不顯示 */}
      {isPresent && isAdmin && (
        <div className="flex items-center gap-3 ml-7 flex-wrap">
          <button onClick={() => markLate(m.seq)}
                  className="btn-tactile flex items-center gap-1.5 px-2 py-1 rounded text-[11px] sm:text-xs font-medium"
                  style={{
                    background: m.late ? "#E07B30" : "transparent",
                    color: m.late ? "#fff" : "#E07B30",
                    border: `1.5px solid #E07B30`,
                  }}>
            <span style={{ fontSize: 11 }}>{m.late ? "✓" : "○"}</span>
            遲到未下水
          </button>
          {/* 個練 — 只有永運場才顯示 */}
          {isYongyun && (
            <button onClick={() => markSolo(m.seq)}
                    className="btn-tactile flex items-center gap-1.5 px-2 py-1 rounded text-[11px] sm:text-xs font-medium"
                    style={{
                      background: m.solo ? "#7C4DBC" : "transparent",
                      color: m.solo ? "#fff" : "#7C4DBC",
                      border: `1.5px solid #7C4DBC`,
                    }}
                    title="勾選後當日永運免費">
              <span style={{ fontSize: 11 }}>{m.solo ? "✓" : "○"}</span>
              個練 ⭐
            </button>
          )}
          {!showNote && (
            <button onClick={() => setShowNote(true)}
                    className="btn-tactile text-[11px] sm:text-xs px-2 py-1 rounded"
                    style={{ color: "var(--mute)", border: "1px dashed var(--line-strong)" }}>
              + 加備註
            </button>
          )}
        </div>
      )}

      {/* 對「未到 / 未點名」也允許加備註 — 訪客不顯示 */}
      {!isPresent && !showNote && m.status !== "pending_excused" && isAdmin && (
        <div className="ml-7">
          <button onClick={() => setShowNote(true)}
                  className="btn-tactile text-[11px] sm:text-xs px-2 py-1 rounded"
                  style={{ color: "var(--mute)", border: "1px dashed var(--line-strong)" }}>
            + 加備註
          </button>
        </div>
      )}

      {/* 備註輸入框 */}
      {showNote && (
        <div className="flex items-center gap-1.5 ml-7">
          <span className="text-[11px] shrink-0" style={{ color: "var(--mute)" }}>📝</span>
          <input type="text" value={noteText}
                 onChange={e => setNoteText(e.target.value)}
                 onBlur={handleNoteBlur}
                 onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
                 placeholder="例：腳痛 / 家庭因素 / 比賽請假..."
                 className="flex-1 px-2 py-1 rounded text-[12px] sm:text-sm"
                 style={{ border: "1px solid var(--line-strong)", background: "var(--panel)", color: "var(--ink)" }} />
          <button onClick={clearNote}
                  className="btn-tactile w-6 h-6 rounded flex items-center justify-center shrink-0"
                  style={{ color: "var(--mute)", border: "1px solid var(--line-strong)" }}
                  title="清空備註">
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

// ============ 整日備註區塊 ============
function DayNoteSection({ dayNote, setDayNote, locked }) {
  const [text, setText] = useState(dayNote);
  const [expanded, setExpanded] = useState(!!dayNote);
  useEffect(() => { setText(dayNote); setExpanded(!!dayNote || expanded); }, [dayNote]);

  const onBlur = () => { if (text !== dayNote) setDayNote(text); };
  const clear = () => { setText(""); setDayNote(""); setExpanded(false); };

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} disabled={locked}
              className="btn-tactile flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm border"
              style={{
                background: "var(--panel)", borderColor: "var(--line-strong)",
                color: locked ? "var(--mute)" : "var(--ink-2)",
                cursor: locked ? "not-allowed" : "pointer", opacity: locked ? 0.5 : 1,
              }}>
        <span style={{ fontSize: 14 }}>📝</span>
        <span>新增整日備註</span>
        <span className="text-[10px]" style={{ color: "var(--mute)" }}>（如：今日清晨大雨等）</span>
      </button>
    );
  }

  return (
    <section className="rounded-xl p-3 sm:p-4 border-2"
             style={{ background: "var(--amber-bg)", borderColor: "var(--amber)" }}>
      <div className="flex items-start gap-2">
        <span style={{ fontSize: 16, marginTop: 2 }}>📝</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <span className="text-[11px] tk-l font-medium" style={{ color: "#5C4810" }}>
              整日備註
            </span>
            <button onClick={clear} disabled={locked}
                    className="btn-tactile w-6 h-6 rounded flex items-center justify-center"
                    style={{ color: "#5C4810", border: "1px solid #5C4810", opacity: locked ? 0.4 : 1 }}
                    title="清空">
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)}
                    onBlur={onBlur} disabled={locked}
                    placeholder="例如：今日清晨大雨，多人請假；下午練習改為室內陸操..."
                    className="w-full px-2 py-1.5 rounded text-sm resize-none"
                    style={{
                      border: "1px solid #5C4810", background: "var(--panel)", color: "var(--ink)",
                      minHeight: 60,
                    }} />
        </div>
      </div>
    </section>
  );
}

// ============ DAILY VIEW ============
function DailyView({ selectedDate, setSelectedDate, attendance, setTab, setPeriod, screenshotMode, setScreenshotMode,
                    Y, M, MONTH_DAYS, TRAINING_DAYS, isAdmin, deletedPersons }) {
  const { roster: currentRoster } = useRoster();
  // 歷史月份自動納入「該月還在隊、之後才畢業」的成員（僅管理員拿得到 deletedPersons）
  const roster = useMemo(
    () => withGraduated(currentRoster, deletedPersons, Y, M),
    [currentRoster, deletedPersons, Y, M]
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [groupBy, setGroupBy] = useState("grade");
  const navDate = (delta) => {
    const idx = TRAINING_DAYS.findIndex(d => d.dateStr === selectedDate);
    if (idx === -1) return;
    const ni = (idx + delta + TRAINING_DAYS.length) % TRAINING_DAYS.length;
    setSelectedDate(TRAINING_DAYS[ni].dateStr);
  };
  const dateInfo = getDateInfo(selectedDate);
  const amAtt = attendance[selectedDate]?.am || {};
  const pmAtt = attendance[selectedDate]?.pm || {};

  const computeStatus = (sch, actual) => {
    if (sch && actual === "present") return "on_time";
    if (sch && actual === "absent") return "no_show";
    if (!sch && actual === "present") return "bonus";
    if (!sch && actual === "absent") return "confirmed_excused";
    if (sch && !actual) return "pending";
    return "pending_excused";
  };

  const amLate = attendance[selectedDate]?.am_late || {};
  const pmLate = attendance[selectedDate]?.pm_late || {};
  const amNotes = attendance[selectedDate]?.am_notes || {};
  const pmNotes = attendance[selectedDate]?.pm_notes || {};
  const dayNote = attendance[selectedDate]?.notes || "";

  const rows = roster.map(p => {
    const amSch = getSch(attendance, selectedDate, p, dateInfo.amIdx);
    const pmSch = getSch(attendance, selectedDate, p, dateInfo.pmIdx);
    const amStatus = computeStatus(amSch, amAtt[p.seq]);
    const pmStatus = computeStatus(pmSch, pmAtt[p.seq]);
    return {
      ...p, amSch, pmSch, amStatus, pmStatus,
      amActual: amAtt[p.seq], pmActual: pmAtt[p.seq],
      amLate: !!amLate[p.seq], pmLate: !!pmLate[p.seq],
      amNote: amNotes[p.seq] || "", pmNote: pmNotes[p.seq] || "",
    };
  });

  const cnt = (sel) => rows.filter(sel).length;
  const amStats = {
    sch: cnt(r => r.amSch),
    on: cnt(r => r.amStatus === "on_time"),
    no: cnt(r => r.amStatus === "no_show"),
    pn: cnt(r => r.amStatus === "pending"),
    bn: cnt(r => r.amStatus === "bonus"),
  };
  const pmStats = {
    sch: cnt(r => r.pmSch),
    on: cnt(r => r.pmStatus === "on_time"),
    no: cnt(r => r.pmStatus === "no_show"),
    pn: cnt(r => r.pmStatus === "pending"),
    bn: cnt(r => r.pmStatus === "bonus"),
  };

  const exportDay = () => {
    const csvSafe = (s) => `"${(s || "").replace(/"/g, '""')}"`;
    const amV = getVenue(attendance, selectedDate, "am");
    const pmV = getVenue(attendance, selectedDate, "pm");
    const lines = [
      [`場地：早訓 ${VENUES[amV].label}${VENUES[amV].fee > 0 ? `($${VENUES[amV].fee})` : ""} · 午訓 ${VENUES[pmV].label}${VENUES[pmV].fee > 0 ? `($${VENUES[pmV].fee})` : ""}`].join(","),
      ["序號","班級","座號","姓名","年級","早訓表定","早訓實際","早訓遲到","早訓備註","午訓表定","午訓實際","午訓遲到","午訓備註","應收費用"].join(",")
    ];
    rows.forEach(r => {
      let dayFee = 0;
      if (amV === "yongyun" && (r.amActual === "present")) dayFee += VENUE_FEE;
      if (pmV === "yongyun" && (r.pmActual === "present")) dayFee += VENUE_FEE;
      lines.push([
        r.seq, r.cls, r.num, r.name, GRADE_NAMES[r.grade],
        r.amSch ? "出席" : "不出席",
        r.amActual === "present" ? "出席" : r.amActual === "absent" ? "未到" : "未點名",
        r.amLate ? "是" : "",
        csvSafe(r.amNote),
        r.pmSch ? "出席" : "不出席",
        r.pmActual === "present" ? "出席" : r.pmActual === "absent" ? "未到" : "未點名",
        r.pmLate ? "是" : "",
        csvSafe(r.pmNote),
        dayFee > 0 ? `$${dayFee}` : "",
      ].join(","));
    });
    if (dayNote) {
      lines.push("");
      lines.push(`整日備註,${csvSafe(dayNote)}`);
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `每日總覽_${selectedDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const goCallSession = (per) => { setPeriod(per); setTab("rollcall"); };

  let groupedSections = [];
  if (groupBy === "grade") {
    groupedSections = [9, 8, 7].map(g => ({
      label: GRADE_NAMES[g],
      color: "var(--ink)",
      members: rows.filter(r => r.grade === g),
    })).filter(g => g.members.length > 0);
  } else {
    const buckets = {
      no_show:  { label: "缺席",     color: "var(--red)",   members: [] },
      pending:  { label: "待點名",   color: "var(--amber)", members: [] },
      bonus:    { label: "補訓出席", color: "var(--blue)",  members: [] },
      on_time:  { label: "已出席",   color: "var(--green)", members: [] },
      excused:  { label: "已請假",   color: "var(--mute)",  members: [] },
    };
    rows.forEach(m => {
      if (m.amStatus === "no_show" || m.pmStatus === "no_show") buckets.no_show.members.push(m);
      else if (m.amStatus === "pending" || m.pmStatus === "pending") buckets.pending.members.push(m);
      else if (m.amStatus === "bonus" || m.pmStatus === "bonus") buckets.bonus.members.push(m);
      else if (m.amStatus === "on_time" || m.pmStatus === "on_time") buckets.on_time.members.push(m);
      else buckets.excused.members.push(m);
    });
    groupedSections = Object.values(buckets).filter(b => b.members.length > 0);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl p-4 sm:p-5 border-2"
               style={{ background: "var(--panel)", borderColor: "var(--ink)" }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="text-[10px] sm:text-xs tk-x" style={{ color: "var(--mute)" }}>
            DAILY · 每日總覽
          </div>
          <div className="flex gap-2">
            <button onClick={() => {
                      const today = toDateStr(new Date());
                      setSelectedDate(today);
                      setShowCalendar(false);
                    }}
                    className="btn-tactile flex items-center gap-1 text-[10px] sm:text-xs px-2.5 py-1 rounded-md border"
                    style={{
                      borderColor: "var(--accent)",
                      background: "var(--accent-bg)",
                      color: "var(--accent)",
                    }}
                    title="跳到今天">
              <RotateCcw size={11} strokeWidth={2.5} />
              回今天
            </button>
            {isAdmin && (
              <button onClick={exportDay}
                      className="btn-tactile flex items-center gap-1 text-[10px] sm:text-xs px-2.5 py-1 rounded-md border"
                      style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
                <Download size={12} strokeWidth={2.5} />
                匯出當日
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navDate(-1)}
                  className="btn-tactile w-10 h-10 sm:w-11 sm:h-11 rounded-lg border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <button onClick={() => setShowCalendar(s => !s)}
                  className="btn-tactile flex-1 text-center px-2 py-2 rounded-lg border-2"
                  style={{
                    background: showCalendar ? "var(--ink)" : "var(--panel-2)",
                    borderColor: showCalendar ? "var(--ink)" : "var(--line)",
                  }}
                  title="點此切換月份/年份">
            <div className="display-cn text-xl sm:text-3xl leading-tight"
                 style={{ color: showCalendar ? "var(--bg)" : "var(--ink)" }}>
              {selectedDate.split("-").join(" / ")}
            </div>
            <div className="num text-sm sm:text-base font-medium"
                 style={{ color: showCalendar ? "rgba(255,252,246,0.85)" : "var(--ink-2)" }}>
              {dateInfo.dayLabel}
            </div>
          </button>
          <button onClick={() => navDate(1)}
                  className="btn-tactile w-10 h-10 sm:w-11 sm:h-11 rounded-lg border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="text-center text-[11px] mt-1.5" style={{ color: "var(--mute)" }}>
          {showCalendar ? "點下方月曆選日期" : "點上方日期可切換月份／年份"}
        </div>
        {showCalendar && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--line)" }}>
            <DatePicker selectedDate={selectedDate}
                        onPick={(ds) => { setSelectedDate(ds); setShowCalendar(false); }}
                        attendance={attendance} />
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DaySessionSummary label="早訓" Ic={Sun} stats={amStats}
                           venue={getVenue(attendance, selectedDate, "am")}
                           onClick={() => goCallSession("am")} />
        <DaySessionSummary label="午訓" Ic={Moon} stats={pmStats}
                           venue={getVenue(attendance, selectedDate, "pm")}
                           onClick={() => goCallSession("pm")} />
      </section>

      {/* 整日備註展示（如果有） */}
      {dayNote && (
        <section className="rounded-xl p-3 sm:p-4 border-2"
                 style={{ background: "var(--amber-bg)", borderColor: "var(--amber)" }}>
          <div className="flex items-start gap-2">
            <span style={{ fontSize: 14, marginTop: 2 }}>📝</span>
            <div className="flex-1">
              <div className="text-[10px] tk-l mb-1" style={{ color: "#5C4810" }}>
                當日整體備註
              </div>
              <div className="text-sm" style={{ color: "#5C4810", whiteSpace: "pre-wrap" }}>
                {dayNote}
              </div>
            </div>
          </div>
        </section>
      )}

      <button onClick={() => setScreenshotMode(true)}
              className="btn-tactile w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium"
              style={{ borderColor: "var(--accent)", background: "var(--accent)", color: "#fff" }}>
        <Camera size={18} strokeWidth={2.5} />
        進入截圖模式　·　傳給老師
      </button>

      <section className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[10px] sm:text-xs tk-l" style={{ color: "var(--mute)" }}>
          全員一覽 · {roster.length} 人
        </div>
        <div className="flex gap-1">
          {[
            { k: "grade", l: "依年級" },
            { k: "status", l: "依出席狀況" },
          ].map(g => {
            const active = groupBy === g.k;
            return (
              <button key={g.k} onClick={() => setGroupBy(g.k)}
                      className="btn-tactile text-xs px-3 py-1.5 rounded-full border"
                      style={{
                        borderColor: active ? "var(--ink)" : "var(--line)",
                        background: active ? "var(--ink)" : "transparent",
                        color: active ? "var(--bg)" : "var(--ink-2)",
                      }}>
                {g.l}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl overflow-hidden border-2"
               style={{ borderColor: "var(--ink)" }}>
        <DailyTableHeader />
        {groupedSections.map((section, si) => (
          <div key={si}>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5"
                 style={{
                   background: "var(--panel-2)",
                   borderBottom: "1px solid var(--line)",
                   borderTop: si === 0 ? "none" : "2px solid var(--ink)",
                 }}>
              <div className="w-1 h-4" style={{ background: section.color }} />
              <span className="display-cn text-sm" style={{ color: section.color }}>
                {section.label}
              </span>
              <span className="num text-[10px]" style={{ color: "var(--mute)" }}>
                {section.members.length}
              </span>
            </div>
            {section.members.map(m => <DailyRow key={m.seq} m={m} />)}
          </div>
        ))}
      </section>
    </div>
  );
}

function DailyTableHeader() {
  return (
    <div className="grid items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5"
         style={{
           gridTemplateColumns: "32px 1fr minmax(85px,1fr) minmax(85px,1fr) 30px",
           background: "var(--ink)",
           color: "var(--bg)",
         }}>
      <span className="text-[10px] tk-l">序號</span>
      <span className="text-[10px] tk-l">姓名 / 班-號</span>
      <span className="text-[10px] tk-l text-center flex items-center justify-center gap-1">
        <Sun size={11} strokeWidth={2.5} />早訓
      </span>
      <span className="text-[10px] tk-l text-center flex items-center justify-center gap-1">
        <Moon size={11} strokeWidth={2.5} />午訓
      </span>
      <span className="text-[10px] tk-l text-center" title="備註">📝</span>
    </div>
  );
}

function DaySessionSummary({ label, Ic, stats, onClick, venue }) {
  const rate = stats.sch === 0 ? 0 : Math.round(stats.on / stats.sch * 100);
  const venueObj = venue ? VENUES[venue] : null;
  const isClosed = venue === "closed";
  return (
    <button onClick={onClick}
            className="btn-tactile rounded-2xl p-4 sm:p-5 border-2 text-left"
            style={{
              background: isClosed ? VENUES.closed.bg : "var(--panel)",
              borderColor: isClosed ? VENUES.closed.color : "var(--line-strong)",
              opacity: isClosed ? 0.85 : 1,
            }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Ic size={18} strokeWidth={2.5} style={{ color: isClosed ? VENUES.closed.color : "var(--ink-2)" }} />
          <span className="display-cn text-lg" style={{ color: isClosed ? VENUES.closed.color : "var(--ink)" }}>{label}</span>
          {venueObj && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: venueObj.bg, color: venueObj.color }}>
              {isClosed ? "🚫" : "📍"}{venueObj.label}
              {venueObj.fee > 0 && <span className="ml-1">${venueObj.fee}</span>}
            </span>
          )}
        </div>
        <span className="text-[10px] tk-l" style={{ color: isClosed ? VENUES.closed.color : "var(--mute)", opacity: 0.8 }}>
          {isClosed ? "本場停練" : "點此前往點名 →"}
        </span>
      </div>
      {isClosed ? (
        <div className="text-sm" style={{ color: VENUES.closed.color, opacity: 0.7 }}>
          行事曆排定，無需點名
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="num text-3xl sm:text-4xl font-bold" style={{ color: "var(--green)" }}>{stats.on}</span>
            <span className="num text-sm" style={{ color: "var(--mute)" }}>／ {stats.sch}</span>
            <span className="text-xs ml-1" style={{ color: "var(--mute)" }}>實到 / 表定</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(0,0,0,0.06)" }}>
            <div className="h-full" style={{ width: `${rate}%`, background: "var(--green)", transition: "width 0.3s" }} />
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-xs">
            <span className="num">出席率 {rate}%</span>
            <span style={{ color: "var(--mute)" }}>·</span>
            <span style={{ color: "var(--red)" }}>缺席 {stats.no}</span>
            <span style={{ color: "var(--mute)" }}>·</span>
            <span style={{ color: "var(--amber)" }}>待點 {stats.pn}</span>
            {stats.bn > 0 && (<>
              <span style={{ color: "var(--mute)" }}>·</span>
              <span style={{ color: "var(--blue)" }}>補訓 {stats.bn}</span>
            </>)}
          </div>
        </>
      )}
    </button>
  );
}

function DailyRow({ m }) {
  const [showNote, setShowNote] = useState(false);

  const renderCell = (status, late) => {
    let txt = "—", bg = "var(--panel-2)", fg = "var(--mute)";
    if (status === "on_time") { txt = late ? "✓ 出席🕐" : "✓ 出席"; bg = late ? "#E07B30" : "var(--green)"; fg = "#fff"; }
    else if (status === "no_show") { txt = "✗ 未到"; bg = "var(--red)"; fg = "#fff"; }
    else if (status === "pending") { txt = "● 待點"; bg = "var(--amber-bg)"; fg = "#5C4810"; }
    else if (status === "bonus") { txt = late ? "+ 補訓🕐" : "+ 補訓"; bg = late ? "#E07B30" : "var(--blue)"; fg = "#fff"; }
    else if (status === "confirmed_excused") { txt = "○ 請假"; bg = "var(--panel-2)"; fg = "var(--ink-2)"; }
    else if (status === "pending_excused") { txt = "○ 請假"; bg = "transparent"; fg = "var(--mute)"; }
    return (
      <div className="px-2 py-1.5 rounded-md text-center text-xs sm:text-sm font-medium whitespace-nowrap"
           style={{ background: bg, color: fg }}>
        {txt}
      </div>
    );
  };

  const allExcused = !m.amSch && !m.pmSch;
  // 但如果這天有任何補訓出席（bonus），不要淡色
  const hasAnyPresent = m.amStatus === "on_time" || m.amStatus === "bonus" ||
                        m.pmStatus === "on_time" || m.pmStatus === "bonus";
  const dim = (allExcused && !hasAnyPresent) ? 0.55 : 1;
  const hasNote = !!(m.amNote || m.pmNote);

  return (
    <div style={{ borderBottom: "1px solid var(--line)" }}>
      <div className="grid items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2"
           style={{
             gridTemplateColumns: "32px 1fr minmax(85px,1fr) minmax(85px,1fr) 30px",
             opacity: dim,
             background: "var(--panel)",
           }}>
        <span className="num text-[11px] sm:text-xs tabular-nums" style={{ color: "var(--mute)" }}>
          {pad(m.seq)}
        </span>
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-medium truncate" style={{ color: "var(--ink)" }}>
            {m.name}
          </div>
          <div className="num text-[10px]" style={{ color: "var(--mute)" }}>
            {m.cls}-{pad(m.num)}
          </div>
        </div>
        {renderCell(m.amStatus, m.amLate)}
        {renderCell(m.pmStatus, m.pmLate)}
        {hasNote ? (
          <button onClick={() => setShowNote(s => !s)}
                  className="btn-tactile w-7 h-7 rounded flex items-center justify-center"
                  style={{ background: showNote ? "var(--amber)" : "var(--amber-bg)", color: "#5C4810", border: "1px solid var(--amber)" }}
                  title="點擊查看備註">
            📝
          </button>
        ) : <span />}
      </div>
      {showNote && hasNote && (
        <div className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs"
             style={{ background: "var(--amber-bg)", borderTop: "1px solid var(--amber)" }}>
          {m.amNote && (
            <div className="flex gap-2" style={{ color: "#5C4810" }}>
              <span className="font-medium shrink-0">早訓備註：</span>
              <span>{m.amNote}</span>
            </div>
          )}
          {m.pmNote && (
            <div className="flex gap-2 mt-0.5" style={{ color: "#5C4810" }}>
              <span className="font-medium shrink-0">午訓備註：</span>
              <span>{m.pmNote}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ MONTHLY VIEW ============
function MonthlyView({ attendance, setSelectedDate, setTab, Y, M, TRAINING_DAYS, isAdmin, deletedPersons }) {
  const { roster: currentRoster } = useRoster();
  // 歷史月份自動納入「該月還在隊、之後才畢業」的成員（僅管理員拿得到 deletedPersons）
  const roster = useMemo(
    () => withGraduated(currentRoster, deletedPersons, Y, M),
    [currentRoster, deletedPersons, Y, M]
  );
  const graduatedCount = roster.length - currentRoster.length;
  const personStats = useMemo(() => roster.map(p => {
    let scheduled = 0, present = 0, absent = 0, bonus = 0, pending = 0, late = 0;
    let yyAm = 0, yyPm = 0; // 永運場次出席（早/午）
    let soloAm = 0, soloPm = 0; // 個練場次（早/午）
    let yyAmPaid = 0, yyPmPaid = 0; // 應收場次（排除整天個練日）
    const matrix = TRAINING_DAYS.map(day => {
      const dayData = attendance[day.dateStr] || {};
      const amVenue = getVenue(attendance, day.dateStr, "am");
      const pmVenue = getVenue(attendance, day.dateStr, "pm");
      const dayHasSolo = !!(dayData.am_solo?.[p.seq] || dayData.pm_solo?.[p.seq]);
      const am = (() => {
        const sch = getSch(attendance, day.dateStr, p, day.info.amIdx);
        const ac = dayData.am?.[p.seq];
        const isLate = !!dayData.am_late?.[p.seq];
        const isSolo = !!dayData.am_solo?.[p.seq];
        if (sch) scheduled++;
        if (sch && ac === "present") {
          present++; if (isLate) late++;
          if (amVenue === "yongyun") {
            yyAm++;
            if (isSolo) soloAm++;
            if (!dayHasSolo) yyAmPaid++;
          }
          return "on_time";
        }
        if (sch && ac === "absent") { absent++; return "no_show"; }
        if (sch && !ac) { pending++; return "pending"; }
        if (!sch && ac === "present") {
          bonus++; if (isLate) late++;
          if (amVenue === "yongyun") {
            yyAm++;
            if (isSolo) soloAm++;
            if (!dayHasSolo) yyAmPaid++;
          }
          return "bonus";
        }
        if (!sch && ac === "absent") return "confirmed_excused";
        return "off";
      })();
      const pm = (() => {
        const sch = getSch(attendance, day.dateStr, p, day.info.pmIdx);
        const ac = dayData.pm?.[p.seq];
        const isLate = !!dayData.pm_late?.[p.seq];
        const isSolo = !!dayData.pm_solo?.[p.seq];
        if (sch) scheduled++;
        if (sch && ac === "present") {
          present++; if (isLate) late++;
          if (pmVenue === "yongyun") {
            yyPm++;
            if (isSolo) soloPm++;
            if (!dayHasSolo) yyPmPaid++;
          }
          return "on_time";
        }
        if (sch && ac === "absent") { absent++; return "no_show"; }
        if (sch && !ac) { pending++; return "pending"; }
        if (!sch && ac === "present") {
          bonus++; if (isLate) late++;
          if (pmVenue === "yongyun") {
            yyPm++;
            if (isSolo) soloPm++;
            if (!dayHasSolo) yyPmPaid++;
          }
          return "bonus";
        }
        if (!sch && ac === "absent") return "confirmed_excused";
        return "off";
      })();
      return { day, am, pm };
    });
    const rate = scheduled === 0 ? 0 : present / scheduled;
    const yyTotal = yyAm + yyPm;
    const yyPaid = yyAmPaid + yyPmPaid;
    const soloTotal = soloAm + soloPm;
    const yyFee = yyPaid * VENUE_FEE;
    return {
      ...p, scheduled, present, absent, bonus, pending, late, rate, matrix,
      yyAm, yyPm, yyTotal, yyFee,
      soloAm, soloPm, soloTotal,
      yyAmPaid, yyPmPaid, yyPaid,
    };
  }), [attendance, roster, TRAINING_DAYS]);

  // 永運場次統計（共幾次永運訓練、總費用）
  const yyStats = useMemo(() => {
    let yyAmSessions = 0, yyPmSessions = 0;
    TRAINING_DAYS.forEach(day => {
      if (getVenue(attendance, day.dateStr, "am") === "yongyun") yyAmSessions++;
      if (getVenue(attendance, day.dateStr, "pm") === "yongyun") yyPmSessions++;
    });
    const totalFee = personStats.reduce((acc, s) => acc + s.yyFee, 0);
    const totalAttendees = personStats.reduce((acc, s) => acc + s.yyPaid, 0);
    const paidPeople = personStats.filter(s => s.yyPaid > 0).length;
    const soloAttendees = personStats.reduce((acc, s) => acc + s.soloTotal, 0);
    const soloPeople = personStats.filter(s => s.soloTotal > 0).length;
    return { yyAmSessions, yyPmSessions, totalFee, totalAttendees, paidPeople, soloAttendees, soloPeople };
  }, [personStats, attendance, TRAINING_DAYS]);

  const team = personStats.reduce((acc, s) => ({
    scheduled: acc.scheduled + s.scheduled,
    present: acc.present + s.present,
    absent: acc.absent + s.absent,
    bonus: acc.bonus + s.bonus,
    pending: acc.pending + s.pending,
  }), { scheduled: 0, present: 0, absent: 0, bonus: 0, pending: 0 });
  const teamRate = team.scheduled === 0 ? 0 : Math.round(team.present / team.scheduled * 100);

  const sortedByRate = [...personStats]
    .filter(s => s.scheduled > 0 && (s.present + s.absent) > 0)
    .sort((a, b) => b.rate - a.rate || b.present - a.present);
  const topRate = sortedByRate.slice(0, 5);
  const mostAbsent = [...personStats].filter(s => s.absent > 0).sort((a, b) => b.absent - a.absent).slice(0, 5);

  const [sortBy, setSortBy] = useState("seq");
  const sortedRoster = useMemo(() => {
    const arr = [...personStats];
    if (sortBy === "rate") arr.sort((a, b) => b.rate - a.rate);
    else if (sortBy === "absent") arr.sort((a, b) => b.absent - a.absent);
    else if (sortBy === "present") arr.sort((a, b) => b.present - a.present);
    else arr.sort((a, b) => a.seq - b.seq);
    return arr;
  }, [personStats, sortBy]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl p-4 sm:p-5 border-2"
               style={{ background: "var(--ink)", borderColor: "var(--ink)", color: "var(--bg)" }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex-1">
            <div className="text-[10px] sm:text-xs tk-x" style={{ color: "rgba(255,252,246,0.6)" }}>
              MONTHLY OVERVIEW
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => {
                const { Y: nY, M: nM } = shiftMonth(Y, M, -1);
                setSelectedDate(`${nY}-${pad(nM + 1)}-01`);
              }}
                      className="btn-tactile w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: "rgba(255,252,246,0.12)",
                        color: "rgba(255,252,246,0.85)",
                      }}
                      title="上個月">
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
              <div className="display text-3xl sm:text-5xl">
                {MONTH_NAMES_EN[M]} <span style={{ color: "var(--accent)" }}>{Y}</span>
              </div>
              <button onClick={() => {
                const { Y: nY, M: nM } = shiftMonth(Y, M, 1);
                setSelectedDate(`${nY}-${pad(nM + 1)}-01`);
              }}
                      className="btn-tactile w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: "rgba(255,252,246,0.12)",
                        color: "rgba(255,252,246,0.85)",
                      }}
                      title="下個月">
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
              <button onClick={() => {
                const today = new Date();
                setSelectedDate(toDateStr(today));
              }}
                      className="btn-tactile px-2 sm:px-3 h-8 sm:h-10 rounded-lg flex items-center gap-1 text-[10px] sm:text-xs"
                      style={{
                        background: "rgba(255,252,246,0.08)",
                        color: "rgba(255,252,246,0.7)",
                      }}
                      title="回到本月">
                <RotateCcw size={12} strokeWidth={2.5} />
                <span className="hidden sm:inline">本月</span>
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tk-x" style={{ color: "rgba(255,252,246,0.6)" }}>TEAM RATE</div>
            <div className="num text-5xl sm:text-7xl font-bold" style={{ color: "var(--green-2)" }}>
              {teamRate}<span className="text-2xl sm:text-3xl opacity-70">%</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t"
             style={{ borderColor: "rgba(255,252,246,0.15)" }}>
          <MiniStat label="訓練日" v={TRAINING_DAYS.length} sub="天" />
          <MiniStat label="總時段" v={TRAINING_DAYS.length * 2} sub="場" />
          <MiniStat label="表定總人次" v={team.scheduled} sub="次" />
          <MiniStat label="實到總人次" v={team.present} sub="次" color="var(--green-2)" />
          <MiniStat label="缺席總人次" v={team.absent} sub="次" color="var(--red-2)" alert={team.absent > 0} />
        </div>
        {graduatedCount > 0 && (
          <div className="mt-2 text-[11px] px-2 py-1 rounded"
               style={{ background: "rgba(255,252,246,0.1)", color: "rgba(255,252,246,0.8)" }}>
            🎓 本月統計含 {graduatedCount} 位已畢業成員（當時仍在隊）
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <RankPanel title="出席率排行" Ic={Trophy} color="var(--green)" bg="var(--green-bg)"
                   list={topRate}
                   renderValue={(s) => `${Math.round(s.rate * 100)}%`}
                   renderSub={(s) => `${s.present}／${s.scheduled}`}
                   emptyText="尚無資料" />
        <RankPanel title="缺席提醒" Ic={AlertCircle} color="var(--red)" bg="var(--red-bg)"
                   list={mostAbsent}
                   renderValue={(s) => `${s.absent} 次`}
                   renderSub={(s) => `共 ${s.scheduled} 場表定`}
                   emptyText="本月尚無缺席紀錄" />
      </section>

      {/* 永運費用統計 */}
      <YongyunFeeSection
        Y={Y} M={M}
        yyStats={yyStats}
        personStats={personStats}
        TRAINING_DAYS={TRAINING_DAYS}
        attendance={attendance}
        isAdmin={isAdmin}
      />

      <section className="rounded-xl p-3 sm:p-4 border"
               style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <div className="flex items-center gap-3 flex-wrap text-[11px] sm:text-xs">
          <span className="tk-l" style={{ color: "var(--mute)" }}>圖例</span>
          <Legend color="var(--green)" label="出席" />
          <Legend color="var(--red)" label="缺席" />
          <Legend color="var(--amber)" label="待點名" />
          <Legend color="var(--blue)" label="補訓" />
          <Legend color="var(--line-strong)" label="已請假" />
          <Legend color="var(--line)" label="無訓練" />
        </div>
      </section>

      <section className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs tk-l mr-1" style={{ color: "var(--mute)" }}>排序</span>
        {[
          { k: "seq", l: "依序號" },
          { k: "rate", l: "出席率" },
          { k: "present", l: "出席次" },
          { k: "absent", l: "缺席次" },
        ].map(s => {
          const active = sortBy === s.k;
          return (
            <button key={s.k} onClick={() => setSortBy(s.k)}
                    className="btn-tactile text-xs px-3 py-1.5 rounded-full border"
                    style={{
                      borderColor: active ? "var(--ink)" : "var(--line)",
                      background: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--bg)" : "var(--ink-2)",
                    }}>
              {s.l}
            </button>
          );
        })}
      </section>

      <section className="space-y-2">
        {sortedRoster.map(s => (
          <PersonMonthRow key={s.seq} s={s}
                          onCellClick={(dateStr) => {
                            setSelectedDate(dateStr);
                            setTab("daily");
                          }} />
        ))}
      </section>
    </div>
  );
}

function YongyunFeeSection({ Y, M, yyStats, personStats, TRAINING_DAYS, attendance, isAdmin }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState(null);  // 點人名展開該人的場次明細
  // 應收名單：有應收費用的人（排除整月都個練的人）
  // 應收清單：所有隊員都列出（依名冊順序），沒永運費的顯示 0
  const paidList = useMemo(() =>
    [...personStats].sort((a, b) => a.seq - b.seq),
    [personStats]);
  // 個練名單：有個練場次的人（這個保持只列有的）
  const soloList = useMemo(() =>
    [...personStats].filter(s => s.soloTotal > 0).sort((a, b) => a.seq - b.seq),
    [personStats]);

  const exportFee = () => {
    const wb = XLSX.utils.book_new();

    // ========== Sheet 1: 應收費用清單（每場次明細） ==========
    // 收集本月所有永運場次的日期 + 早午（依時間順序）
    const yySessions = [];
    TRAINING_DAYS.forEach(day => {
      ["am", "pm"].forEach(per => {
        const venue = getVenue(attendance, day.dateStr, per);
        if (venue === "yongyun") {
          // 解析 dateStr 為 4/3 格式
          const [yyyy, mm, dd] = day.dateStr.split("-");
          const label = `${parseInt(mm)}/${parseInt(dd)}${per === "am" ? "早" : "午"}`;
          yySessions.push({
            dateStr: day.dateStr,
            per,
            label,
            idx: per === "am" ? day.info.amIdx : day.info.pmIdx,
          });
        }
      });
    });

    // 為每個人 × 每個場次計算狀態
    const list = paidList.map(s => {
      const row = {
        "序號": s.seq,
        "班級": s.cls,
        "座號": s.num,
        "姓名": s.name,
        "年級": GRADE_NAMES[s.grade],
      };
      yySessions.forEach(sess => {
        const dayData = attendance[sess.dateStr] || {};
        const slot = dayData[sess.per] || {};
        const ac = slot[s.seq];
        const dayHasSolo = !!(dayData.am_solo?.[s.seq] || dayData.pm_solo?.[s.seq]);
        // 計算費用顯示
        if (ac === "present") {
          row[sess.label] = dayHasSolo ? "個練" : `$${VENUE_FEE}`;
        } else {
          row[sess.label] = "─";
        }
      });
      row["應收場次"] = s.yyPaid;
      row["應收費用"] = `$${s.yyFee}`;
      return row;
    });

    // 加合計行
    const totalRow = {
      "序號": "",
      "班級": "",
      "座號": "",
      "姓名": "─ 合計 ─",
      "年級": "",
    };
    yySessions.forEach(sess => {
      // 計算這場次有多少人應收
      let cnt = 0;
      paidList.forEach(s => {
        const dayData = attendance[sess.dateStr] || {};
        const slot = dayData[sess.per] || {};
        const ac = slot[s.seq];
        const dayHasSolo = !!(dayData.am_solo?.[s.seq] || dayData.pm_solo?.[s.seq]);
        if (ac === "present" && !dayHasSolo) cnt++;
      });
      totalRow[sess.label] = `${cnt}人 $${cnt * VENUE_FEE}`;
    });
    totalRow["應收場次"] = paidList.reduce((a, s) => a + s.yyPaid, 0);
    totalRow["應收費用"] = `$${paidList.reduce((a, s) => a + s.yyFee, 0)}`;
    list.push(totalRow);

    const ws = XLSX.utils.json_to_sheet(list, { origin: "A6" });
    const headerColCount = 5 + yySessions.length + 2; // 5 基本 + N 場次 + 2 合計
    XLSX.utils.sheet_add_aoa(ws, [
      [`${Y} 年 ${M + 1} 月 永運費用統計（應收）`],
      [`本月永運場次：早訓 ${yyStats.yyAmSessions} 場 + 午訓 ${yyStats.yyPmSessions} 場 = 共 ${yyStats.yyAmSessions + yyStats.yyPmSessions} 場`],
      [`每場次費用：$${VENUE_FEE} / 人 / 次　·　個練免費（當日任一場勾個練 → 整天免費）`],
      [`應收人數：${yyStats.paidPeople} 人 · 應收人次：${yyStats.totalAttendees} · 應收費用：$${yyStats.totalFee}`],
      [],
    ], { origin: "A1" });
    ws["!cols"] = [
      { wch: 6 }, { wch: 8 }, { wch: 6 }, { wch: 12 }, { wch: 8 },
      ...yySessions.map(() => ({ wch: 8 })), // 每場次欄位寬度
      { wch: 10 }, { wch: 12 },
    ];
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headerColCount - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headerColCount - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: headerColCount - 1 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: headerColCount - 1 } },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "應收費用");

    // ========== Sheet 2: 個練名單（不計費） ==========
    if (soloList.length > 0) {
      const list2 = soloList.map(s => ({
        "序號": s.seq,
        "班級": s.cls,
        "座號": s.num,
        "姓名": s.name,
        "年級": GRADE_NAMES[s.grade],
        "永運早訓": s.yyAm,
        "永運午訓": s.yyPm,
        "永運總場": s.yyTotal,
        "個練早訓": s.soloAm,
        "個練午訓": s.soloPm,
        "個練總場": s.soloTotal,
        "應收費用": "$0（個練自費）",
      }));
      list2.push({
        "序號": "",
        "班級": "",
        "座號": "",
        "姓名": "─ 合計 ─",
        "年級": "",
        "永運早訓": list2.reduce((a, r) => a + r["永運早訓"], 0),
        "永運午訓": list2.reduce((a, r) => a + r["永運午訓"], 0),
        "永運總場": list2.reduce((a, r) => a + r["永運總場"], 0),
        "個練早訓": list2.reduce((a, r) => a + r["個練早訓"], 0),
        "個練午訓": list2.reduce((a, r) => a + r["個練午訓"], 0),
        "個練總場": list2.reduce((a, r) => a + r["個練總場"], 0),
        "應收費用": "",
      });
      const ws2 = XLSX.utils.json_to_sheet(list2, { origin: "A5" });
      XLSX.utils.sheet_add_aoa(ws2, [
        [`${Y} 年 ${M + 1} 月 個練名單（自費，不計入永運費）`],
        [`個練人數：${yyStats.soloPeople} 人 · 個練人次：${yyStats.soloAttendees}`],
        [`規則：當日任一場勾「個練」→ 整天永運免費`],
        [],
      ], { origin: "A1" });
      ws2["!cols"] = [
        { wch: 6 }, { wch: 8 }, { wch: 6 }, { wch: 12 }, { wch: 8 },
        { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 16 },
      ];
      ws2["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 11 } },
      ];
      XLSX.utils.book_append_sheet(wb, ws2, "個練名單");
    }

    XLSX.writeFile(wb, `永運費用_${Y}年${M + 1}月.xlsx`);
  };

  if (yyStats.yyAmSessions === 0 && yyStats.yyPmSessions === 0) {
    return (
      <section className="rounded-xl p-3 sm:p-4 border"
               style={{ background: VENUES.yongyun.bg, borderColor: VENUES.yongyun.color, opacity: 0.85 }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: VENUES.yongyun.color }}>
          <span>📍</span>
          <span className="font-medium">{Y} 年 {M + 1} 月本月尚無永運場次</span>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border-2 overflow-hidden"
             style={{ background: VENUES.yongyun.bg, borderColor: VENUES.yongyun.color }}>
      <div className="p-3 sm:p-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[10px] tk-l mb-1" style={{ color: VENUES.yongyun.color, opacity: 0.7 }}>
            YONGYUN FEE · 永運費用統計
          </div>
          <div className="display-cn text-lg sm:text-xl font-bold flex items-center gap-2"
               style={{ color: VENUES.yongyun.color }}>
            <span>💰</span>
            <span>{Y} 年 {M + 1} 月</span>
            <span className="num text-2xl sm:text-3xl">${yyStats.totalFee}</span>
          </div>
          <div className="text-[11px] sm:text-xs mt-0.5" style={{ color: VENUES.yongyun.color, opacity: 0.8 }}>
            應收 {yyStats.paidPeople} 人 · {yyStats.totalAttendees} 人次 ·
            早訓 {yyStats.yyAmSessions} 場 + 午訓 {yyStats.yyPmSessions} 場
            {yyStats.soloPeople > 0 && (
              <span style={{ marginLeft: 6, color: "#7C4DBC", fontWeight: 700 }}>
                · ⭐ 另 {yyStats.soloPeople} 人個練（自費）
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setExpanded(e => !e)}
                  className="btn-tactile flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border-2"
                  style={{ borderColor: VENUES.yongyun.color, color: VENUES.yongyun.color, background: "rgba(255,255,255,0.5)" }}>
            <span>{expanded ? "▾" : "▸"}</span>
            {expanded ? "收起明細" : "展開明細"}
          </button>
          {isAdmin && (
            <button onClick={exportFee}
                    className="btn-tactile flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ background: VENUES.yongyun.color, color: "#fff" }}>
              <Download size={12} strokeWidth={2.5} />
              匯出 Excel
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ background: "rgba(255,255,255,0.6)", borderTop: `1px solid ${VENUES.yongyun.color}` }}>
          {/* 應收費用清單 */}
          {paidList.length === 0 ? (
            <div className="p-4 text-center text-sm" style={{ color: VENUES.yongyun.color }}>
              尚無應收費用紀錄
            </div>
          ) : (
            <>
              <div className="px-3 sm:px-4 py-2 text-[10px] tk-l flex items-center gap-2 flex-wrap"
                   style={{ background: "rgba(168, 85, 24, 0.1)", color: VENUES.yongyun.color, fontWeight: 700 }}>
                <span>■ 應收費用清單</span>
                <span style={{ fontWeight: 500, fontSize: "10px", letterSpacing: "0.02em", opacity: 0.85 }}>
                  （詳細場次請下載 Excel）
                </span>
              </div>
              <div className="grid items-center gap-2 px-3 sm:px-4 py-2 text-[10px] tk-l"
                   style={{ background: VENUES.yongyun.color, color: "#fff",
                            gridTemplateColumns: "32px 1fr 50px 50px 60px 70px" }}>
                <span>序號</span>
                <span>姓名</span>
                <span className="text-center">早</span>
                <span className="text-center">午</span>
                <span className="text-center">應收場</span>
                <span className="text-right">費用</span>
              </div>
              {paidList.map(s => {
                const noFee = s.yyPaid === 0;
                const isExpanded = expandedPerson === s.seq;
                return (
                  <div key={s.seq}>
                    <div onClick={() => !noFee && setExpandedPerson(isExpanded ? null : s.seq)}
                         className="grid items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm"
                         style={{
                           gridTemplateColumns: "32px 1fr 50px 50px 60px 70px",
                           borderBottom: "1px solid rgba(168, 85, 24, 0.15)",
                           opacity: noFee ? 0.45 : 1,
                           cursor: noFee ? "default" : "pointer",
                           background: isExpanded ? "rgba(168, 85, 24, 0.08)" : "transparent",
                           transition: "background 0.15s",
                         }}>
                      <span className="num text-[11px]" style={{ color: VENUES.yongyun.color, opacity: 0.7 }}>
                        {pad(s.seq)}
                      </span>
                      <div className="min-w-0 flex items-center gap-1">
                        {!noFee && (
                          <span style={{ color: VENUES.yongyun.color, fontSize: 10, opacity: 0.7 }}>
                            {isExpanded ? "▾" : "▸"}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate" style={{ color: "var(--ink)" }}>{s.name}</div>
                          <div className="num text-[10px]" style={{ color: VENUES.yongyun.color, opacity: 0.7 }}>
                            {s.cls}-{pad(s.num)}
                          </div>
                        </div>
                      </div>
                      <span className="num text-center" style={{ color: "var(--ink-2)" }}>{s.yyAmPaid}</span>
                      <span className="num text-center" style={{ color: "var(--ink-2)" }}>{s.yyPmPaid}</span>
                      <span className="num text-center font-bold" style={{ color: VENUES.yongyun.color }}>
                        {s.yyPaid}
                      </span>
                      <span className="num text-right font-bold" style={{ color: VENUES.yongyun.color }}>
                        ${s.yyFee}
                      </span>
                    </div>
                    {/* 展開的場次明細 */}
                    {isExpanded && !noFee && (
                      <div className="px-3 sm:px-4 py-3"
                           style={{
                             background: "rgba(168, 85, 24, 0.05)",
                             borderBottom: `1px solid ${VENUES.yongyun.color}`,
                           }}>
                        <div className="text-[10px] tk-l mb-2" style={{ color: VENUES.yongyun.color, fontWeight: 700 }}>
                          {s.name} · {s.yyPaid} 場應收 · ${s.yyFee}
                        </div>
                        <div className="space-y-1">
                          {(() => {
                            // 收集這個人所有的永運出席場次
                            const sessions = [];
                            TRAINING_DAYS.forEach(day => {
                              const dayData = attendance[day.dateStr] || {};
                              const dayHasSolo = !!(dayData.am_solo?.[s.seq] || dayData.pm_solo?.[s.seq]);
                              ["am", "pm"].forEach(per => {
                                const venue = getVenue(attendance, day.dateStr, per);
                                if (venue !== "yongyun") return;
                                const ac = dayData[per]?.[s.seq];
                                if (ac !== "present") return;
                                const isSolo = !!(per === "am" ? dayData.am_solo?.[s.seq] : dayData.pm_solo?.[s.seq]);
                                const [yyyy, mm, dd] = day.dateStr.split("-");
                                const dt = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
                                const dowName = ["日", "一", "二", "三", "四", "五", "六"][dt.getDay()];
                                sessions.push({
                                  dateStr: day.dateStr,
                                  label: `${parseInt(mm)}/${parseInt(dd)}（${dowName}）`,
                                  per,
                                  perLabel: per === "am" ? "早" : "午",
                                  fee: dayHasSolo ? 0 : VENUE_FEE,
                                  isSolo: dayHasSolo,
                                });
                              });
                            });
                            if (sessions.length === 0) {
                              return (
                                <div className="text-[11px] italic" style={{ color: VENUES.yongyun.color, opacity: 0.6 }}>
                                  無應收場次
                                </div>
                              );
                            }
                            return sessions.map((sess, i) => (
                              <div key={i} className="flex items-center gap-2 text-[11px] sm:text-xs px-2 py-1 rounded"
                                   style={{ background: "rgba(255,255,255,0.6)" }}>
                                <span className="num" style={{ color: "var(--ink-2)", minWidth: 70 }}>
                                  {sess.label}
                                </span>
                                <span className="font-medium" style={{
                                  color: sess.per === "am" ? "#E07B30" : "#7C4DBC",
                                  minWidth: 24,
                                }}>
                                  {sess.perLabel}
                                </span>
                                <span className="flex-1" />
                                {sess.isSolo ? (
                                  <span className="num text-[10px] px-1.5 py-0.5 rounded font-medium"
                                        style={{ background: "var(--purple-bg, #EFE4F8)", color: "#7C4DBC" }}>
                                    個練免費
                                  </span>
                                ) : (
                                  <span className="num font-bold" style={{ color: VENUES.yongyun.color }}>
                                    ${sess.fee}
                                  </span>
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex justify-between"
                   style={{ background: VENUES.yongyun.color, color: "#fff" }}>
                <span>應收合計</span>
                <span>{yyStats.paidPeople} 人 · {yyStats.totalAttendees} 人次 · ${yyStats.totalFee}</span>
              </div>
            </>
          )}

          {/* 個練名單區塊（紫色，獨立） */}
          {soloList.length > 0 && (
            <>
              <div className="px-3 sm:px-4 py-2 mt-2 text-[10px] tk-l flex items-center gap-2"
                   style={{ background: "rgba(124, 77, 188, 0.12)", color: "#7C4DBC", fontWeight: 700 }}>
                <span>⭐</span>
                <span>個練名單（自費，不計入永運費）</span>
              </div>
              <div className="grid items-center gap-2 px-3 sm:px-4 py-2 text-[10px] tk-l"
                   style={{ background: "#7C4DBC", color: "#fff",
                            gridTemplateColumns: "32px 1fr 50px 50px 60px 70px" }}>
                <span>序號</span>
                <span>姓名</span>
                <span className="text-center">永早</span>
                <span className="text-center">永午</span>
                <span className="text-center">個練數</span>
                <span className="text-right">費用</span>
              </div>
              {soloList.map(s => (
                <div key={s.seq} className="grid items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm"
                     style={{
                       gridTemplateColumns: "32px 1fr 50px 50px 60px 70px",
                       borderBottom: "1px solid rgba(124, 77, 188, 0.15)",
                       background: "rgba(124, 77, 188, 0.04)",
                     }}>
                  <span className="num text-[11px]" style={{ color: "#7C4DBC", opacity: 0.7 }}>
                    {pad(s.seq)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium truncate" style={{ color: "var(--ink)" }}>{s.name}</div>
                    <div className="num text-[10px]" style={{ color: "#7C4DBC", opacity: 0.7 }}>
                      {s.cls}-{pad(s.num)}
                    </div>
                  </div>
                  <span className="num text-center" style={{ color: "var(--ink-2)" }}>{s.yyAm}</span>
                  <span className="num text-center" style={{ color: "var(--ink-2)" }}>{s.yyPm}</span>
                  <span className="num text-center font-bold" style={{ color: "#7C4DBC" }}>
                    {s.soloTotal}
                  </span>
                  <span className="num text-right font-medium" style={{ color: "#7C4DBC" }}>$0</span>
                </div>
              ))}
              <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex justify-between"
                   style={{ background: "#7C4DBC", color: "#fff" }}>
                <span>個練合計</span>
                <span>{yyStats.soloPeople} 人 · {yyStats.soloAttendees} 人次（自費）</span>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function MiniStat({ label, v, sub, color, alert }) {
  return (
    <div className="relative">
      {alert && <span className="pulse-dot absolute -top-1 -right-1" />}
      <div className="text-[9px] sm:text-[10px] tk-x" style={{ color: "rgba(255,252,246,0.55)" }}>{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="num text-2xl sm:text-3xl font-bold"
              style={{ color: color || "var(--bg)" }}>{v}</span>
        <span className="num text-xs" style={{ color: "rgba(255,252,246,0.55)" }}>{sub}</span>
      </div>
    </div>
  );
}

function RankPanel({ title, Ic, color, bg, list, renderValue, renderSub, emptyText }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 border-2"
         style={{ background: bg, borderColor: color }}>
      <div className="flex items-center gap-2 mb-3">
        <Ic size={16} strokeWidth={2.5} style={{ color: color }} />
        <span className="display-cn text-base sm:text-lg" style={{ color: color }}>{title}</span>
      </div>
      {list.length === 0 ? (
        <div className="text-xs py-4 text-center" style={{ color: "var(--mute)" }}>
          {emptyText || "尚無紀錄"}
        </div>
      ) : (
        <div className="space-y-1.5">
          {list.map((s, i) => (
            <div key={s.seq} className="flex items-center gap-2">
              <span className="num text-xs font-bold w-5 text-center"
                    style={{ color: i < 3 ? color : "var(--mute)" }}>{i + 1}</span>
              <span className="font-medium text-sm flex-1 truncate" style={{ color: "var(--ink)" }}>
                {s.name}
              </span>
              <span className="num text-xs" style={{ color: "var(--mute)" }}>{renderSub(s)}</span>
              <span className="num text-sm font-bold tabular-nums" style={{ color: color, minWidth: 50, textAlign: "right" }}>
                {renderValue(s)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
      <span style={{ color: "var(--ink-2)" }}>{label}</span>
    </span>
  );
}

function PersonMonthRow({ s, onCellClick }) {
  const ratePct = Math.round(s.rate * 100);
  const cellColor = (st) => {
    if (st === "on_time") return "var(--green)";
    if (st === "no_show") return "var(--red)";
    if (st === "pending") return "var(--amber)";
    if (st === "bonus") return "var(--blue)";
    if (st === "confirmed_excused") return "var(--line-strong)";
    return "var(--line)";
  };

  return (
    <div className="rounded-xl p-3 sm:p-4 border"
         style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
      <div className="flex items-baseline gap-2 mb-2 flex-wrap">
        <span className="num text-[11px]" style={{ color: "var(--mute)" }}>{pad(s.seq)}</span>
        <span className="text-base sm:text-lg font-medium" style={{ color: "var(--ink)" }}>{s.name}</span>
        <span className="num text-[10px] sm:text-xs" style={{ color: "var(--mute)" }}>
          {s.cls}-{pad(s.num)} · {GRADE_NAMES[s.grade]}
        </span>
        <div className="flex-1" />
        <div className="flex items-baseline gap-1">
          <span className="num text-xl sm:text-2xl font-bold"
                style={{ color: ratePct >= 80 ? "var(--green)" : ratePct >= 60 ? "var(--amber)" : "var(--red)" }}>
            {ratePct}
          </span>
          <span className="num text-xs" style={{ color: "var(--mute)" }}>%</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-xs mb-2">
        <span><span style={{ color: "var(--mute)" }}>表定</span> <span className="num font-medium">{s.scheduled}</span></span>
        <span><span style={{ color: "var(--green)" }}>實到</span> <span className="num font-medium" style={{ color: "var(--green)" }}>{s.present}</span></span>
        {s.absent > 0 && <span><span style={{ color: "var(--red)" }}>缺席</span> <span className="num font-medium" style={{ color: "var(--red)" }}>{s.absent}</span></span>}
        {s.pending > 0 && <span><span style={{ color: "var(--amber)" }}>待點</span> <span className="num font-medium" style={{ color: "var(--amber)" }}>{s.pending}</span></span>}
        {s.bonus > 0 && <span><span style={{ color: "var(--blue)" }}>補訓</span> <span className="num font-medium" style={{ color: "var(--blue)" }}>{s.bonus}</span></span>}
        {s.late > 0 && <span><span style={{ color: "#E07B30" }}>遲到</span> <span className="num font-medium" style={{ color: "#E07B30" }}>{s.late}</span></span>}
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(0,0,0,0.06)" }}>
        <div className="h-full"
             style={{
               width: `${ratePct}%`,
               background: ratePct >= 80 ? "var(--green)" : ratePct >= 60 ? "var(--amber)" : "var(--red)",
               transition: "width 0.3s",
             }} />
      </div>

      <div className="scrollx -mx-1 px-1">
        <div className="flex gap-1" style={{ minWidth: "fit-content" }}>
          {s.matrix.map(({ day, am, pm }) => (
            <div key={day.dateStr} className="flex flex-col items-center gap-0.5">
              <button onClick={() => onCellClick(day.dateStr)}
                      className="heat-cell w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm"
                      style={{ background: cellColor(am) }}
                      title={`${day.dateStr} 早訓 - ${labelOf(am)}`} />
              <button onClick={() => onCellClick(day.dateStr)}
                      className="heat-cell w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm"
                      style={{ background: cellColor(pm) }}
                      title={`${day.dateStr} 午訓 - ${labelOf(pm)}`} />
              {(day.d === 1 || day.d % 5 === 0) ? (
                <span className="num text-[9px] mt-0.5" style={{ color: "var(--mute)" }}>{day.d}</span>
              ) : (
                <span className="text-[9px] mt-0.5">·</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function labelOf(st) {
  return ({
    on_time: "出席", no_show: "缺席", pending: "待點名",
    bonus: "補訓", confirmed_excused: "請假", off: "—",
  })[st] || "—";
}

// ============ STATS CARD ============
function StatCard({ tag, label, value, sub, color, bg, alert, ring }) {
  return (
    <div className="relative rounded-xl border-2 p-3 sm:p-4"
         style={{ borderColor: color, background: bg || "var(--panel)" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[9px] sm:text-[10px] tk-x num" style={{ color, opacity: 0.7 }}>{tag}</div>
        {alert && <span className="pulse-dot" />}
      </div>
      <div className="display-cn text-[10px] sm:text-xs" style={{ color, opacity: 0.8 }}>{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <div className="num text-3xl sm:text-5xl font-bold" style={{ color, lineHeight: 1 }}>{value}</div>
        <div className="num text-xs sm:text-sm" style={{ color, opacity: 0.6 }}>{sub}</div>
      </div>
      {typeof ring === "number" && (
        <div className="absolute right-3 bottom-3 h-1 w-12 rounded-full overflow-hidden"
             style={{ background: "rgba(0,0,0,0.08)" }}>
          <div className="h-full"
               style={{ width: `${Math.max(0, Math.min(100, ring))}%`, background: color, transition: "width 0.3s ease" }} />
        </div>
      )}
    </div>
  );
}

// ============ SCREENSHOT VIEW ============
function ScreenshotView({ selectedDate, attendance, onExit, onPrevDay, onNextDay }) {
  const { roster } = useRoster();
  const cardRef = useRef(null);  // ref 標記要截圖的卡片
  const [sharing, setSharing] = useState(false);
  const [shareHint, setShareHint] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);  // 分享成功 → 顯示打開 LINE 按鈕
  const dateInfo = getDateInfo(selectedDate);
  const amAtt = attendance[selectedDate]?.am || {};
  const pmAtt = attendance[selectedDate]?.pm || {};
  const amLate = attendance[selectedDate]?.am_late || {};
  const pmLate = attendance[selectedDate]?.pm_late || {};
  const amSolo = attendance[selectedDate]?.am_solo || {};
  const pmSolo = attendance[selectedDate]?.pm_solo || {};
  const amNotes = attendance[selectedDate]?.am_notes || {};
  const pmNotes = attendance[selectedDate]?.pm_notes || {};
  const dayNote = attendance[selectedDate]?.notes || "";
  const amVenue = getVenue(attendance, selectedDate, "am");
  const pmVenue = getVenue(attendance, selectedDate, "pm");
  const hasYongyun = amVenue === "yongyun" || pmVenue === "yongyun";

  const computeStatus = (sch, actual) => {
    if (sch && actual === "present") return "on_time";
    if (sch && actual === "absent") return "no_show";
    if (!sch && actual === "present") return "bonus";
    if (!sch && actual === "absent") return "confirmed_excused";
    if (sch && !actual) return "pending";
    return "pending_excused";
  };
  const rows = roster.map(p => {
    const amSch = getSch(attendance, selectedDate, p, dateInfo.amIdx);
    const pmSch = getSch(attendance, selectedDate, p, dateInfo.pmIdx);
    const dayHasSolo = !!(amSolo[p.seq] || pmSolo[p.seq]);
    return {
      ...p, amSch, pmSch,
      amStatus: computeStatus(amSch, amAtt[p.seq]),
      pmStatus: computeStatus(pmSch, pmAtt[p.seq]),
      amLate: !!amLate[p.seq],
      pmLate: !!pmLate[p.seq],
      amSolo: !!amSolo[p.seq],
      pmSolo: !!pmSolo[p.seq],
      dayHasSolo,
      amNote: amNotes[p.seq] || "",
      pmNote: pmNotes[p.seq] || "",
    };
  });
  const cnt = (sel) => rows.filter(sel).length;
  const amS = {
    sch: cnt(r => r.amSch), on: cnt(r => r.amStatus === "on_time"),
    no: cnt(r => r.amStatus === "no_show"), pn: cnt(r => r.amStatus === "pending"),
    bn: cnt(r => r.amStatus === "bonus"),
    late: cnt(r => r.amLate && (r.amStatus === "on_time" || r.amStatus === "bonus")),
  };
  const pmS = {
    sch: cnt(r => r.pmSch), on: cnt(r => r.pmStatus === "on_time"),
    no: cnt(r => r.pmStatus === "no_show"), pn: cnt(r => r.pmStatus === "pending"),
    bn: cnt(r => r.pmStatus === "bonus"),
    late: cnt(r => r.pmLate && (r.pmStatus === "on_time" || r.pmStatus === "bonus")),
  };
  const absentees = rows.filter(r => r.amStatus === "no_show" || r.pmStatus === "no_show");
  const pendingees = rows.filter(r => r.amStatus === "pending" || r.pmStatus === "pending");
  const latees = rows.filter(r =>
    (r.amLate && (r.amStatus === "on_time" || r.amStatus === "bonus")) ||
    (r.pmLate && (r.pmStatus === "on_time" || r.pmStatus === "bonus"))
  );
  // 個練名單：當日有勾任一場個練 + 當天有出席永運
  const soloees = rows.filter(r => r.dayHasSolo && hasYongyun &&
    (r.amStatus === "on_time" || r.amStatus === "bonus" ||
     r.pmStatus === "on_time" || r.pmStatus === "bonus")
  );
  const notedRows = rows.filter(r => r.amNote || r.pmNote);

  // 早/午分開的待點名
  const amPendingees = rows.filter(r => r.amStatus === "pending");
  const pmPendingees = rows.filter(r => r.pmStatus === "pending");
  // 場次是否「已開始點名」：只要有任何人被標 present/absent 就算
  const amStarted = rows.some(r =>
    r.amStatus === "on_time" || r.amStatus === "no_show" ||
    r.amStatus === "bonus" || r.amStatus === "confirmed_excused"
  );
  const pmStarted = rows.some(r =>
    r.pmStatus === "on_time" || r.pmStatus === "no_show" ||
    r.pmStatus === "bonus" || r.pmStatus === "confirmed_excused"
  );

  // Tiny status chip - 4 distinct outcomes (+ late variant)
  // sessionStarted: 該場次是否已有人被點名（沒開始時 pending 顯示 — 而非 ?）
  // 用 inline SVG 完全取代文字符號 — html2canvas 對 SVG path 處理穩定,不會跑位
  const Tiny = ({ status, late, sessionStarted = true }) => {
    const map = {
      on_time:           { shape: "check",  bg: "#1F5C3A", fg: "#fff", bd: "transparent" },
      no_show:           { shape: "x",      bg: "#B23A28", fg: "#fff", bd: "#7A1F0F" },
      pending:           { shape: "q",      bg: "#F6C53C", fg: "#3D2F00", bd: "transparent" },
      bonus:             { shape: "plus",   bg: "#2F4FA8", fg: "#fff", bd: "transparent" },
      confirmed_excused: { shape: "dash",   bg: "#EAE3D4", fg: "#8B8275", bd: "transparent" },
      pending_excused:   { shape: "dash",   bg: "#EAE3D4", fg: "#B7AC93", bd: "transparent" },
    };
    let s = map[status] || map.pending_excused;
    if (!sessionStarted && status === "pending") {
      s = { shape: "dot", bg: "#EAE3D4", fg: "#B7AC93", bd: "transparent" };
    }
    if (late && (status === "on_time" || status === "bonus")) {
      s = { shape: "clock", bg: "#E07B30", fg: "#fff", bd: "#A85518" };
    }
    // SVG 圖示（24x24 viewBox,顯示為 16x16）
    const renderShape = () => {
      const stroke = s.fg;
      const sw = 3;  // 粗筆畫,即使縮小也清楚
      switch (s.shape) {
        case "check":
          return <path d="M5 12 L10 17 L19 7" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
        case "x":
          return <><path d="M7 7 L17 17" stroke={stroke} strokeWidth={sw} strokeLinecap="round" /><path d="M17 7 L7 17" stroke={stroke} strokeWidth={sw} strokeLinecap="round" /></>;
        case "plus":
          return <><path d="M12 6 L12 18" stroke={stroke} strokeWidth={sw} strokeLinecap="round" /><path d="M6 12 L18 12" stroke={stroke} strokeWidth={sw} strokeLinecap="round" /></>;
        case "dash":
          return <path d="M6 12 L18 12" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />;
        case "dot":
          return <circle cx="12" cy="12" r="2" fill={stroke} />;
        case "q":
          // 問號用簡單兩段組成（避免字型問題）
          return <><path d="M9 9 Q9 6 12 6 Q15 6 15 9 Q15 11 12 12 L12 14" stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="17.5" r="1.3" fill={stroke} /></>;
        case "clock":
          return <><circle cx="12" cy="12" r="6.5" stroke={stroke} strokeWidth={sw - 0.5} fill="none" /><path d="M12 8.5 L12 12 L14.5 13.5" stroke={stroke} strokeWidth={sw - 0.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></>;
        default:
          return null;
      }
    };
    return (
      <span style={{
        display: "inline-block",
        width: 16, height: 16,
        background: s.bg,
        borderRadius: 3,
        border: `1px solid ${s.bd}`,
        boxSizing: "border-box",
        verticalAlign: "middle",
        lineHeight: 0,
      }}>
        <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg"
             style={{ display: "block", margin: "0 auto" }}>
          {renderShape()}
        </svg>
      </span>
    );
  };

  // Grade color bar
  const gradeBar = (g) => g === 9 ? "#D9543C" : g === 8 ? "#B8860B" : "#1F5C3A";

  // Split into 2 columns: 1-17 / 18-33
  const half = Math.ceil(rows.length / 2);
  const col1 = rows.slice(0, half);
  const col2 = rows.slice(half);

  const Row = ({ m }) => {
    const allExcused = !m.amSch && !m.pmSch;
    const hasNoShow = m.amStatus === "no_show" || m.pmStatus === "no_show";
    const hasBonus = m.amStatus === "bonus" || m.pmStatus === "bonus";
    const hasLate = (m.amLate && (m.amStatus === "on_time" || m.amStatus === "bonus")) ||
                    (m.pmLate && (m.pmStatus === "on_time" || m.pmStatus === "bonus"));
    // 補訓的人不應該淡色
    const hasAnyPresent = m.amStatus === "on_time" || m.amStatus === "bonus" ||
                          m.pmStatus === "on_time" || m.pmStatus === "bonus";
    const dim = (allExcused && !hasAnyPresent) ? 0.5 : 1;
    const hasNote = !!(m.amNote || m.pmNote);
    let rowBg = "transparent";
    if (hasNoShow) rowBg = "#FBEEEA";
    else if (hasLate) rowBg = "#FBF1E8";
    else if (hasBonus) rowBg = "#EEF1F8";
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "3px 18px 1fr 16px 16px",
        alignItems: "center", gap: 4,
        padding: "5px 6px",
        borderBottom: "1px solid #EAE3D4",
        opacity: dim,
        background: rowBg,
        // 遲到時用左邊橘條
        boxShadow: hasLate && !hasNoShow ? "inset 3px 0 0 #E07B30" : "none",
      }}>
        <span style={{ background: gradeBar(m.grade), height: 10, borderRadius: 1 }} />
        <span className="num" style={{ fontSize: 9, color: "#8B8275" }}>{pad(m.seq)}</span>
        <span style={{
          fontSize: 12, fontWeight: hasNoShow ? 700 : 500,
          color: hasNoShow ? "#7A1F0F" : "#141210",
          whiteSpace: "nowrap",
          minWidth: 0,
          lineHeight: 1.6,
          paddingBottom: 2,
          display: "inline-block",
        }}>
          {m.name}
          {hasNote && (
            <span style={{ marginLeft: 3, fontSize: 9 }} title="有備註">📝</span>
          )}
        </span>
        <Tiny status={m.amStatus} late={m.amLate} sessionStarted={amStarted} />
        <Tiny status={m.pmStatus} late={m.pmLate} sessionStarted={pmStarted} />
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Floating controls (won't be in screenshot if cropped) */}
      <div className="sticky top-2 z-50 flex justify-end px-3 py-2"
           style={{ pointerEvents: "none" }}>
        <div className="flex gap-2 flex-wrap" style={{ pointerEvents: "auto" }}>
          <button onClick={onPrevDay}
                  className="btn-tactile w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-md"
                  style={{ background: "#fff", borderColor: "#1A3D4D", color: "#1A3D4D" }}>
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
          <button onClick={onNextDay}
                  className="btn-tactile w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-md"
                  style={{ background: "#fff", borderColor: "#1A3D4D", color: "#1A3D4D" }}>
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
          <button onClick={async () => {
            if (sharing) return;
            setSharing(true);
            setShareHint("");
            try {
              // 動態載入 html2canvas (CDN)
              if (typeof window.html2canvas === "undefined") {
                await new Promise((resolve, reject) => {
                  const s = document.createElement("script");
                  s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
                  s.onload = resolve;
                  s.onerror = reject;
                  document.head.appendChild(s);
                });
              }
              // 截圖卡片
              if (!cardRef.current) {
                throw new Error("找不到截圖元件");
              }
              // 等字型載入完（避免文字跑版）
              if (document.fonts && document.fonts.ready) {
                try { await document.fonts.ready; } catch {}
              }
              // 強制取得卡片實際寬度，固定 viewport 寬度避免 flex/grid 跑掉
              const cardW = cardRef.current.offsetWidth;
              const canvas = await window.html2canvas(cardRef.current, {
                backgroundColor: "#FFFCF6",
                scale: 2,  // 高解析度
                useCORS: true,
                logging: false,
                width: cardW,
                windowWidth: cardW,
                // 避免 transform 干擾
                foreignObjectRendering: false,
              });
              // 轉成 Blob
              const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
              if (!blob) throw new Error("產生圖片失敗");

              const [yyyy, mm, dd] = selectedDate.split("-");
              const filename = `龍門泳隊_${yyyy}${mm}${dd}.png`;
              const file = new File([blob], filename, { type: "image/png" });

              // 嘗試 Web Share API（手機可選 LINE）
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                  await navigator.share({
                    files: [file],
                    title: `龍門泳隊 ${yyyy}/${mm}/${dd}`,
                  });
                  setShareHint("✓ 分享完成");
                  setShareSuccess(true);
                  setTimeout(() => { setShareHint(""); setShareSuccess(false); }, 8000);
                  return;
                } catch (e) {
                  // 使用者取消 → 不顯示錯誤
                  if (e.name === "AbortError") {
                    setShareHint("");
                    return;
                  }
                  // 其他錯誤 → 改下載
                  console.warn("Web Share 失敗,改下載", e);
                }
              }
              // 備援：下載圖片
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              setShareHint("✓ 圖片已下載");
              setShareSuccess(true);
              setTimeout(() => { setShareHint(""); setShareSuccess(false); }, 8000);
            } catch (e) {
              console.error("分享失敗", e);
              setShareHint("⚠ 失敗,請重試");
              setTimeout(() => setShareHint(""), 3000);
            } finally {
              setSharing(false);
            }
          }}
                  disabled={sharing}
                  className="btn-tactile flex items-center gap-1 px-3 h-8 rounded-full border-2 text-xs font-medium shadow-md"
                  style={{
                    background: "#1F5C3A", borderColor: "#1F5C3A", color: "#fff",
                    opacity: sharing ? 0.6 : 1,
                  }}>
            {sharing ? (
              <>
                <span className="animate-pulse">…</span>
                <span>處理中</span>
              </>
            ) : (
              <>
                <Share2 size={12} strokeWidth={2.5} />
                <span>分享圖片</span>
              </>
            )}
          </button>
          <button onClick={onExit}
                  className="btn-tactile flex items-center gap-1 px-3 h-8 rounded-full border-2 text-xs font-medium shadow-md"
                  style={{ background: "#1A3D4D", borderColor: "#1A3D4D", color: "#F2EDE2" }}>
            <X size={12} strokeWidth={2.5} />
            結束
          </button>
        </div>
      </div>

      {shareHint && (
        <div className="fixed top-14 left-1/2 z-50 shadow-lg rounded-xl"
             style={{
               transform: "translateX(-50%)",
               background: shareHint.startsWith("✓") ? "#1F5C3A" : "#B23A28",
               color: "#fff",
               minWidth: 260,
               maxWidth: "calc(100% - 32px)",
               padding: shareSuccess ? "10px 14px" : "8px 16px",
             }}>
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            {shareHint}
          </div>
          {shareSuccess && (
            <>
              <div className="text-[11px] mt-1 mb-2 opacity-90 text-center">
                訊息已傳送。要繼續傳給其他人嗎？
              </div>
              <div className="flex gap-2">
                <a href="line://" onClick={() => { setShareHint(""); setShareSuccess(false); }}
                   className="btn-tactile flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold"
                   style={{ background: "#fff", color: "#06C755" }}>
                  <span style={{ fontSize: 13 }}>💬</span>
                  打開 LINE
                </a>
                <button onClick={() => { setShareHint(""); setShareSuccess(false); }}
                        className="btn-tactile px-3 py-2 rounded-lg text-xs font-medium"
                        style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                  關閉
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Compact card */}
      <div className="px-2 pb-4" style={{ marginTop: -32 }}>
        <div ref={cardRef} className="mx-auto rounded-xl border-2 overflow-hidden"
             style={{
               background: "#FFFCF6", borderColor: "#1A3D4D",
               maxWidth: 400,
               boxShadow: "0 4px 20px rgba(20,18,16,0.08)",
             }}>
          {/* Compact header */}
          <div style={{ background: "#1A3D4D", color: "#FFFCF6", padding: "8px 12px" }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TeamBadge size={28} />
                <div>
                  <div className="display-cn" style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.4 }}>
                    {selectedDate.split("-").slice(1).join("/")}
                    <span style={{ color: "#2DBFA8", marginLeft: 6, fontSize: 13, fontWeight: 700 }}>
                      {dateInfo.dayLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(255,252,246,0.6)", marginTop: 1 }}>
                    龍門國中泳隊
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,252,246,0.5)" }}>
                {selectedDate.split("-").slice(0, 2).join(" / ")}
              </span>
            </div>
          </div>

          {/* Compact stats - one line */}
          <div style={{
            background: "#F8F3E8", padding: "8px 12px",
            borderBottom: "1px solid #DDD3BF",
            fontSize: 11, display: "flex", justifyContent: "space-around",
            flexWrap: "wrap", gap: 8, lineHeight: 1.6,
          }}>
            <div className="flex items-center gap-1 flex-wrap">
              <Sun size={12} strokeWidth={2.5} style={{ color: "#2E2820" }} />
              <span style={{ color: "#2E2820" }}>早</span>
              {amStarted ? (
                <>
                  <span className="num" style={{ color: "#1F5C3A", fontWeight: 700 }}>{amS.on}</span>
                  <span className="num" style={{ color: "#8B8275" }}>／{amS.sch}</span>
                  {amS.bn > 0 && (
                    <span className="num" style={{ color: "#2F4FA8", fontWeight: 700 }}>+補{amS.bn}</span>
                  )}
                  {amS.no > 0 && (
                    <span className="num" style={{ color: "#B23A28", fontWeight: 700 }}>缺{amS.no}</span>
                  )}
                  {amS.late > 0 && (
                    <span className="num" style={{ color: "#E07B30", fontWeight: 700 }}>遲{amS.late}</span>
                  )}
                  {amS.pn > 0 && (
                    <span className="num" style={{ color: "#B8860B", fontWeight: 700 }}>待{amS.pn}</span>
                  )}
                  <span style={{ color: "#1F5C3A", fontSize: 10, fontWeight: 600, marginLeft: 2 }}>
                    ＝實到{amS.on + amS.bn}
                  </span>
                </>
              ) : (
                <>
                  <span className="num" style={{ color: "#8B8275" }}>表定{amS.sch}</span>
                  <span style={{ color: "#8B8275", fontWeight: 600, marginLeft: 4 }}>· 尚未點名</span>
                </>
              )}
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "0 3px", borderRadius: 2,
                background: VENUES[amVenue].bg, color: VENUES[amVenue].color, marginLeft: 2,
              }}>📍{VENUES[amVenue].label}</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Moon size={12} strokeWidth={2.5} style={{ color: "#2E2820" }} />
              <span style={{ color: "#2E2820" }}>午</span>
              {pmStarted ? (
                <>
                  <span className="num" style={{ color: "#1F5C3A", fontWeight: 700 }}>{pmS.on}</span>
                  <span className="num" style={{ color: "#8B8275" }}>／{pmS.sch}</span>
                  {pmS.bn > 0 && (
                    <span className="num" style={{ color: "#2F4FA8", fontWeight: 700 }}>+補{pmS.bn}</span>
                  )}
                  {pmS.no > 0 && (
                    <span className="num" style={{ color: "#B23A28", fontWeight: 700 }}>缺{pmS.no}</span>
                  )}
                  {pmS.late > 0 && (
                    <span className="num" style={{ color: "#E07B30", fontWeight: 700 }}>遲{pmS.late}</span>
                  )}
                  {pmS.pn > 0 && (
                    <span className="num" style={{ color: "#B8860B", fontWeight: 700 }}>待{pmS.pn}</span>
                  )}
                  <span style={{ color: "#1F5C3A", fontSize: 10, fontWeight: 600, marginLeft: 2 }}>
                    ＝實到{pmS.on + pmS.bn}
                  </span>
                </>
              ) : (
                <>
                  <span className="num" style={{ color: "#8B8275" }}>表定{pmS.sch}</span>
                  <span style={{ color: "#8B8275", fontWeight: 600, marginLeft: 4 }}>· 尚未點名</span>
                </>
              )}
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "0 3px", borderRadius: 2,
                background: VENUES[pmVenue].bg, color: VENUES[pmVenue].color, marginLeft: 2,
              }}>📍{VENUES[pmVenue].label}</span>
            </div>
          </div>

          {/* 永運費用提示橫條（有任一場永運時顯示） */}
          {hasYongyun && (() => {
            // 計算今日應收人次（扣除整天個練的人）
            const amPaid = amVenue === "yongyun" ? rows.filter(r =>
              !r.dayHasSolo && (r.amStatus === "on_time" || r.amStatus === "bonus")
            ).length : 0;
            const pmPaid = pmVenue === "yongyun" ? rows.filter(r =>
              !r.dayHasSolo && (r.pmStatus === "on_time" || r.pmStatus === "bonus")
            ).length : 0;
            const totalPaid = amPaid + pmPaid;
            const totalFee = totalPaid * VENUE_FEE;
            return (
              <div style={{
                background: VENUES.yongyun.bg, padding: "4px 12px",
                borderBottom: "1px solid #DDD3BF",
                fontSize: 10, color: VENUES.yongyun.color, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap",
              }}>
                <span>💰</span>
                <span>本日永運：</span>
                {amVenue === "yongyun" && <span>早 {amPaid} 人</span>}
                {amVenue === "yongyun" && pmVenue === "yongyun" && <span style={{ color: "#8B8275" }}>·</span>}
                {pmVenue === "yongyun" && <span>午 {pmPaid} 人</span>}
                {soloees.length > 0 && (
                  <span style={{ color: "#7C4DBC", marginLeft: 4 }}>
                    （扣除 {soloees.length} 名個練）
                  </span>
                )}
                <span style={{ marginLeft: "auto" }}>
                  應收 ${totalFee}
                </span>
              </div>
            );
          })()}

          {/* 整日備註橫條（如有） */}
          {dayNote && (
            <div style={{
              background: "#FFF7DC", padding: "5px 12px",
              borderBottom: "1px solid #DDD3BF",
              fontSize: 10, color: "#5C4810", lineHeight: 1.4,
              display: "flex", gap: 4, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 10, marginTop: 1 }}>📝</span>
              <span style={{ letterSpacing: "0.05em", fontWeight: 700, marginRight: 2, flexShrink: 0 }}>今日：</span>
              <span style={{ fontWeight: 500, whiteSpace: "pre-wrap", flex: 1 }}>{dayNote}</span>
            </div>
          )}

          {/* Absent line if any */}
          {absentees.length > 0 && (
            <div style={{
              background: "#F4DDD4", padding: "5px 12px",
              borderBottom: "1px solid #DDD3BF",
              fontSize: 10, color: "#B23A28", fontWeight: 600,
              lineHeight: 1.4,
            }}>
              <span style={{ letterSpacing: "0.1em", marginRight: 4 }}>缺席：</span>
              {absentees.map((r, i) => (
                <span key={r.seq}>
                  {i > 0 && "、"}
                  {r.name}
                  {r.amStatus === "no_show" && r.pmStatus === "no_show" && "(整日)"}
                  {r.amStatus === "no_show" && r.pmStatus !== "no_show" && "(早)"}
                  {r.amStatus !== "no_show" && r.pmStatus === "no_show" && "(午)"}
                </span>
              ))}
            </div>
          )}

          {/* 遲到清單橫條（如有） */}
          {latees.length > 0 && (
            <div style={{
              background: "#FBE5D2", padding: "5px 12px",
              borderBottom: "1px solid #DDD3BF",
              fontSize: 10, color: "#A85518", fontWeight: 600,
              lineHeight: 1.4,
            }}>
              <span style={{ letterSpacing: "0.1em", marginRight: 4 }}>🕐 遲到未下水：</span>
              {latees.map((r, i) => {
                const both = r.amLate && r.pmLate &&
                             (r.amStatus === "on_time" || r.amStatus === "bonus") &&
                             (r.pmStatus === "on_time" || r.pmStatus === "bonus");
                const onlyAm = r.amLate && (r.amStatus === "on_time" || r.amStatus === "bonus");
                const onlyPm = r.pmLate && (r.pmStatus === "on_time" || r.pmStatus === "bonus");
                return (
                  <span key={r.seq}>
                    {i > 0 && "、"}
                    {r.name}
                    {both && "(整日)"}
                    {!both && onlyAm && "(早)"}
                    {!both && onlyPm && "(午)"}
                  </span>
                );
              })}
            </div>
          )}

          {/* 個練清單橫條（紫色，當日有勾個練時顯示） */}
          {soloees.length > 0 && (
            <div style={{
              background: "rgba(124, 77, 188, 0.15)", padding: "5px 12px",
              borderBottom: "1px solid #DDD3BF",
              fontSize: 10, color: "#7C4DBC", fontWeight: 600,
              lineHeight: 1.4,
            }}>
              <span style={{ letterSpacing: "0.1em", marginRight: 4 }}>⭐ 個練（自費，不計入永運費）：</span>
              {soloees.map((r, i) => (
                <span key={r.seq}>
                  {i > 0 && "、"}
                  {r.name}
                </span>
              ))}
            </div>
          )}

          {/* 點名進度（早 + 午分別顯示） */}
          {(() => {
            const amPointed = amS.sch - amS.pn;
            const pmPointed = pmS.sch - pmS.pn;
            const amDone = amStarted && amS.pn === 0;
            const pmDone = pmStarted && pmS.pn === 0;
            // 兩場都未開始時不顯示這條
            if (!amStarted && !pmStarted) return null;
            return (
              <div style={{
                background: "#F8F3E8", padding: "6px 12px",
                borderBottom: "1px solid #DDD3BF",
                fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
              }}>
                <span style={{ color: "#2E2820", letterSpacing: "0.05em" }}>📋 點名進度</span>
                {/* 早訓進度 */}
                {amStarted && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: amDone ? "#1F5C3A" : "#5C4810" }}>
                      {amDone ? "✓" : "⏳"} 早
                    </span>
                    <span className="num" style={{ color: amDone ? "#1F5C3A" : "#5C4810" }}>
                      {amPointed}/{amS.sch}
                    </span>
                    {amDone && <span style={{ color: "#1F5C3A", fontWeight: 600 }}>已完成</span>}
                  </span>
                )}
                {/* 午訓進度 */}
                {pmStarted && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: pmDone ? "#1F5C3A" : "#5C4810" }}>
                      {pmDone ? "✓" : "⏳"} 午
                    </span>
                    <span className="num" style={{ color: pmDone ? "#1F5C3A" : "#5C4810" }}>
                      {pmPointed}/{pmS.sch}
                    </span>
                    {pmDone && <span style={{ color: "#1F5C3A", fontWeight: 600 }}>已完成</span>}
                  </span>
                )}
                {/* 整體完成 */}
                {amDone && (pmDone || !pmStarted) && pmStarted === false && (
                  <span style={{ color: "#1F5C3A", fontWeight: 700, marginLeft: "auto" }}>
                    早訓已完成
                  </span>
                )}
                {amDone && pmDone && (
                  <span style={{ color: "#1F5C3A", fontWeight: 700, marginLeft: "auto" }}>
                    ✅ 兩場皆完成
                  </span>
                )}
              </div>
            );
          })()}

          {/* Pending warning - 早訓未點名（只有早訓「有人開始點」才警告剩下的） */}
          {amStarted && amPendingees.length > 0 && (
            <div style={{
              background: "#F6C53C", padding: "5px 12px",
              borderBottom: "2px solid #D9A82C",
              fontSize: 10, color: "#3D2F00", fontWeight: 700,
              lineHeight: 1.4,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 12 }}>⚠</span>
              <span style={{ letterSpacing: "0.05em" }}>
                早訓尚有 <span className="num" style={{ fontSize: 12 }}>{amPendingees.length}</span> 位未點名：
              </span>
              <span style={{ fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {amPendingees.map(r => r.name).join("、")}
              </span>
            </div>
          )}

          {/* Pending warning - 午訓未點名（只有午訓「有人開始點」才警告剩下的） */}
          {pmStarted && pmPendingees.length > 0 && (
            <div style={{
              background: "#F6C53C", padding: "5px 12px",
              borderBottom: "2px solid #D9A82C",
              fontSize: 10, color: "#3D2F00", fontWeight: 700,
              lineHeight: 1.4,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 12 }}>⚠</span>
              <span style={{ letterSpacing: "0.05em" }}>
                午訓尚有 <span className="num" style={{ fontSize: 12 }}>{pmPendingees.length}</span> 位未點名：
              </span>
              <span style={{ fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {pmPendingees.map(r => r.name).join("、")}
              </span>
            </div>
          )}

          {/* state legend - VERY VISIBLE */}
          <div style={{
            background: "#FFFCF6", padding: "7px 10px",
            borderBottom: "1px solid #DDD3BF",
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "4px 10px", fontSize: 10,
          }}>
            <div className="flex items-center gap-1.5">
              <Tiny status="on_time" />
              <span style={{ color: "#1F5C3A", fontWeight: 700 }}>有排+到</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tiny status="no_show" />
              <span style={{ color: "#B23A28", fontWeight: 700 }}>有排+缺</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tiny status="bonus" />
              <span style={{ color: "#2F4FA8", fontWeight: 700 }}>沒排+到（補訓）</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tiny status="confirmed_excused" />
              <span style={{ color: "#5A5142", fontWeight: 700 }}>沒排+沒到（請假）</span>
            </div>
            {latees.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tiny status="on_time" late={true} />
                <span style={{ color: "#A85518", fontWeight: 700 }}>遲到未下水</span>
              </div>
            )}
            {notedRows.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 10 }}>📝</span>
                <span style={{ color: "#5C4810", fontWeight: 700 }}>姓名旁=有備註</span>
              </div>
            )}
          </div>

          {/* Mini column header */}
          <div style={{
            background: "#1A3D4D", color: "#F2EDE2",
            display: "grid", gridTemplateColumns: "1fr 1fr",
            fontSize: 9, letterSpacing: "0.1em", lineHeight: 1.5,
          }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                padding: "4px 6px", display: "grid",
                gridTemplateColumns: "3px 18px 1fr 16px 16px", gap: 4,
                alignItems: "center",
                borderLeft: i === 1 ? "1px solid rgba(242,237,226,0.2)" : "none",
              }}>
                <span />
                <span>#</span>
                <span>姓名</span>
                <span style={{ textAlign: "center" }}>早</span>
                <span style={{ textAlign: "center" }}>午</span>
              </div>
            ))}
          </div>

          {/* Two columns of names */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div>
              {col1.map(m => <Row key={m.seq} m={m} />)}
            </div>
            <div style={{ borderLeft: "1px solid #DDD3BF" }}>
              {col2.map(m => <Row key={m.seq} m={m} />)}
            </div>
          </div>

          {/* 個人備註摘要（如有） */}
          {notedRows.length > 0 && (
            <div style={{
              background: "#FFFBEF", padding: "6px 10px",
              borderTop: "1px solid #EAE3D4",
              fontSize: 10, color: "#5C4810", lineHeight: 1.5,
            }}>
              <div style={{ letterSpacing: "0.1em", fontWeight: 700, marginBottom: 3, fontSize: 9 }}>
                📝 個人備註
              </div>
              {notedRows.map(r => (
                <div key={r.seq} style={{ display: "flex", gap: 4, marginBottom: 1 }}>
                  <span style={{ fontWeight: 700, flexShrink: 0 }}>{r.name}：</span>
                  <span style={{ flex: 1 }}>
                    {r.amNote && <span><span style={{ color: "#8B8275" }}>(早) </span>{r.amNote}</span>}
                    {r.amNote && r.pmNote && <span style={{ margin: "0 4px", color: "#8B8275" }}>·</span>}
                    {r.pmNote && <span><span style={{ color: "#8B8275" }}>(午) </span>{r.pmNote}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Compact footer - only grade legend + pending hint */}
          <div style={{
            background: "#F8F3E8", padding: "5px 10px",
            borderTop: "2px solid #141210",
            fontSize: 9, color: "#2E2820",
            display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center",
          }}>
            <span className="flex items-center gap-1">
              <Tiny status="pending" />
              <span style={{ color: "#5C4810", fontWeight: 600 }}>= 待點名</span>
            </span>
            <span style={{ color: "#8B8275", letterSpacing: "0.05em" }}>
              <span style={{ display: "inline-block", width: 6, height: 6, background: "#D9543C", marginRight: 2, verticalAlign: "middle", borderRadius: 1 }} />9
              <span style={{ display: "inline-block", width: 6, height: 6, background: "#B8860B", marginLeft: 4, marginRight: 2, verticalAlign: "middle", borderRadius: 1 }} />8
              <span style={{ display: "inline-block", width: 6, height: 6, background: "#1F5C3A", marginLeft: 4, marginRight: 2, verticalAlign: "middle", borderRadius: 1 }} />7年級
            </span>
          </div>
        </div>

        {/* Hint */}
        <div className="text-center mt-3" style={{ fontSize: 10, color: "#8B8275" }}>
          <Camera size={10} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
          截圖此卡片，傳給老師或群組
        </div>
      </div>
    </div>
  );
}

// ============ TEAM BADGE (LONGMEN SWIMMING) ============
function TeamBadge({ size = 64 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg"
         style={{ display: "block" }}>
      {/* Outer dark ring */}
      <circle cx="50" cy="50" r="46" fill="#FFFCF6" stroke="#1A3D4D" strokeWidth="3" />
      {/* Inner subtle ring */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="#2DBFA8" strokeWidth="0.8" opacity="0.5" />
      {/* "Long men" curved text top */}
      <defs>
        <path id="lm-curve-top" d="M 22 52 A 30 30 0 0 1 78 52" fill="none" />
      </defs>
      <text fill="#2DBFA8" fontFamily="Georgia, serif" fontSize="9" fontWeight="700" fontStyle="italic">
        <textPath href="#lm-curve-top" startOffset="50%" textAnchor="middle">
          Long men
        </textPath>
      </text>
      {/* 龍門 in center */}
      <text x="50" y="58" textAnchor="middle"
            fontFamily="'Noto Sans TC', sans-serif" fontSize="18" fontWeight="900"
            fill="#1A3D4D" letterSpacing="1">
        龍門
      </text>
      {/* Wave under */}
      <path d="M 22 70 Q 30 66, 38 70 T 54 70 T 70 70 T 78 70"
            stroke="#2DBFA8" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Banner */}
      <path d="M 8 80 L 92 80 L 88 92 L 12 92 Z" fill="#2DBFA8" />
      <text x="50" y="89" textAnchor="middle"
            fontFamily="'Anton', sans-serif" fontSize="9" fontWeight="700"
            fill="#FFFCF6" letterSpacing="1.5">
        SWIMMING
      </text>
    </svg>
  );
}

// ============ LOGIN / AUTH UI ============
function LoginScreen() {
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(false);

  // Inject CSS for the login screen too
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.innerHTML = CSS;
    document.head.appendChild(style);
    return () => {
      try { document.head.removeChild(link); } catch (e) {}
      try { document.head.removeChild(style); } catch (e) {}
    };
  }, []);

  const handleSignIn = async () => {
    setSigning(true);
    setError(null);
    try {
      // 偵測 iOS Safari / in-app browser → 用 redirect（popup 在 iOS 不穩）
      const ua = navigator.userAgent || "";
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
      const isInAppBrowser = /FB_IAB|FBAN|Instagram|Line/i.test(ua);
      const useRedirect = isIOS || (isIOS && isSafari) || isInAppBrowser;

      if (useRedirect) {
        // 整頁跳轉模式（iOS / LINE / FB / IG）
        await signInWithRedirect(auth, googleProvider);
        // 不會 return,頁面會跳走
      } else {
        // 彈窗模式（桌面、Android Chrome 等）
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err) {
      console.error("登入錯誤:", err);
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        setError(null);
      } else if (err.code === "auth/popup-blocked") {
        // Popup 被擋,嘗試 redirect
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (e2) {
          setError("登入失敗，請改用 Chrome 瀏覽器");
        }
      } else {
        setError(err.message || "登入失敗，請改用 Chrome 瀏覽器");
      }
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="att-root w-full min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <TeamBadge size={140} />
          </div>
          <div className="text-[10px] tk-x mb-2 flex items-center justify-center gap-2"
               style={{ color: "var(--mute)" }}>
            <span className="inline-block w-6 h-px" style={{ background: "var(--accent-2)" }} />
            LONGMEN JUNIOR HIGH · SWIM TEAM
            <span className="inline-block w-6 h-px" style={{ background: "var(--accent-2)" }} />
          </div>
          <h1 className="display text-5xl" style={{ color: "var(--accent-2)" }}>
            LONGMEN<span style={{ color: "var(--accent)" }}>·</span>SWIM
          </h1>
          <div className="display-cn text-xl mt-2" style={{ color: "var(--accent-2)" }}>
            龍門國中泳隊
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
            訓練點名簿
          </div>
        </div>

        <div className="rounded-2xl p-5 border-2"
             style={{ borderColor: "var(--accent-2)", background: "var(--panel)" }}>
          <button onClick={handleSignIn} disabled={signing}
                  className="btn-tactile w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 font-medium"
                  style={{
                    borderColor: "var(--accent-2)",
                    background: signing ? "var(--line-strong)" : "var(--accent-2)",
                    color: "#fff",
                    cursor: signing ? "wait" : "pointer",
                  }}>
            {signing ? (
              <RefreshCw size={18} strokeWidth={2.5} className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {signing ? "登入中…" : "使用 Google 帳號登入"}
          </button>

          {error && (
            <div className="mt-3 px-3 py-2 rounded-md text-xs"
                 style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red)" }}>
              <div className="font-bold mb-1">{error}</div>
              <div className="text-[10px] opacity-80">
                如果你用 iPhone Safari 出現問題：<br/>
                1. 請從 LINE/IG 等 App 內開的連結 → 改用 Safari/Chrome 開啟<br/>
                2. 或改用 Chrome 瀏覽器試試
              </div>
            </div>
          )}

          <p className="text-[11px] text-center mt-4 leading-relaxed"
             style={{ color: "var(--mute)" }}>
            僅限龍門國中泳隊教練 / 家長使用<br />
            登入後即可雲端同步點名紀錄
          </p>

          <div className="mt-3 px-3 py-2 rounded text-[10px]"
               style={{ background: "var(--panel-2)", color: "var(--mute)" }}>
            📱 <span className="font-medium">iPhone 用戶提示：</span>登入時系統會跳到 Google 登入頁面，登入完成後會自動回到本系統。請不要關閉視窗。
          </div>
        </div>

        <div className="text-center mt-6 text-[10px] tk-l" style={{ color: "var(--mute)" }}>
          BUILT FOR DAILY ROLL-CALL · 2026
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function PendingApprovalScreen({ user, config, setConfig, isPending, ownerEmail }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState(user.displayName || "");
  const [reason, setReason] = useState("");

  // Inject CSS
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.innerHTML = CSS;
    document.head.appendChild(style);
    return () => {
      try { document.head.removeChild(link); } catch (e) {}
      try { document.head.removeChild(style); } catch (e) {}
    };
  }, []);

  const submitRequest = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const newPending = [
        ...(config.pending || []).filter(p => (p.email || "").toLowerCase() !== user.email.toLowerCase()),
        {
          email: user.email.toLowerCase(),
          name: name.trim(),
          reason: reason.trim(),
          requestedAt: Date.now(),
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
        },
      ];
      setConfig({ ...config, pending: newPending });
      setSubmitted(true);
    } catch (e) {
      console.error("Submit request failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="att-root w-full min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <TeamBadge size={120} />
          </div>
          <div className="display-cn text-2xl sm:text-3xl mb-2" style={{ color: "var(--ink)" }}>
            龍門國中泳隊
          </div>
          <div className="text-xs tk-x" style={{ color: "var(--mute)" }}>
            LONGMEN JUNIOR HIGH · SWIM TEAM
          </div>
        </div>

        {/* 已登入但未授權 */}
        <div className="rounded-2xl p-5 sm:p-6 border-2 mb-4"
             style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
          {/* 使用者卡 */}
          <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-lg"
               style={{ background: "var(--panel-2)" }}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                   style={{ background: "var(--line)" }}>
                <User size={18} strokeWidth={2} style={{ color: "var(--mute)" }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>
                {user.displayName || "登入帳號"}
              </div>
              <div className="text-xs num truncate" style={{ color: "var(--mute)" }}>
                {user.email}
              </div>
            </div>
          </div>

          {submitted || isPending ? (
            // 已申請 / 等候中
            <div>
              <div className="rounded-lg p-4 mb-3 border-2"
                   style={{ background: "var(--green-bg)", borderColor: "var(--green)" }}>
                <div className="flex items-start gap-2">
                  <Check size={16} strokeWidth={2.5} style={{ color: "var(--green)", marginTop: 2 }} />
                  <div className="text-xs sm:text-sm" style={{ color: "var(--green)" }}>
                    <div className="font-bold mb-1 text-sm sm:text-base">✓ 已收到申請，審核中</div>
                    <div>管理員核准後，重新整理頁面即可進入系統。</div>
                    <div className="mt-1 opacity-80">如需加快審核，請主動聯絡教練。</div>
                  </div>
                </div>
              </div>
              {ownerEmail && (
                <div className="text-[11px] mb-3 text-center" style={{ color: "var(--mute)" }}>
                  主管理員：<span className="num">{ownerEmail}</span>
                </div>
              )}
            </div>
          ) : (
            // 第一次：填表單
            <div>
              <div className="rounded-lg p-3 mb-4"
                   style={{ background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
                <div className="text-xs leading-relaxed" style={{ color: "var(--accent-2)" }}>
                  🔒 此系統僅限授權人員存取。請填寫資料以申請存取權限。
                </div>
              </div>

              <div className="mb-3">
                <div className="text-[11px] tk-l mb-1" style={{ color: "var(--mute)" }}>
                  姓名 <span style={{ color: "var(--red)" }}>*</span>
                </div>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                       placeholder="王小明（家長）/ 李教練"
                       className="w-full px-3 py-2 rounded-md border-2 text-sm"
                       style={{ borderColor: "var(--line)", background: "var(--bg)" }} />
              </div>

              <div className="mb-4">
                <div className="text-[11px] tk-l mb-1" style={{ color: "var(--mute)" }}>
                  與泳隊關係（選填）
                </div>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                       placeholder="例：小鳳梨的家長"
                       className="w-full px-3 py-2 rounded-md border-2 text-sm"
                       style={{ borderColor: "var(--line)", background: "var(--bg)" }} />
              </div>

              <button onClick={submitRequest}
                      disabled={!name.trim() || submitting}
                      className="btn-tactile w-full px-4 py-3 rounded-lg font-medium"
                      style={{
                        background: name.trim() && !submitting ? "var(--accent-2)" : "var(--line)",
                        color: name.trim() && !submitting ? "#fff" : "var(--mute)",
                      }}>
                {submitting ? "送出中..." : "📨 送出申請"}
              </button>
            </div>
          )}

          <button onClick={() => signOut(auth)}
                  className="btn-tactile w-full mt-3 px-4 py-2 rounded-lg text-sm border-2"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)", background: "var(--panel)" }}>
            登出此帳號
          </button>
        </div>

        <div className="text-center text-[10px] tk-l" style={{ color: "var(--mute)" }}>
          BUILT FOR DAILY ROLL-CALL · 2026
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3">
      <RefreshCw size={28} strokeWidth={2.5} className="animate-spin" style={{ color: "var(--accent-2)" }} />
      <span className="text-xs tk-l" style={{ color: "var(--mute)" }}>
        LOADING...
      </span>
    </div>
  );
}

// ============ SYNC STATUS BADGE ============
function SyncStatusBadge({ status, lastSaveTime }) {
  const cfg = {
    connecting: { Ic: RefreshCw, txt: "連線中…", color: "var(--mute)", spin: true },
    synced:     { Ic: Cloud,     txt: lastSaveTime ? `已同步` : "已連線", color: "var(--accent)", spin: false },
    saving:     { Ic: RefreshCw, txt: "儲存中…", color: "var(--amber)", spin: true },
    error:      { Ic: CloudOff,  txt: "同步失敗",  color: "var(--red)", spin: false },
  };
  const { Ic, txt, color, spin } = cfg[status] || cfg.connecting;
  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ color }}>
      <Ic size={13} strokeWidth={2.5} className={spin ? "animate-spin" : ""} />
      <span className="font-medium">{txt}</span>
      {status === "synced" && lastSaveTime && (
        <span className="num text-[10px] opacity-60">
          · {new Date(lastSaveTime).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </div>
  );
}

// ============ MANAGEMENT VIEW ============
function ManagementView({ user, config, setConfig, isOwner, isAdmin, noAdminsYet, logAction }) {
  const { roster, setRoster } = useRoster();
  const [editingPerson, setEditingPerson] = useState(null);
  const [editingSch, setEditingSch] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedPersons, setDeletedPersons] = useState([]);

  // 訂閱軟刪除集合
  useEffect(() => {
    if (!isOwner && !isAdmin) return;
    const ref = doc(db, "teams", "longmen", "data", "deleted_persons");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists() && Array.isArray(snap.data().value)) {
        setDeletedPersons(snap.data().value);
      } else {
        setDeletedPersons([]);
      }
    });
    return unsub;
  }, [isOwner, isAdmin]);

  // CASE 1: No admins yet → bootstrap
  if (noAdminsYet) {
    return <BootstrapAdminPrompt user={user} setConfig={setConfig} logAction={logAction} />;
  }

  // CASE 2: Not admin → read-only
  if (!isAdmin) {
    return <ReadOnlyManagement roster={roster}
                                ownerEmail={config.owner}
                                adminEmails={config.admins || []}
                                userEmail={user.email} />;
  }

  // CASE 3: Admin → full edit
  const sortedRoster = [...roster].sort((a, b) => a.seq - b.seq);

  // ===== 匯出隊員名單 =====
  const exportRoster = () => {
    const wb = XLSX.utils.book_new();

    // ========== Sheet 1: 基本資料 ==========
    const basicData = sortedRoster.map(p => ({
      "序號": p.seq,
      "班級": p.cls,
      "座號": p.num,
      "姓名": p.name,
      "年級": GRADE_NAMES[p.grade],
    }));
    const ws1 = XLSX.utils.json_to_sheet(basicData);
    ws1["!cols"] = [
      { wch: 6 }, { wch: 8 }, { wch: 6 }, { wch: 12 }, { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, "基本資料");

    // ========== Sheet 2: 訓練表（每場勾選） ==========
    const schData = sortedRoster.map(p => ({
      "序號": p.seq,
      "班級": p.cls,
      "座號": p.num,
      "姓名": p.name,
      "年級": GRADE_NAMES[p.grade],
      "週一早": p.sch[0] === 1 ? "✓" : "",
      "週一午": p.sch[1] === 1 ? "✓" : "",
      "週二早": p.sch[2] === 1 ? "✓" : "",
      "週二午": p.sch[3] === 1 ? "✓" : "",
      "週三早": p.sch[4] === 1 ? "✓" : "",
      "週三午": p.sch[5] === 1 ? "✓" : "",
      "週四早": p.sch[6] === 1 ? "✓" : "",
      "週四午": p.sch[7] === 1 ? "✓" : "",
      "週五早": p.sch[8] === 1 ? "✓" : "",
      "週五午": p.sch[9] === 1 ? "✓" : "",
      "週六早": p.sch[10] === 1 ? "✓" : "",
      "週六午": p.sch[11] === 1 ? "✓" : "",
      "週訓練數": p.sch.filter(x => x === 1).length,
    }));
    const ws2 = XLSX.utils.json_to_sheet(schData);
    ws2["!cols"] = [
      { wch: 6 }, { wch: 8 }, { wch: 6 }, { wch: 12 }, { wch: 8 },
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
      { wch: 9 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "訓練表");

    // ========== Sheet 3: 訓練表（簡潔版） ==========
    const dayLabels = ["一", "二", "三", "四", "五", "六"];
    const schSimpleData = sortedRoster.map(p => {
      const amDays = [];
      const pmDays = [];
      for (let i = 0; i < 6; i++) {
        if (p.sch[i * 2] === 1) amDays.push(dayLabels[i]);
        if (p.sch[i * 2 + 1] === 1) pmDays.push(dayLabels[i]);
      }
      return {
        "序號": p.seq,
        "班級": p.cls,
        "座號": p.num,
        "姓名": p.name,
        "年級": GRADE_NAMES[p.grade],
        "早訓日": amDays.length > 0 ? amDays.join("、") : "—",
        "午訓日": pmDays.length > 0 ? pmDays.join("、") : "—",
        "早訓場數": amDays.length,
        "午訓場數": pmDays.length,
        "週總場數": amDays.length + pmDays.length,
      };
    });
    const ws3 = XLSX.utils.json_to_sheet(schSimpleData);
    ws3["!cols"] = [
      { wch: 6 }, { wch: 8 }, { wch: 6 }, { wch: 12 }, { wch: 8 },
      { wch: 18 }, { wch: 18 }, { wch: 9 }, { wch: 9 }, { wch: 9 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, "訓練表（簡潔版）");

    // ========== Sheet 4: 年級彙整 ==========
    const gradeData = [];
    [9, 8, 7].forEach(g => {
      const list = sortedRoster.filter(p => p.grade === g);
      list.forEach(p => {
        gradeData.push({
          "年級": GRADE_NAMES[g],
          "序號": p.seq,
          "班級": p.cls,
          "座號": p.num,
          "姓名": p.name,
          "週訓練數": p.sch.filter(x => x === 1).length,
        });
      });
      // 該年級小計
      gradeData.push({
        "年級": `─ ${GRADE_NAMES[g]}小計 ─`,
        "序號": "",
        "班級": "",
        "座號": "",
        "姓名": `共 ${list.length} 人`,
        "週訓練數": list.reduce((a, p) => a + p.sch.filter(x => x === 1).length, 0),
      });
      gradeData.push({}); // 空行分隔
    });
    // 總計
    gradeData.push({
      "年級": "─ 全隊合計 ─",
      "序號": "",
      "班級": "",
      "座號": "",
      "姓名": `共 ${sortedRoster.length} 人`,
      "週訓練數": sortedRoster.reduce((a, p) => a + p.sch.filter(x => x === 1).length, 0),
    });
    const ws4 = XLSX.utils.json_to_sheet(gradeData);
    ws4["!cols"] = [
      { wch: 14 }, { wch: 6 }, { wch: 8 }, { wch: 6 }, { wch: 14 }, { wch: 9 },
    ];
    XLSX.utils.book_append_sheet(wb, ws4, "年級彙整");

    // 檔名加日期
    const today = new Date();
    const dateStr = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;
    XLSX.writeFile(wb, `龍門泳隊_隊員名單_${dateStr}.xlsx`);

    // 編輯紀錄
    if (logAction) {
      logAction({
        action: "export_roster",
        target: "roster",
        targetLabel: `匯出隊員名單（${sortedRoster.length} 人）`,
        before: null,
        after: { count: sortedRoster.length, format: "xlsx" },
      });
    }
  };

  const updatePerson = (seq, patch, originalPerson) => {
    setRoster(prev => prev.map(p => p.seq === seq ? { ...p, ...patch } : p), {
      logAction: "edit_person",
      logPayload: {
        target: `person/${seq}`,
        targetLabel: `編輯隊員 - ${originalPerson?.name || `#${seq}`}`,
        before: originalPerson,
        after: { ...originalPerson, ...patch },
      },
    });
  };

  const softDeletePerson = (person) => {
    // 1) 從 roster 移除
    setRoster(prev => prev.filter(p => p.seq !== person.seq), {
      logAction: "delete_person",
      logPayload: {
        target: `person/${person.seq}`,
        targetLabel: `軟刪除隊員 - ${person.name}`,
        before: person,
        note: `30 天內可由主管理員還原`,
      },
    });
    // 2) 加進 deleted_persons + 加 deletedAt
    const ref = doc(db, "teams", "longmen", "data", "deleted_persons");
    const newList = [
      ...deletedPersons,
      { ...person, deletedAt: Date.now(), deletedBy: user.email },
    ];
    setDoc(ref, { value: newList, updatedAt: Date.now() }).catch(console.error);
    setConfirmDelete(null);
  };

  const restorePerson = (person) => {
    // 1) 加回 roster（避免 seq 重複，重新分配最大 seq+1）
    const exists = roster.find(p => p.seq === person.seq);
    let newSeq = person.seq;
    if (exists) {
      newSeq = Math.max(...roster.map(p => p.seq), 0) + 1;
    }
    const restored = { ...person, seq: newSeq };
    delete restored.deletedAt;
    delete restored.deletedBy;
    setRoster(prev => [...prev, restored], {
      logAction: "restore_person",
      logPayload: {
        target: `person/${newSeq}`,
        targetLabel: `還原隊員 - ${person.name}`,
        after: restored,
      },
    });
    // 2) 從 deleted_persons 移除
    const ref = doc(db, "teams", "longmen", "data", "deleted_persons");
    const newList = deletedPersons.filter(p => p.seq !== person.seq);
    setDoc(ref, { value: newList, updatedAt: Date.now() }).catch(console.error);
  };

  const permanentlyDelete = (person) => {
    const ref = doc(db, "teams", "longmen", "data", "deleted_persons");
    const newList = deletedPersons.filter(p => p.seq !== person.seq);
    setDoc(ref, { value: newList, updatedAt: Date.now() }).catch(console.error);
    logAction("permanent_delete_person", {
      target: `person/${person.seq}`,
      targetLabel: `永久刪除隊員 - ${person.name}`,
      before: person,
    });
  };

  const addPerson = (newP) => {
    const maxSeq = roster.reduce((m, p) => Math.max(m, p.seq), 0);
    const newPerson = { ...newP, seq: maxSeq + 1 };
    setRoster(prev => [...prev, newPerson], {
      logAction: "add_person",
      logPayload: {
        target: `person/${newPerson.seq}`,
        targetLabel: `新增隊員 - ${newPerson.name}`,
        after: newPerson,
      },
    });
  };

  const grouped = [9, 8, 7].map(g => ({
    grade: g, label: GRADE_NAMES[g],
    members: sortedRoster.filter(p => p.grade === g),
  })).filter(g => g.members.length > 0);

  return (
    <div className="space-y-4">
      {/* 主管理員徽章 */}
      {isOwner && (
        <div className="rounded-xl px-4 py-2 flex items-center gap-2 border-2"
             style={{ background: "var(--accent-2)", borderColor: "var(--accent-2)", color: "#fff" }}>
          <Crown size={14} strokeWidth={2.5} style={{ color: "#F6C53C" }} />
          <span className="text-xs font-medium">你是主管理員</span>
          <span className="text-[10px] opacity-70">· 可編輯任何日期 · 可查看編輯紀錄 · 可永久刪除</span>
        </div>
      )}

      {/* 待審核申請（owner 才能看） */}
      {isOwner && (
        <PendingApprovalSection config={config} setConfig={setConfig}
                                 user={user} logAction={logAction} />
      )}

      {/* Admin section */}
      <AdminListSection user={user} config={config} setConfig={setConfig}
                         isOwner={isOwner} logAction={logAction} />

      {/* Viewers section */}
      <ViewerListSection config={config} setConfig={setConfig}
                          user={user} isOwner={isOwner} logAction={logAction} />

      {/* Header */}
      <section className="rounded-2xl p-4 sm:p-5 border-2"
               style={{ background: "var(--panel)", borderColor: "var(--accent-2)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] sm:text-xs tk-x mb-1" style={{ color: "var(--mute)" }}>
              MANAGEMENT · 隊員 / 課表管理
            </div>
            <div className="display-cn text-xl sm:text-2xl" style={{ color: "var(--accent-2)" }}>
              共 <span className="num">{roster.length}</span> 位隊員
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportRoster}
                    className="btn-tactile flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border-2 font-medium text-sm"
                    style={{ borderColor: "var(--line-strong)", background: "var(--panel)", color: "var(--ink-2)" }}>
              <Download size={14} strokeWidth={2.5} />
              匯出名單
            </button>
            <button onClick={() => setAdding(true)}
                    className="btn-tactile flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border-2 font-medium text-sm"
                    style={{ borderColor: "var(--accent)", background: "var(--accent)", color: "#fff" }}>
              <Plus size={16} strokeWidth={2.5} />
              新增隊員
            </button>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t text-xs leading-relaxed"
             style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}>
          <span className="font-medium">提示：</span>
          所有編輯都會被自動記錄。刪除隊員會先進入「已軟刪除」區，30 天內可由主管理員還原。
        </div>
      </section>

      {/* 軟刪除區（管理員都可看到，但只有主管理員能永久刪除） */}
      {deletedPersons.length > 0 && (
        <section className="rounded-2xl border-2 overflow-hidden"
                 style={{ borderColor: "var(--line-strong)" }}>
          <button onClick={() => setShowDeleted(s => !s)}
                  className="w-full flex items-center justify-between px-4 py-3"
                  style={{ background: "var(--panel-2)" }}>
            <div className="flex items-center gap-2">
              <Trash2 size={14} strokeWidth={2.5} style={{ color: "var(--mute)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                已軟刪除（{deletedPersons.length} 位）
              </span>
            </div>
            <ChevronRight size={14} strokeWidth={2.5}
                          style={{ color: "var(--mute)", transform: showDeleted ? "rotate(90deg)" : "none" }} />
          </button>
          {showDeleted && (
            <div className="p-3 space-y-2" style={{ background: "var(--panel)" }}>
              {deletedPersons.map(p => (
                <div key={p.seq} className="flex items-center gap-2 p-2 rounded border"
                     style={{ borderColor: "var(--line)", background: "var(--panel-2)" }}>
                  <span className="num text-xs" style={{ color: "var(--mute)" }}>{pad(p.seq)}</span>
                  <span className="font-medium text-sm flex-1" style={{ color: "var(--ink)" }}>{p.name}</span>
                  <span className="num text-[10px]" style={{ color: "var(--mute)" }}>{p.cls}-{pad(p.num)}</span>
                  <span className="text-[10px]" style={{ color: "var(--mute)" }}>
                    {new Date(p.deletedAt).toLocaleDateString("zh-TW")} 由 {p.deletedBy}
                  </span>
                  <button onClick={() => restorePerson(p)}
                          className="btn-tactile flex items-center gap-1 px-2 py-1 rounded text-xs border"
                          style={{ borderColor: "var(--accent)", color: "var(--accent-2)", background: "var(--accent-bg)" }}>
                    <Undo2 size={11} strokeWidth={2.5} />
                    還原
                  </button>
                  {isOwner && (
                    <button onClick={() => {
                              if (confirm(`永久刪除 ${p.name}？此動作無法復原。`)) permanentlyDelete(p);
                            }}
                            className="btn-tactile flex items-center px-2 py-1 rounded text-xs border"
                            style={{ borderColor: "var(--red)", color: "var(--red)" }}>
                      <Trash2 size={11} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Roster list */}
      {grouped.map(g => (
        <section key={g.grade}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-1.5 h-7" style={{ background: "var(--accent-2)" }} />
            <h2 className="display-cn text-lg sm:text-xl" style={{ color: "var(--ink)" }}>{g.label}</h2>
            <div className="num text-xs" style={{ color: "var(--mute)" }}>{g.members.length} 人</div>
            <div className="flex-1 border-b border-dashed" style={{ borderColor: "var(--line-strong)" }} />
          </div>
          <div className="space-y-2">
            {g.members.map(m => (
              <ManagementRow key={m.seq} m={m}
                             onEditInfo={() => setEditingPerson(m)}
                             onEditSch={() => setEditingSch(m)}
                             onDelete={() => setConfirmDelete(m)} />
            ))}
          </div>
        </section>
      ))}

      {editingPerson && (
        <EditPersonModal person={editingPerson}
                         onSave={(patch) => { updatePerson(editingPerson.seq, patch, editingPerson); setEditingPerson(null); }}
                         onCancel={() => setEditingPerson(null)} />
      )}
      {editingSch && (
        <EditScheduleModal person={editingSch}
                           onSave={(sch) => { updatePerson(editingSch.seq, { sch }, editingSch); setEditingSch(null); }}
                           onCancel={() => setEditingSch(null)} />
      )}
      {adding && (
        <EditPersonModal person={{ name: "", cls: "", num: "", grade: 7, sch: [0,0,0,0,0,0,0,0,0,0,0,0] }}
                         isNew={true}
                         onSave={(patch) => { addPerson(patch); setAdding(false); }}
                         onCancel={() => setAdding(false)} />
      )}
      {confirmDelete && (
        <ConfirmDeleteModal person={confirmDelete}
                            onConfirm={() => softDeletePerson(confirmDelete)}
                            onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}

// ============ ADMIN BOOTSTRAP / READ-ONLY / ADMIN MGMT ============
function BootstrapAdminPrompt({ user, setConfig, logAction }) {
  const [confirming, setConfirming] = useState(false);
  const handleSetOwner = () => {
    setConfig({ owner: user.email, admins: [user.email] });
    if (logAction) {
      logAction("set_first_owner", {
        targetLabel: `初始化主管理員`,
        after: { owner: user.email },
      });
    }
  };
  return (
    <div className="space-y-4">
      <section className="rounded-2xl p-5 sm:p-6 border-2 text-center"
               style={{ background: "var(--accent-bg)", borderColor: "var(--accent-2)" }}>
        <div className="flex justify-center mb-3">
          <div className="rounded-full p-3" style={{ background: "var(--accent-2)" }}>
            <Crown size={28} strokeWidth={2} style={{ color: "#F6C53C" }} />
          </div>
        </div>
        <div className="text-[10px] tk-x mb-2" style={{ color: "var(--accent-2)" }}>
          INITIAL SETUP · 首次設定
        </div>
        <h2 className="display-cn text-xl mb-2" style={{ color: "var(--accent-2)" }}>
          尚未設定主管理員
        </h2>
        <p className="text-sm leading-relaxed mb-5 max-w-md mx-auto" style={{ color: "var(--ink-2)" }}>
          主管理員擁有最高權限：可隨時編輯任何日期、查看完整編輯紀錄、永久刪除隊員，並管理其他管理員。
        </p>
        <div className="rounded-lg px-4 py-3 inline-block mb-4 text-left"
             style={{ background: "var(--panel)", border: "1px solid var(--accent-2)" }}>
          <div className="text-[10px] tk-l mb-1" style={{ color: "var(--mute)" }}>您的帳號</div>
          <div className="num text-sm font-medium" style={{ color: "var(--accent-2)" }}>
            {user.email}
          </div>
        </div>
        <div>
          {!confirming ? (
            <button onClick={() => setConfirming(true)}
                    className="btn-tactile inline-flex items-center gap-2 px-5 py-3 rounded-lg border-2 font-medium"
                    style={{ borderColor: "var(--accent-2)", background: "var(--accent-2)", color: "#fff" }}>
              <Crown size={16} strokeWidth={2.5} style={{ color: "#F6C53C" }} />
              將我設為主管理員
            </button>
          ) : (
            <div className="flex gap-2 justify-center">
              <button onClick={() => setConfirming(false)}
                      className="btn-tactile px-4 py-2 rounded-lg border-2 text-sm font-medium"
                      style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
                取消
              </button>
              <button onClick={handleSetOwner}
                      className="btn-tactile px-4 py-2 rounded-lg border-2 text-sm font-medium"
                      style={{ borderColor: "var(--accent-2)", background: "var(--accent-2)", color: "#fff" }}>
                確定設為主管理員
              </button>
            </div>
          )}
        </div>
      </section>
      <section className="rounded-xl p-4 text-xs leading-relaxed"
               style={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>
        <div className="font-medium mb-1" style={{ color: "var(--accent-2)" }}>💡 接下來</div>
        設為主管理員後，可以新增「一般管理員」協助你編輯名單、課表。一般管理員只能修改 24 小時內的點名，超過則需請你協助。
      </section>
    </div>
  );
}

function ReadOnlyManagement({ roster, ownerEmail, adminEmails, userEmail }) {
  const grouped = [9, 8, 7].map(g => ({
    grade: g, label: GRADE_NAMES[g],
    members: roster.filter(p => p.grade === g).sort((a, b) => a.seq - b.seq),
  })).filter(g => g.members.length > 0);

  return (
    <div className="space-y-4">

      <section className="rounded-2xl p-4 sm:p-5 border-2"
               style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <div className="text-[10px] tk-x mb-2" style={{ color: "var(--mute)" }}>
          ROSTER · 隊員名單（唯讀）
        </div>
        <div className="display-cn text-lg" style={{ color: "var(--ink)" }}>
          共 <span className="num">{roster.length}</span> 位隊員
        </div>
      </section>

      {grouped.map(g => (
        <section key={g.grade}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-1.5 h-7" style={{ background: "var(--ink)" }} />
            <h2 className="display-cn text-lg" style={{ color: "var(--ink)" }}>{g.label}</h2>
            <div className="num text-xs" style={{ color: "var(--mute)" }}>{g.members.length} 人</div>
            <div className="flex-1 border-b border-dashed" style={{ borderColor: "var(--line-strong)" }} />
          </div>
          <div className="space-y-1.5">
            {g.members.map(m => (
              <div key={m.seq} className="flex items-center gap-3 px-3 py-2 rounded-lg border"
                   style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
                <span className="num text-xs" style={{ color: "var(--mute)", minWidth: 22 }}>
                  {pad(m.seq)}
                </span>
                <span className="text-sm font-medium flex-1" style={{ color: "var(--ink)" }}>{m.name}</span>
                <span className="num text-[10px]" style={{ color: "var(--mute)" }}>
                  {m.cls}-{pad(m.num)}
                </span>
                <span className="num text-[10px]" style={{ color: "var(--accent-2)" }}>
                  {m.sch.filter(x => x === 1).length}場/週
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PendingApprovalSection({ config, setConfig, user, logAction }) {
  const pending = config.pending || [];
  const [confirmReject, setConfirmReject] = useState(null);

  // DEBUG: 主控台印 + 強制顯示提示
  console.log("[DEBUG PendingApprovalSection] config.pending =", config.pending);
  console.log("[DEBUG] pending.length =", pending.length);

  if (pending.length === 0) {
    // 仍顯示「目前沒有」的提示，讓主管理員知道功能正常運作
    return (
      <section className="rounded-2xl p-4 sm:p-5 border-2"
               style={{ background: "var(--panel-2)", borderColor: "var(--line)" }}>
        <div className="text-[10px] tk-x mb-1" style={{ color: "var(--mute)" }}>
          PENDING APPROVAL · 待審核申請
        </div>
        <div className="text-sm" style={{ color: "var(--mute)" }}>
          ✓ 目前沒有待審核的申請
        </div>
      </section>
    );
  }

  const approve = (entry) => {
    const newPending = pending.filter(p => p.email !== entry.email);
    const newViewers = [...(config.viewers || []), entry.email];
    setConfig({ ...config, pending: newPending, viewers: newViewers });
    if (logAction) {
      logAction("approve_viewer", {
        target: entry.email,
        targetLabel: `核准訪客 - ${entry.name}（${entry.email}）`,
      });
    }
  };

  const reject = (entry) => {
    const newPending = pending.filter(p => p.email !== entry.email);
    setConfig({ ...config, pending: newPending });
    if (logAction) {
      logAction("reject_viewer", {
        target: entry.email,
        targetLabel: `拒絕訪客 - ${entry.name}（${entry.email}）`,
      });
    }
    setConfirmReject(null);
  };

  return (
    <section className="rounded-2xl p-4 sm:p-5 border-2"
             style={{ background: "var(--amber-bg)", borderColor: "var(--amber)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] tk-x mb-1" style={{ color: "#5C4810" }}>
            PENDING APPROVAL · 待審核申請
          </div>
          <div className="display-cn text-lg" style={{ color: "#5C4810" }}>
            <span className="num">{pending.length}</span> 位等候審核
          </div>
        </div>
        <span style={{ fontSize: 24 }}>⏳</span>
      </div>

      <div className="space-y-2">
        {pending.map(entry => (
          <div key={entry.email} className="rounded-lg p-3 flex items-start gap-3"
               style={{ background: "var(--panel)", border: "1px solid var(--amber)" }}>
            {entry.photoURL ? (
              <img src={entry.photoURL} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                   style={{ background: "var(--line)" }}>
                <User size={16} strokeWidth={2} style={{ color: "var(--mute)" }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm" style={{ color: "var(--ink)" }}>
                {entry.name}
              </div>
              <div className="text-[11px] num truncate" style={{ color: "var(--mute)" }}>
                {entry.email}
              </div>
              {entry.reason && (
                <div className="text-xs mt-1" style={{ color: "var(--ink-2)" }}>
                  {entry.reason}
                </div>
              )}
              <div className="text-[10px] mt-1" style={{ color: "var(--mute)" }}>
                申請於 {new Date(entry.requestedAt).toLocaleString("zh-TW")}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button onClick={() => approve(entry)}
                      className="btn-tactile px-3 py-1.5 rounded-md text-xs font-medium"
                      style={{ background: "var(--green)", color: "#fff" }}>
                ✓ 通過
              </button>
              {confirmReject === entry.email ? (
                <div className="flex gap-1">
                  <button onClick={() => setConfirmReject(null)}
                          className="btn-tactile px-2 py-1 rounded-md text-[10px] border"
                          style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
                    取消
                  </button>
                  <button onClick={() => reject(entry)}
                          className="btn-tactile px-2 py-1 rounded-md text-[10px] font-medium"
                          style={{ background: "var(--red)", color: "#fff" }}>
                    確認拒絕
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmReject(entry.email)}
                        className="btn-tactile px-3 py-1.5 rounded-md text-xs border-2"
                        style={{ borderColor: "var(--red)", color: "var(--red)", background: "var(--panel)" }}>
                  ✕ 拒絕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-[10px] mt-3" style={{ color: "#5C4810" }}>
        💡 通過 = 加入訪客清單（可看，但不能編輯）｜拒絕 = 從待審核清單移除（可重新申請）
      </div>
    </section>
  );
}

function ViewerListSection({ config, setConfig, user, isOwner, logAction }) {
  const viewers = config.viewers || [];
  const userNotes = config.userNotes || {};
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteVal, setEditNoteVal] = useState("");

  const add = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!email.includes("@")) { alert("請輸入有效的 email"); return; }
    if (viewers.map(e => e.toLowerCase()).includes(email)) { alert("這個 email 已經是訪客"); return; }
    if ((config.owner || "").toLowerCase() === email) { alert("這是主管理員的 email"); return; }
    if ((config.admins || []).map(e => e.toLowerCase()).includes(email)) { alert("這個 email 已是一般管理員"); return; }
    const newPending = (config.pending || []).filter(p => (p.email || "").toLowerCase() !== email);
    const newNotes = { ...userNotes };
    if (newNote.trim()) newNotes[email] = newNote.trim();
    await setConfig({
      ...config,
      viewers: [...viewers, email],
      pending: newPending,
      userNotes: newNotes,
    });
    setNewEmail("");
    setNewNote("");
    setAdding(false);
    if (logAction) {
      logAction("add_viewer", {
        target: email,
        targetLabel: `新增訪客 - ${email}${newNote.trim() ? `（${newNote.trim()}）` : ""}`,
      });
    }
  };

  const remove = (email) => {
    const newViewers = viewers.filter(v => v !== email);
    const newNotes = { ...userNotes };
    delete newNotes[email];
    setConfig({ ...config, viewers: newViewers, userNotes: newNotes });
    if (logAction) logAction("remove_viewer", { target: email, targetLabel: `移除訪客 - ${email}` });
    setConfirmRemove(null);
  };

  const saveNote = async (email) => {
    const trimmed = editNoteVal.trim();
    const newNotes = { ...userNotes };
    if (trimmed) newNotes[email] = trimmed;
    else delete newNotes[email];
    await setConfig({ ...config, userNotes: newNotes });
    setEditingNote(null);
    if (logAction) logAction("edit_user_note", {
      target: email,
      targetLabel: `編輯備註 - ${email}：${trimmed || "（清除）"}`,
    });
  };

  return (
    <section className="rounded-2xl p-4 sm:p-5 border-2"
             style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-[10px] tk-x mb-1" style={{ color: "var(--mute)" }}>
            VIEWERS · 訪客清單（可看不能編輯）
          </div>
          <div className="display-cn text-lg" style={{ color: "var(--ink)" }}>
            共 <span className="num">{viewers.length}</span> 位 <span style={{ fontSize: 18 }}>👀</span>
          </div>
        </div>
        {isOwner && !adding && (
          <button onClick={() => setAdding(true)}
                  className="btn-tactile flex items-center gap-1 px-3 py-1.5 rounded-full font-medium text-xs"
                  style={{ background: "var(--accent-2)", color: "#fff" }}>
            <Plus size={14} strokeWidth={2.5} />
            新增訪客
          </button>
        )}
      </div>

      {isOwner && (
        <div className="text-[11px] mb-3 px-3 py-2 rounded-lg"
             style={{ background: "var(--accent-bg)", color: "var(--accent-2)" }}>
          💡 直接新增家長 email 後,對方用該 email 登入即可看見資料。建議填備註（誰的家長）方便管理。
        </div>
      )}

      {adding && (
        <div className="mb-3 p-3 rounded-lg space-y-2" style={{ background: "var(--accent-bg)" }}>
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                 placeholder="家長 email,例如 parent@gmail.com"
                 className="w-full px-3 py-2 rounded-md border-2 text-sm num"
                 style={{ borderColor: "var(--accent-2)", background: "#fff" }} />
          <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
                 onKeyDown={e => e.key === "Enter" && add()}
                 placeholder="備註,例如：李晨睿的媽媽（選填）"
                 className="w-full px-3 py-2 rounded-md border-2 text-sm"
                 style={{ borderColor: "var(--accent-2)", background: "#fff" }} />
          <div className="flex gap-2">
            <button onClick={add} disabled={!newEmail.trim()}
                    className="btn-tactile flex-1 px-3 py-2 rounded-md text-xs font-medium"
                    style={{
                      background: newEmail.trim() ? "var(--accent-2)" : "var(--line)",
                      color: newEmail.trim() ? "#fff" : "var(--mute)",
                    }}>確認</button>
            <button onClick={() => { setAdding(false); setNewEmail(""); setNewNote(""); }}
                    className="btn-tactile px-3 py-2 rounded-md text-xs"
                    style={{ color: "var(--mute)" }}>取消</button>
          </div>
        </div>
      )}

      {viewers.length === 0 ? (
        <div className="text-center py-6 text-sm" style={{ color: "var(--mute)" }}>
          目前沒有訪客
        </div>
      ) : (
        <div className="space-y-1.5">
          {viewers.map(email => {
            const note = userNotes[email] || "";
            const isEditing = editingNote === email;
            return (
              <div key={email} className="px-3 py-2 rounded-lg"
                   style={{ background: "var(--bg)", border: "1px solid var(--line)" }}>
                <div className="flex items-center gap-2">
                  <User size={13} strokeWidth={2.5} style={{ color: "var(--mute)" }} />
                  <span className="num text-sm flex-1 break-all" style={{ color: "var(--ink-2)" }}>
                    {email}
                  </span>
                  {isOwner && !isEditing && (
                    confirmRemove === email ? (
                      <div className="flex gap-1">
                        <button onClick={() => setConfirmRemove(null)}
                                className="btn-tactile px-2 py-1 rounded-md text-[10px] border"
                                style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
                          取消
                        </button>
                        <button onClick={() => remove(email)}
                                className="btn-tactile px-2 py-1 rounded-md text-[10px] font-medium"
                                style={{ background: "var(--red)", color: "#fff" }}>
                          確認移除
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmRemove(email)}
                              className="btn-tactile w-7 h-7 rounded-md flex items-center justify-center"
                              style={{ background: "var(--panel-2)", color: "var(--mute)" }}>
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    )
                  )}
                </div>
                {isEditing ? (
                  <div className="flex gap-1 mt-1.5 pl-5">
                    <input type="text" value={editNoteVal} onChange={e => setEditNoteVal(e.target.value)}
                           onKeyDown={e => e.key === "Enter" && saveNote(email)}
                           autoFocus
                           placeholder="例如：李晨睿的媽媽"
                           className="flex-1 px-2 py-1 rounded border text-xs"
                           style={{ borderColor: "var(--accent-2)", background: "#fff" }} />
                    <button onClick={() => saveNote(email)}
                            className="btn-tactile px-2 py-1 rounded text-[10px] font-medium"
                            style={{ background: "var(--green)", color: "#fff" }}>儲存</button>
                    <button onClick={() => setEditingNote(null)}
                            className="btn-tactile px-2 py-1 rounded text-[10px]"
                            style={{ color: "var(--mute)" }}>取消</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5 pl-5">
                    {note ? (
                      <span className="text-[11px]" style={{ color: "var(--ink)" }}>
                        📝 {note}
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: "var(--mute)", opacity: 0.6 }}>
                        （無備註）
                      </span>
                    )}
                    {isOwner && (
                      <button onClick={() => { setEditingNote(email); setEditNoteVal(note); }}
                              className="text-[10px] underline"
                              style={{ color: "var(--mute)" }}>
                        {note ? "編輯" : "加備註"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function AdminListSection({ user, config, setConfig, isOwner, logAction }) {
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteVal, setEditNoteVal] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const admins = config.admins || [];
  const userNotes = config.userNotes || {};
  const ownerEmail = (config.owner || "").toLowerCase();
  const userEmail = (user.email || "").toLowerCase();

  const addAdmin = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) return;
    if (admins.map(a => a.toLowerCase()).includes(trimmed)) {
      setNewEmail("");
      setNewNote("");
      setAdding(false);
      return;
    }
    const newNotes = { ...userNotes };
    if (newNote.trim()) newNotes[trimmed] = newNote.trim();
    setConfig({ ...config, admins: [...admins, trimmed], userNotes: newNotes });
    if (logAction) {
      logAction("add_admin", {
        target: trimmed,
        targetLabel: `新增管理員 - ${trimmed}${newNote.trim() ? `（${newNote.trim()}）` : ""}`,
      });
    }
    setNewEmail("");
    setNewNote("");
    setAdding(false);
  };

  const removeAdmin = (email) => {
    if (admins.length <= 1) return;
    if (email.toLowerCase() === ownerEmail) return;
    const newNotes = { ...userNotes };
    delete newNotes[email];
    setConfig({ ...config, admins: admins.filter(a => a !== email), userNotes: newNotes });
    if (logAction) {
      logAction("remove_admin", {
        target: email,
        targetLabel: `移除管理員 - ${email}`,
      });
    }
    setConfirmRemove(null);
  };

  const saveNote = async (email) => {
    const trimmed = editNoteVal.trim();
    const newNotes = { ...userNotes };
    if (trimmed) newNotes[email] = trimmed;
    else delete newNotes[email];
    await setConfig({ ...config, userNotes: newNotes });
    setEditingNote(null);
    if (logAction) logAction("edit_user_note", {
      target: email,
      targetLabel: `編輯備註 - ${email}：${trimmed || "（清除）"}`,
    });
  };

  return (
    <section className="rounded-2xl p-4 sm:p-5 border-2"
             style={{ background: "var(--accent-bg)", borderColor: "var(--accent-2)" }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-[10px] tk-x mb-1" style={{ color: "var(--accent-2)" }}>
            ADMINS · 管理員清單
          </div>
          <div className="display-cn text-lg" style={{ color: "var(--accent-2)" }}>
            共 <span className="num">{admins.length}</span> 位
          </div>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)}
                  className="btn-tactile flex items-center gap-1 px-3 py-1.5 rounded-md border-2 text-xs font-medium"
                  style={{ borderColor: "var(--accent-2)", background: "var(--accent-2)", color: "#fff" }}>
            <Plus size={12} strokeWidth={2.5} />
            新增管理員
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-3 rounded-lg p-3 space-y-2" style={{ background: "var(--panel)", border: "2px solid var(--accent-2)" }}>
          <div>
            <div className="text-[11px] tk-l mb-1" style={{ color: "var(--mute)" }}>新管理員 Email</div>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                   placeholder="example@gmail.com"
                   className="w-full px-3 py-2 rounded-md border-2 text-sm num"
                   style={{ borderColor: "var(--line)" }}
                   autoFocus />
          </div>
          <div>
            <div className="text-[11px] tk-l mb-1" style={{ color: "var(--mute)" }}>備註（選填）</div>
            <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
                   onKeyDown={e => e.key === "Enter" && addAdmin()}
                   placeholder="例如：總教練 / 助教 / 體育老師"
                   className="w-full px-3 py-2 rounded-md border-2 text-sm"
                   style={{ borderColor: "var(--line)" }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setAdding(false); setNewEmail(""); setNewNote(""); }}
                    className="btn-tactile flex-1 px-3 py-2 rounded-md border text-xs"
                    style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
              取消
            </button>
            <button onClick={addAdmin}
                    className="btn-tactile flex-1 px-3 py-2 rounded-md border-2 text-xs font-medium"
                    style={{ borderColor: "var(--accent-2)", background: "var(--accent-2)", color: "#fff" }}>
              加入
            </button>
          </div>
          <div className="text-[10px] leading-relaxed" style={{ color: "var(--mute)" }}>
            必須是對方用來登入的 Google 帳號 Email，他下次刷新頁面就會獲得管理權限。
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {admins.map(email => {
          const isMe = email.toLowerCase() === userEmail;
          const isOwnerEntry = email.toLowerCase() === ownerEmail;
          const canRemove = admins.length > 1 && !isOwnerEntry;
          const note = userNotes[email] || "";
          const isEditing = editingNote === email;
          return (
            <div key={email} className="px-3 py-2 rounded-lg"
                 style={{
                   background: "var(--panel)",
                   border: isOwnerEntry ? "2px solid var(--accent-2)" : "1px solid var(--accent)",
                 }}>
              <div className="flex items-center gap-2">
                {isOwnerEntry ? (
                  <Crown size={13} strokeWidth={2.5} style={{ color: "#F6C53C", fill: "#F6C53C" }} />
                ) : (
                  <User size={13} strokeWidth={2.5} style={{ color: "var(--accent-2)" }} />
                )}
                <span className="num text-sm flex-1 break-all" style={{ color: "var(--accent-2)" }}>
                  {email}
                </span>
                {isOwnerEntry && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: "var(--accent-2)", color: "#F6C53C", border: "1px solid #F6C53C" }}>
                    主管理員
                  </span>
                )}
                {isMe && !isOwnerEntry && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: "var(--accent-2)", color: "#fff" }}>
                    你
                  </span>
                )}
                {!isEditing && (
                  <button onClick={() => setConfirmRemove(email)}
                          disabled={!canRemove}
                          title={isOwnerEntry ? "主管理員不能被移除" : canRemove ? "移除管理員" : "至少需保留一位管理員"}
                          className="btn-tactile w-7 h-7 rounded flex items-center justify-center"
                          style={{
                            color: canRemove ? "var(--red)" : "var(--line-strong)",
                            cursor: canRemove ? "pointer" : "not-allowed",
                            opacity: canRemove ? 1 : 0.4,
                          }}>
                    <X size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              {/* 備註行 */}
              {isEditing ? (
                <div className="flex gap-1 mt-1.5 pl-5">
                  <input type="text" value={editNoteVal} onChange={e => setEditNoteVal(e.target.value)}
                         onKeyDown={e => e.key === "Enter" && saveNote(email)}
                         autoFocus
                         placeholder="例如：總教練 / 助教"
                         className="flex-1 px-2 py-1 rounded border text-xs"
                         style={{ borderColor: "var(--accent-2)", background: "#fff" }} />
                  <button onClick={() => saveNote(email)}
                          className="btn-tactile px-2 py-1 rounded text-[10px] font-medium"
                          style={{ background: "var(--green)", color: "#fff" }}>儲存</button>
                  <button onClick={() => setEditingNote(null)}
                          className="btn-tactile px-2 py-1 rounded text-[10px]"
                          style={{ color: "var(--mute)" }}>取消</button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5 pl-5">
                  {note ? (
                    <span className="text-[11px]" style={{ color: "var(--ink)" }}>
                      📝 {note}
                    </span>
                  ) : (
                    <span className="text-[11px]" style={{ color: "var(--mute)", opacity: 0.6 }}>
                      （無備註）
                    </span>
                  )}
                  {isOwner && (
                    <button onClick={() => { setEditingNote(email); setEditNoteVal(note); }}
                            className="text-[10px] underline"
                            style={{ color: "var(--mute)" }}>
                      {note ? "編輯" : "加備註"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {confirmRemove && (
        <ModalShell onClose={() => setConfirmRemove(null)}>
          <div className="display-cn text-lg mb-2" style={{ color: "var(--red)" }}>
            移除管理員？
          </div>
          <div className="text-sm mb-1" style={{ color: "var(--ink)" }}>
            確定要移除：
          </div>
          <div className="num text-sm font-medium mb-3" style={{ color: "var(--accent-2)" }}>
            {confirmRemove}
          </div>
          {confirmRemove.toLowerCase() === userEmail && (
            <div className="rounded-md p-3 text-xs leading-relaxed mb-3"
                 style={{ background: "var(--amber-bg)", color: "#5C4810", border: "1px solid var(--amber)" }}>
              ⚠ 你即將移除自己。移除後將無法再編輯名單 / 課表，需請其他管理員重新加你。
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setConfirmRemove(null)}
                    className="btn-tactile flex-1 py-2 rounded-md border-2 font-medium"
                    style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
              取消
            </button>
            <button onClick={() => removeAdmin(confirmRemove)}
                    className="btn-tactile flex-1 py-2 rounded-md border-2 font-medium"
                    style={{ borderColor: "var(--red)", background: "var(--red)", color: "#fff" }}>
              確認移除
            </button>
          </div>
        </ModalShell>
      )}
    </section>
  );
}

function ManagementRow({ m, onEditInfo, onEditSch, onDelete }) {
  const schDays = ["一","二","三","四","五","六"];
  const sessionCount = m.sch.filter(x => x === 1).length;
  return (
    <div className="rounded-xl border-2 p-3 sm:p-4"
         style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="num text-xs tabular-nums shrink-0"
              style={{ color: "var(--mute)", minWidth: "26px" }}>
          {pad(m.seq)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-medium" style={{ color: "var(--ink)" }}>
              {m.name}
            </span>
            <span className="num text-xs" style={{ color: "var(--mute)" }}>
              {m.cls}-{pad(m.num)}
            </span>
          </div>
          <div className="text-[11px] mt-1 flex items-center gap-2 flex-wrap"
               style={{ color: "var(--ink-2)" }}>
            <span style={{ color: "var(--mute)" }}>表定：</span>
            {[0,1,2,3,4,5].map(di => {
              const am = m.sch[di * 2] === 1;
              const pm = m.sch[di * 2 + 1] === 1;
              if (!am && !pm) return null;
              return (
                <span key={di} className="num">
                  {schDays[di]}{am && pm ? "(全)" : am ? "(早)" : "(午)"}
                </span>
              );
            })}
            <span className="num" style={{ color: "var(--accent)", fontWeight: 600 }}>
              · {sessionCount}場/週
            </span>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={onEditInfo}
                  className="btn-tactile flex items-center gap-1 px-2.5 py-1.5 rounded text-xs border"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            <Edit3 size={12} strokeWidth={2.5} />
            資料
          </button>
          <button onClick={onEditSch}
                  className="btn-tactile flex items-center gap-1 px-2.5 py-1.5 rounded text-xs border"
                  style={{ borderColor: "var(--accent)", color: "var(--accent-2)", background: "var(--accent-bg)" }}>
            <CalendarDays size={12} strokeWidth={2.5} />
            課表
          </button>
          <button onClick={onDelete}
                  className="btn-tactile flex items-center gap-1 px-2.5 py-1.5 rounded text-xs border"
                  style={{ borderColor: "var(--red)", color: "var(--red)" }}>
            <Trash2 size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPersonModal({ person, isNew, onSave, onCancel }) {
  const [name, setName] = useState(person.name || "");
  const [cls, setCls] = useState(person.cls || "");
  const [num, setNum] = useState(person.num || "");
  const [grade, setGrade] = useState(person.grade || 7);
  const valid = name.trim() && cls && num !== "";

  const handleSave = () => {
    if (!valid) return;
    onSave({
      name: name.trim(),
      cls: Number(cls),
      num: Number(num),
      grade: Number(grade),
      ...(isNew ? { sch: person.sch } : {}),
    });
  };

  return (
    <ModalShell onClose={onCancel}>
      <div className="display-cn text-lg mb-3" style={{ color: "var(--accent-2)" }}>
        {isNew ? "新增隊員" : `編輯資料 - ${person.name}`}
      </div>
      <div className="space-y-3">
        <Field label="姓名">
          <input value={name} onChange={e => setName(e.target.value)}
                 className="w-full px-3 py-2 rounded-md border-2 text-base"
                 style={{ borderColor: "var(--line)" }}
                 placeholder="例：王小明" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="班級">
            <input type="number" value={cls} onChange={e => setCls(e.target.value)}
                   className="w-full px-3 py-2 rounded-md border-2 text-base num"
                   style={{ borderColor: "var(--line)" }}
                   placeholder="例：701" />
          </Field>
          <Field label="座號">
            <input type="number" value={num} onChange={e => setNum(e.target.value)}
                   className="w-full px-3 py-2 rounded-md border-2 text-base num"
                   style={{ borderColor: "var(--line)" }}
                   placeholder="例：15" />
          </Field>
        </div>
        <Field label="年級">
          <div className="grid grid-cols-3 gap-2">
            {[9, 8, 7].map(g => (
              <button key={g} onClick={() => setGrade(g)}
                      className="btn-tactile py-2 rounded-md border-2 text-sm font-medium"
                      style={{
                        borderColor: grade === g ? "var(--accent-2)" : "var(--line)",
                        background: grade === g ? "var(--accent-2)" : "transparent",
                        color: grade === g ? "#fff" : "var(--ink-2)",
                      }}>
                {GRADE_NAMES[g]}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <ModalFooter onCancel={onCancel} onSave={handleSave} disabled={!valid} />
      {isNew && (
        <p className="text-[11px] mt-3 text-center" style={{ color: "var(--mute)" }}>
          新增完成後可以再進入「課表」設定每週訓練時段
        </p>
      )}
    </ModalShell>
  );
}

function EditScheduleModal({ person, onSave, onCancel }) {
  const [sch, setSch] = useState([...person.sch]);
  const days = ["週一", "週二", "週三", "週四", "週五", "週六"];

  const toggle = (i) => {
    setSch(prev => prev.map((v, idx) => idx === i ? (v === 1 ? 0 : 1) : v));
  };
  const setRow = (di, val) => {
    setSch(prev => prev.map((v, idx) => (idx === di * 2 || idx === di * 2 + 1) ? val : v));
  };
  const setAll = (val) => setSch(Array(12).fill(val));

  const total = sch.filter(x => x === 1).length;

  return (
    <ModalShell onClose={onCancel}>
      <div className="display-cn text-lg mb-1" style={{ color: "var(--accent-2)" }}>
        編輯課表 - {person.name}
      </div>
      <div className="text-xs mb-4" style={{ color: "var(--mute)" }}>
        {person.cls}-{pad(person.num)} · {GRADE_NAMES[person.grade]}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setAll(1)}
                className="btn-tactile flex-1 py-1.5 rounded text-xs border"
                style={{ borderColor: "var(--green)", color: "var(--green)" }}>
          全部出席
        </button>
        <button onClick={() => setAll(0)}
                className="btn-tactile flex-1 py-1.5 rounded text-xs border"
                style={{ borderColor: "var(--line-strong)", color: "var(--mute)" }}>
          全部清除
        </button>
      </div>

      {/* Schedule grid */}
      <div className="rounded-lg border-2 overflow-hidden"
           style={{ borderColor: "var(--accent-2)" }}>
        <div className="grid grid-cols-4 text-[11px] font-medium"
             style={{ background: "var(--accent-2)", color: "#fff" }}>
          <div className="px-2 py-2">星期</div>
          <div className="px-2 py-2 text-center flex items-center justify-center gap-1">
            <Sun size={11} />早訓
          </div>
          <div className="px-2 py-2 text-center flex items-center justify-center gap-1">
            <Moon size={11} />午訓
          </div>
          <div className="px-2 py-2 text-center text-[10px]">全選</div>
        </div>
        {days.map((d, di) => {
          const am = sch[di * 2] === 1;
          const pm = sch[di * 2 + 1] === 1;
          return (
            <div key={di} className="grid grid-cols-4 items-center"
                 style={{
                   borderTop: di === 0 ? "none" : "1px solid var(--line)",
                   background: di % 2 === 0 ? "var(--panel)" : "var(--panel-2)",
                 }}>
              <div className="px-2 py-2 text-sm font-medium" style={{ color: "var(--ink)" }}>
                {d}{di === 5 ? <span className="text-[10px]" style={{ color: "var(--mute)" }}> (永運)</span> : null}
              </div>
              <SchToggle on={am} onClick={() => toggle(di * 2)} />
              <SchToggle on={pm} onClick={() => toggle(di * 2 + 1)} />
              <div className="flex justify-center">
                <button onClick={() => setRow(di, am && pm ? 0 : 1)}
                        className="btn-tactile text-[10px] px-2 py-0.5 rounded"
                        style={{
                          background: am && pm ? "var(--accent-2)" : "transparent",
                          color: am && pm ? "#fff" : "var(--ink-2)",
                          border: `1px solid ${am && pm ? "var(--accent-2)" : "var(--line-strong)"}`,
                        }}>
                  {am && pm ? "✓" : "全選"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-xs mt-3" style={{ color: "var(--ink-2)" }}>
        共 <span className="num font-bold" style={{ color: "var(--accent-2)" }}>{total}</span> 場 / 週
      </div>

      <ModalFooter onCancel={onCancel} onSave={() => onSave(sch)} />
    </ModalShell>
  );
}

function SchToggle({ on, onClick }) {
  return (
    <div className="flex justify-center">
      <button onClick={onClick}
              className="btn-tactile w-10 h-10 rounded-md flex items-center justify-center"
              style={{
                background: on ? "var(--green)" : "transparent",
                color: on ? "#fff" : "var(--mute)",
                border: `2px solid ${on ? "var(--green)" : "var(--line)"}`,
              }}>
        {on ? <Check size={18} strokeWidth={3.5} /> : <X size={14} strokeWidth={2.5} style={{ opacity: 0.4 }} />}
      </button>
    </div>
  );
}

function ConfirmDeleteModal({ person, onConfirm, onCancel }) {
  return (
    <ModalShell onClose={onCancel}>
      <div className="display-cn text-lg mb-2" style={{ color: "var(--red)" }}>
        確認刪除？
      </div>
      <div className="text-sm mb-1" style={{ color: "var(--ink)" }}>
        即將刪除隊員：<strong>{person.name}</strong>
      </div>
      <div className="text-xs mb-4" style={{ color: "var(--mute)" }}>
        {person.cls}-{pad(person.num)} · {GRADE_NAMES[person.grade]}
      </div>
      <div className="rounded-md p-3 text-xs leading-relaxed mb-4"
           style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red)" }}>
        此動作不可復原。已點過名的歷史紀錄不會被刪除，但這位隊員將不再出現於日後的點名表。
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel}
                className="btn-tactile flex-1 py-2 rounded-md border-2 font-medium"
                style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
          取消
        </button>
        <button onClick={onConfirm}
                className="btn-tactile flex-1 py-2 rounded-md border-2 font-medium"
                style={{ borderColor: "var(--red)", background: "var(--red)", color: "#fff" }}>
          確認刪除
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
         style={{ background: "rgba(20,18,16,0.55)" }}
         onClick={onClose}>
      <div className="rounded-2xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
           style={{ background: "var(--panel)", border: "2px solid var(--accent-2)" }}
           onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onSave, disabled }) {
  return (
    <div className="flex gap-2 mt-4">
      <button onClick={onCancel}
              className="btn-tactile flex-1 py-2 rounded-md border-2 font-medium"
              style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
        取消
      </button>
      <button onClick={onSave} disabled={disabled}
              className="btn-tactile flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border-2 font-medium"
              style={{
                borderColor: disabled ? "var(--line)" : "var(--accent-2)",
                background: disabled ? "transparent" : "var(--accent-2)",
                color: disabled ? "var(--mute)" : "#fff",
                cursor: disabled ? "not-allowed" : "pointer",
              }}>
        <Save size={14} strokeWidth={2.5} />
        儲存
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[11px] tk-l mb-1" style={{ color: "var(--mute)" }}>
        {label}
      </div>
      {children}
    </label>
  );
}

// ============ AUDIT LOG VIEW (主管理員專屬) ============
function AuditLogView({ user, logAction }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [pageSize, setPageSize] = useState(50);

  // 載入紀錄
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const colRef = collection(db, "teams", "longmen", "audit_log");
        const q = query(colRef, orderBy("timestamp", "desc"), limit(pageSize));
        const snap = await getDocs(q);
        const arr = [];
        snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
        if (!cancelled) {
          setLogs(arr);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load logs:", err);
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [pageSize]);

  // Filter
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (filterAction !== "all" && !l.action?.startsWith(filterAction)) return false;
      if (filterUser !== "all" && l.user !== filterUser) return false;
      return true;
    });
  }, [logs, filterAction, filterUser]);

  const userList = useMemo(() => {
    const set = new Set();
    logs.forEach(l => l.user && set.add(l.user));
    return Array.from(set);
  }, [logs]);

  const exportLogsCSV = () => {
    const lines = [
      ["時間", "操作者", "動作類型", "對象", "備註"].join(",")
    ];
    filteredLogs.forEach(l => {
      lines.push([
        new Date(l.timestamp).toLocaleString("zh-TW"),
        l.user || "",
        ACTION_LABELS[l.action] || l.action,
        l.targetLabel || l.target || "",
        (l.note || "").replace(/[\r\n,]/g, " "),
      ].join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `編輯紀錄_${toDateStr(new Date())}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const reload = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, "teams", "longmen", "audit_log");
      const q = query(colRef, orderBy("timestamp", "desc"), limit(pageSize));
      const snap = await getDocs(q);
      const arr = [];
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
      setLogs(arr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <section className="rounded-2xl p-4 sm:p-5 border-2"
               style={{ background: "var(--accent-2)", borderColor: "var(--accent-2)", color: "#fff" }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <History size={20} strokeWidth={2.5} style={{ color: "#F6C53C" }} />
            <div>
              <div className="text-[10px] tk-x" style={{ color: "rgba(255,255,255,0.6)" }}>
                AUDIT LOG · 編輯紀錄
              </div>
              <div className="display-cn text-lg sm:text-xl">主管理員後台</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={reload}
                    className="btn-tactile flex items-center gap-1 px-3 py-1.5 rounded text-xs border"
                    style={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff" }}>
              <RefreshCw size={12} strokeWidth={2.5} />
              重新載入
            </button>
            <button onClick={exportLogsCSV}
                    className="btn-tactile flex items-center gap-1 px-3 py-1.5 rounded text-xs border-2 font-medium"
                    style={{ borderColor: "#F6C53C", background: "#F6C53C", color: "var(--accent-2)" }}>
              <Download size={12} strokeWidth={2.5} />
              匯出
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
          所有編輯動作的完整紀錄。僅主管理員可看。資料永久保留。
        </div>
      </section>

      {/* Filters */}
      <section className="rounded-xl p-3 border"
               style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Filter size={12} strokeWidth={2.5} style={{ color: "var(--mute)" }} />
          <span className="tk-l" style={{ color: "var(--mute)" }}>篩選</span>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
                  className="px-2 py-1 rounded border text-xs"
                  style={{ borderColor: "var(--line)" }}>
            <option value="all">全部動作</option>
            <option value="edit_attendance">點名修改</option>
            <option value="add_person">新增隊員</option>
            <option value="edit_person">編輯隊員</option>
            <option value="delete_person">刪除隊員</option>
            <option value="restore_person">還原隊員</option>
            <option value="permanent_delete_person">永久刪除</option>
            <option value="add_admin">新增管理員</option>
            <option value="remove_admin">移除管理員</option>
          </select>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
                  className="px-2 py-1 rounded border text-xs num"
                  style={{ borderColor: "var(--line)" }}>
            <option value="all">所有操作者</option>
            {userList.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded border text-xs"
                  style={{ borderColor: "var(--line)" }}>
            <option value={50}>最近 50 筆</option>
            <option value={100}>最近 100 筆</option>
            <option value={500}>最近 500 筆</option>
          </select>
          <span className="ml-auto num text-[11px]" style={{ color: "var(--mute)" }}>
            顯示 {filteredLogs.length} / 共 {logs.length} 筆
          </span>
        </div>
      </section>

      {/* Logs */}
      {loading ? (
        <div className="text-center py-12" style={{ color: "var(--mute)" }}>
          <RefreshCw size={20} className="inline animate-spin mr-2" />
          載入中...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 rounded-xl border-2 border-dashed"
             style={{ borderColor: "var(--line)", color: "var(--mute)" }}>
          <FileText size={28} className="inline mb-2" />
          <div className="text-sm">沒有符合條件的紀錄</div>
        </div>
      ) : (
        <section className="space-y-2">
          {filteredLogs.map(log => <AuditLogRow key={log.id} log={log} />)}
        </section>
      )}
    </div>
  );
}

const ACTION_LABELS = {
  edit_attendance: "✏️ 點名修改",
  add_person: "➕ 新增隊員",
  edit_person: "✏️ 編輯隊員",
  delete_person: "🗑️ 軟刪除隊員",
  restore_person: "⏪ 還原隊員",
  permanent_delete_person: "🔥 永久刪除",
  add_admin: "👤 新增管理員",
  remove_admin: "✗ 移除管理員",
  set_first_owner: "👑 初始化主管理員",
  reimport_calendar: "🔄 重新匯入行事曆",
  edit_calendar: "📅 編輯行事曆",
  export_roster: "📥 匯出隊員名單",
  promote_grade: "🎓 升年級",
  lock_month: "🔒 鎖定月份",
  unlock_month: "🔓 解鎖月份",
  approve_viewer: "✓ 核准訪客",
  reject_viewer: "✕ 拒絕訪客",
  remove_viewer: "🗑 移除訪客",
  request_access: "📨 申請存取",
};

function AuditLogRow({ log }) {
  const [expanded, setExpanded] = useState(false);
  const dt = new Date(log.timestamp);
  const dateStr = dt.toLocaleDateString("zh-TW");
  const timeStr = dt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
  const label = ACTION_LABELS[log.action] || log.action;
  const hasDetails = log.before || log.after || log.note;

  // 動作類型決定顏色
  let accent = "var(--ink)";
  if (log.action?.includes("delete")) accent = "var(--red)";
  else if (log.action?.includes("add") || log.action?.includes("restore")) accent = "var(--green)";
  else if (log.action?.includes("edit")) accent = "var(--blue)";
  else if (log.action === "set_first_owner") accent = "var(--accent-2)";

  return (
    <div className="rounded-xl border p-3"
         style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <div className="num text-[10px]" style={{ color: "var(--mute)", minWidth: 80 }}>
          {dateStr} {timeStr}
        </div>
        <span className="text-sm font-medium" style={{ color: accent }}>
          {label}
        </span>
        <span className="num text-[11px]" style={{ color: "var(--mute)" }}>
          by {log.user}
        </span>
        {hasDetails && (
          <button onClick={() => setExpanded(e => !e)}
                  className="ml-auto text-[11px] px-2 py-0.5 rounded border"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            {expanded ? "收合" : "詳情"}
          </button>
        )}
      </div>
      {log.targetLabel && (
        <div className="text-sm mt-1" style={{ color: "var(--ink)" }}>
          {log.targetLabel}
        </div>
      )}
      {expanded && (
        <div className="mt-2 pt-2 border-t text-xs space-y-2"
             style={{ borderColor: "var(--line)" }}>
          {log.note && (
            <div>
              <div className="text-[10px] tk-l mb-1" style={{ color: "var(--mute)" }}>備註</div>
              <div style={{ color: "var(--ink-2)" }}>{log.note}</div>
            </div>
          )}
          {log.before && (
            <div>
              <div className="text-[10px] tk-l mb-1" style={{ color: "var(--red)" }}>修改前</div>
              <pre className="text-[10px] p-2 rounded overflow-x-auto"
                   style={{ background: "var(--red-bg)", color: "var(--ink-2)" }}>
                {JSON.stringify(log.before, null, 2)}
              </pre>
            </div>
          )}
          {log.after && (
            <div>
              <div className="text-[10px] tk-l mb-1" style={{ color: "var(--green)" }}>修改後</div>
              <pre className="text-[10px] p-2 rounded overflow-x-auto"
                   style={{ background: "var(--green-bg)", color: "var(--ink-2)" }}>
                {JSON.stringify(log.after, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ SETTINGS VIEW ============
function SettingsView({ user, attendance, setAttendance, roster, setRoster, logAction }) {
  const [reimporting, setReimporting] = useState(false);
  const [confirmStep, setConfirmStep] = useState(0); // 0=idle, 1=confirm, 2=done
  const [resultText, setResultText] = useState("");
  // 升年級狀態
  const [pgConfirm, setPgConfirm] = useState(0); // 0=idle, 1=preview, 2=confirm, 3=done
  const [pgResult, setPgResult] = useState("");

  // 計算行事曆統計
  const calStats = useMemo(() => {
    const dates = Object.keys(VENUE_CALENDAR);
    const months = new Set(dates.map(d => d.slice(0, 7)));
    let yyDays = 0, longmenDays = 0, closedDays = 0;
    let yyAm = 0, yyPm = 0;
    Object.values(VENUE_CALENDAR).forEach(v => {
      if (v.am === "yongyun") yyAm++;
      if (v.pm === "yongyun") yyPm++;
      if (v.am === "yongyun" || v.pm === "yongyun") yyDays++;
      if (v.am === "longmen" || v.pm === "longmen") longmenDays++;
      if (v.am === "closed" && v.pm === "closed") closedDays++;
    });
    return {
      total: dates.length,
      months: months.size,
      firstDate: dates.sort()[0],
      lastDate: dates.sort().slice(-1)[0],
      yyAm, yyPm,
      yyDays, longmenDays, closedDays,
      noteDays: Object.values(VENUE_CALENDAR).filter(v => v.note).length,
    };
  }, []);

  // 判斷一天是否「已有任何點名資料」
  // 包含：任何人的 am/pm 點名、遲到、個練、備註、整日備註
  const hasAttendanceData = (dayData) => {
    if (!dayData) return false;
    const checkObj = (o) => o && Object.keys(o).length > 0;
    if (checkObj(dayData.am)) return true;
    if (checkObj(dayData.pm)) return true;
    if (checkObj(dayData.am_late)) return true;
    if (checkObj(dayData.pm_late)) return true;
    if (checkObj(dayData.am_solo)) return true;
    if (checkObj(dayData.pm_solo)) return true;
    if (checkObj(dayData.am_notes)) return true;
    if (checkObj(dayData.pm_notes)) return true;
    if (dayData.notes && dayData.notes.trim()) return true;
    return false;
  };

  // 預覽：哪些日期會被覆蓋、哪些會被保留
  const reimportPreview = useMemo(() => {
    const willUpdate = [];   // 沒人點名 → 會被重設
    const willKeep = [];     // 有人點名 → 保留
    Object.keys(VENUE_CALENDAR).forEach(dateStr => {
      const dayData = attendance[dateStr];
      if (hasAttendanceData(dayData)) {
        willKeep.push(dateStr);
      } else {
        willUpdate.push(dateStr);
      }
    });
    return { willUpdate: willUpdate.length, willKeep: willKeep.length };
  }, [attendance]);

  const doReimport = async () => {
    setReimporting(true);
    let updatedCount = 0;
    let skippedCount = 0;
    const updateDates = [];

    setAttendance(prev => {
      const next = { ...prev };
      Object.keys(VENUE_CALENDAR).forEach(dateStr => {
        const dayData = next[dateStr];
        if (hasAttendanceData(dayData)) {
          skippedCount++;
          return;
        }
        // 重設此日的場地（保留可能存在的整日備註，因為使用者可能加過）
        const calEntry = VENUE_CALENDAR[dateStr];
        const newDay = { ...(dayData || {}) };
        newDay.venue = { am: calEntry.am, pm: calEntry.pm };
        // 如果該日沒人手動加過備註且行事曆有備註 → 套用
        if (!newDay.notes && calEntry.note) {
          newDay.notes = calEntry.note;
        }
        next[dateStr] = newDay;
        updatedCount++;
        if (updateDates.length < 5) updateDates.push(dateStr);
      });
      return next;
    }, {
      // 不指定 dateStr，所以這個 setAttendance 只會本地保存（合理：是大量批次操作）
      // 實際每日資料的儲存由 setAttendance 內建邏輯處理
      logPayload: null, // 不寫到日誌（我們手動寫一筆統合的）
    });

    // 補一筆統合的編輯紀錄
    if (logAction) {
      try {
        await logAction({
          action: "reimport_calendar",
          target: "calendar",
          targetLabel: `重新匯入行事曆（更新 ${updatedCount} 天，保留 ${skippedCount} 天）`,
          before: null,
          after: { updatedCount, skippedCount, sampleDates: updateDates },
          note: "從 Excel 行事曆預設值重新匯入。已有點名資料的日期保持原樣。",
        });
      } catch (e) {
        console.error("logAction failed:", e);
      }
    }

    setResultText(`✅ 重新匯入完成！更新 ${updatedCount} 天、保留 ${skippedCount} 天（已有點名資料）`);
    setConfirmStep(2);
    setReimporting(false);
  };

  return (
    <div className="space-y-4">
      <header>
        <h2 className="display-cn text-xl sm:text-2xl mb-1" style={{ color: "var(--ink)" }}>
          ⚙️ 系統設定
        </h2>
        <p className="text-xs sm:text-sm" style={{ color: "var(--mute)" }}>
          重要管理功能（僅主管理員可存取）
        </p>
      </header>

      {/* 行事曆狀態 */}
      <section className="rounded-2xl border-2 p-4 sm:p-5"
               style={{ background: "var(--panel)", borderColor: "var(--line-strong)" }}>
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={18} strokeWidth={2.5} style={{ color: "var(--ink-2)" }} />
          <h3 className="display-cn text-base sm:text-lg" style={{ color: "var(--ink)" }}>
            Excel 行事曆狀態
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div>
            <div className="text-[10px] tk-l" style={{ color: "var(--mute)" }}>涵蓋月份</div>
            <div className="num text-2xl font-bold" style={{ color: "var(--ink)" }}>{calStats.months}</div>
            <div className="text-[10px]" style={{ color: "var(--mute)" }}>個月</div>
          </div>
          <div>
            <div className="text-[10px] tk-l" style={{ color: "var(--mute)" }}>總天數</div>
            <div className="num text-2xl font-bold" style={{ color: "var(--ink)" }}>{calStats.total}</div>
            <div className="text-[10px]" style={{ color: "var(--mute)" }}>天</div>
          </div>
          <div>
            <div className="text-[10px] tk-l" style={{ color: VENUES.yongyun.color }}>永運場次</div>
            <div className="num text-2xl font-bold" style={{ color: VENUES.yongyun.color }}>
              {calStats.yyAm + calStats.yyPm}
            </div>
            <div className="text-[10px]" style={{ color: "var(--mute)" }}>場 (早+午)</div>
          </div>
          <div>
            <div className="text-[10px] tk-l" style={{ color: VENUES.closed.color }}>整日停練</div>
            <div className="num text-2xl font-bold" style={{ color: VENUES.closed.color }}>
              {calStats.closedDays}
            </div>
            <div className="text-[10px]" style={{ color: "var(--mute)" }}>天</div>
          </div>
        </div>
        <div className="text-xs px-3 py-2 rounded-lg"
             style={{ background: "var(--panel-2)", color: "var(--ink-2)" }}>
          📅 範圍：<span className="num">{calStats.firstDate}</span> ~ <span className="num">{calStats.lastDate}</span>
          {" · "}
          <span style={{ color: "var(--mute)" }}>
            其中 {calStats.noteDays} 天有特殊備註（比賽、月考、節日）
          </span>
        </div>
      </section>

      {/* 重新匯入行事曆 */}
      <section className="rounded-2xl border-2 p-4 sm:p-5"
               style={{ background: "var(--amber-bg)", borderColor: "var(--amber)" }}>
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw size={18} strokeWidth={2.5} style={{ color: "#5C4810" }} />
          <h3 className="display-cn text-base sm:text-lg" style={{ color: "#5C4810" }}>
            重新匯入行事曆
          </h3>
        </div>
        <div className="text-xs sm:text-sm space-y-2 mb-3" style={{ color: "#5C4810" }}>
          <p>從 Excel 行事曆重新套用場地預設值。</p>
          <p>
            ✅ <strong>不會影響</strong>已有任何點名資料的日期（出席/缺席/遲到/個練/備註）
          </p>
          <p>
            🔄 <strong>會重設</strong>沒人點過名的日期，套用 Excel 排定的場地
          </p>
        </div>

        {/* 預覽 */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-lg p-3" style={{ background: "rgba(255, 255, 255, 0.6)" }}>
            <div className="text-[10px] tk-l" style={{ color: "#5C4810" }}>會被重設</div>
            <div className="num text-2xl font-bold" style={{ color: "#5C4810" }}>{reimportPreview.willUpdate}</div>
            <div className="text-[10px]" style={{ color: "#5C4810", opacity: 0.7 }}>天（沒人點名）</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: "rgba(255, 255, 255, 0.6)" }}>
            <div className="text-[10px] tk-l" style={{ color: "var(--green)" }}>會被保留</div>
            <div className="num text-2xl font-bold" style={{ color: "var(--green)" }}>{reimportPreview.willKeep}</div>
            <div className="text-[10px]" style={{ color: "#5C4810", opacity: 0.7 }}>天（已有點名）</div>
          </div>
        </div>

        {confirmStep === 0 && (
          <button onClick={() => setConfirmStep(1)}
                  className="btn-tactile w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm"
                  style={{ background: "var(--amber)", color: "#3D2F00" }}>
            <RefreshCw size={14} strokeWidth={2.5} />
            重新匯入行事曆
          </button>
        )}

        {confirmStep === 1 && (
          <div className="space-y-2">
            <div className="rounded-lg p-3 border-2"
                 style={{ background: "var(--red-bg)", borderColor: "var(--red)" }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} strokeWidth={2.5} style={{ color: "var(--red)" }} />
                <span className="font-bold text-sm" style={{ color: "var(--red)" }}>確認要重新匯入嗎？</span>
              </div>
              <p className="text-xs" style={{ color: "var(--ink-2)" }}>
                將更新 <strong>{reimportPreview.willUpdate}</strong> 天的場地設定。
                此動作會記錄在編輯紀錄中。
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmStep(0)} disabled={reimporting}
                      className="btn-tactile flex-1 px-4 py-2 rounded-lg text-sm font-medium border-2"
                      style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
                取消
              </button>
              <button onClick={doReimport} disabled={reimporting}
                      className="btn-tactile flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: "var(--red)", color: "#fff", opacity: reimporting ? 0.6 : 1 }}>
                {reimporting ? "處理中..." : "✓ 確認執行"}
              </button>
            </div>
          </div>
        )}

        {confirmStep === 2 && (
          <div className="rounded-lg p-3 border-2"
               style={{ background: "var(--green-bg)", borderColor: "var(--green)" }}>
            <div className="text-sm font-bold mb-1" style={{ color: "var(--green)" }}>
              {resultText}
            </div>
            <button onClick={() => setConfirmStep(0)}
                    className="btn-tactile mt-2 px-3 py-1 rounded text-xs"
                    style={{ background: "var(--ink)", color: "var(--bg)" }}>
              關閉
            </button>
          </div>
        )}
      </section>

      {/* 月份鎖定區 */}
      <section className="rounded-2xl p-4 sm:p-5 border-2"
               style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <h3 className="display-cn text-base sm:text-lg mb-2" style={{ color: "var(--ink)" }}>
          🔒 月份鎖定
        </h3>
        <p className="text-xs mb-3" style={{ color: "var(--mute)" }}>
          每月底鎖定該月，之後修改隊員訓練表（sch）不會影響該月歷史統計。<br/>
          鎖定時系統會把當下訓練表「快照」存進去。
        </p>
        <MonthLockSection
          attendance={attendance}
          setAttendance={setAttendance}
          roster={roster}
          user={user}
          logAction={logAction}
        />
      </section>

      <section className="rounded-2xl p-4 sm:p-5 border-2"
               style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <h3 className="display-cn text-base sm:text-lg mb-3" style={{ color: "var(--ink)" }}>
          🎓 升年級工具
        </h3>
        <p className="text-xs mb-4" style={{ color: "var(--mute)" }}>
          學期末用：9 年級畢業（軟刪除）、8 年級升 9、7 年級升 8。歷史紀錄全部保留。
        </p>

        {(() => {
          const grade9 = roster.filter(p => p.grade === 9);
          const grade8 = roster.filter(p => p.grade === 8);
          const grade7 = roster.filter(p => p.grade === 7);
          return (
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
              <div className="rounded-lg p-3 border-2"
                   style={{ background: "var(--red-bg)", borderColor: "var(--red)" }}>
                <div className="font-bold mb-1" style={{ color: "var(--red)" }}>9 年級 → 畢業</div>
                <div className="num text-2xl font-bold" style={{ color: "var(--red)" }}>{grade9.length}</div>
                <div style={{ color: "var(--ink-2)" }}>位將軟刪除</div>
              </div>
              <div className="rounded-lg p-3 border-2"
                   style={{ background: "var(--accent-bg)", borderColor: "var(--accent)" }}>
                <div className="font-bold mb-1" style={{ color: "var(--accent-2)" }}>8 → 9 年級</div>
                <div className="num text-2xl font-bold" style={{ color: "var(--accent-2)" }}>{grade8.length}</div>
                <div style={{ color: "var(--ink-2)" }}>位升年級</div>
              </div>
              <div className="rounded-lg p-3 border-2"
                   style={{ background: "var(--green-bg)", borderColor: "var(--green)" }}>
                <div className="font-bold mb-1" style={{ color: "var(--green)" }}>7 → 8 年級</div>
                <div className="num text-2xl font-bold" style={{ color: "var(--green)" }}>{grade7.length}</div>
                <div style={{ color: "var(--ink-2)" }}>位升年級</div>
              </div>
            </div>
          );
        })()}

        {pgConfirm === 0 && (
          <button onClick={() => setPgConfirm(1)}
                  className="btn-tactile w-full px-4 py-3 rounded-lg font-medium border-2 flex items-center justify-center gap-2"
                  style={{ background: "var(--accent-bg)", borderColor: "var(--accent)", color: "var(--accent-2)" }}>
            🎓 開始升年級
          </button>
        )}

        {pgConfirm === 1 && (
          <div className="rounded-lg p-3 sm:p-4 border-2 space-y-3"
               style={{ background: "var(--amber-bg)", borderColor: "var(--amber)" }}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} strokeWidth={2.5} style={{ color: "#5C4810", marginTop: 2 }} />
              <div className="text-xs sm:text-sm" style={{ color: "#5C4810" }}>
                <div className="font-bold mb-1">⚠️ 即將執行：</div>
                <div>• {roster.filter(p => p.grade === 9).length} 位 9 年級 → 軟刪除（歷史紀錄保留，可在「管理」分頁還原）</div>
                <div>• {roster.filter(p => p.grade === 8).length} 位 8 年級 → 升 9 年級</div>
                <div>• {roster.filter(p => p.grade === 7).length} 位 7 年級 → 升 8 年級</div>
                <div className="mt-2 font-bold">記得學期初來新增 7 年級新生！</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPgConfirm(0)}
                      className="btn-tactile flex-1 px-3 py-2 rounded-md text-sm font-medium border-2"
                      style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
                取消
              </button>
              <button onClick={async () => {
                // 執行升年級
                const grade9 = roster.filter(p => p.grade === 9);
                const grade8 = roster.filter(p => p.grade === 8);
                const grade7 = roster.filter(p => p.grade === 7);
                
                // 1. 把 9 年級加入 deleted_persons
                try {
                  const ref = doc(db, "teams", "longmen", "data", "deleted_persons");
                  const snap = await getDoc(ref);
                  const existing = snap.exists() ? (snap.data().value || []) : [];
                  const toDelete = grade9.map(p => ({
                    ...p,
                    deletedAt: Date.now(),
                    deletedBy: user.email,
                    deleteReason: "畢業（升年級工具）",
                  }));
                  await setDoc(ref, { value: [...existing, ...toDelete] });
                } catch (e) {
                  console.error("加入 deleted_persons 失敗", e);
                }

                // 2. 更新 roster：移除 9 年級、8 升 9、7 升 8
                setRoster(prev => prev
                  .filter(p => p.grade !== 9)  // 移除原 9 年級
                  .map(p => {
                    if (p.grade === 8) return { ...p, grade: 9 };
                    if (p.grade === 7) return { ...p, grade: 8 };
                    return p;
                  }), {
                  logPayload: {
                    target: "roster",
                    targetLabel: `升年級：9升畢業 ${grade9.length} 人 / 8升9 ${grade8.length} 人 / 7升8 ${grade7.length} 人`,
                    before: { grade9: grade9.length, grade8: grade8.length, grade7: grade7.length },
                    after: { grade9: grade8.length, grade8: grade7.length, grade7: 0, graduated: grade9.length },
                  },
                });
                if (logAction) {
                  logAction({
                    action: "promote_grade",
                    target: "roster",
                    targetLabel: `升年級：${grade9.length} 位畢業、${grade8.length} 位 8→9、${grade7.length} 位 7→8`,
                  });
                }
                setPgResult(`✅ 完成！9 年級 ${grade9.length} 位已軟刪除、8 年級 ${grade8.length} 位升 9、7 年級 ${grade7.length} 位升 8`);
                setPgConfirm(3);
              }}
                      className="btn-tactile flex-1 px-3 py-2 rounded-md text-sm font-medium"
                      style={{ background: "var(--accent-2)", color: "#fff" }}>
                確認執行
              </button>
            </div>
          </div>
        )}

        {pgConfirm === 3 && (
          <div className="rounded-lg p-3 sm:p-4 border-2"
               style={{ background: "var(--green-bg)", borderColor: "var(--green)" }}>
            <div className="flex items-start gap-2">
              <Check size={16} strokeWidth={2.5} style={{ color: "var(--green)", marginTop: 2 }} />
              <div className="text-xs sm:text-sm" style={{ color: "var(--green)" }}>
                {pgResult}
              </div>
            </div>
            <button onClick={() => { setPgConfirm(0); setPgResult(""); }}
                    className="btn-tactile mt-3 w-full px-3 py-2 rounded-md text-sm font-medium"
                    style={{ background: "var(--green)", color: "#fff" }}>
              完成
            </button>
          </div>
        )}
      </section>
      {/* 系統資訊 */}
      <section className="rounded-2xl border-2 p-4 sm:p-5"
               style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <h3 className="display-cn text-base sm:text-lg mb-3" style={{ color: "var(--ink)" }}>
          系統資訊
        </h3>
        <div className="text-xs space-y-1.5" style={{ color: "var(--ink-2)" }}>
          <div>📍 場地預設邏輯：手動設定 → Excel 行事曆 → 週六永運 / 平日龍門</div>
          <div>💰 永運費用：每人每場次 ${VENUE_FEE}（個練免費）</div>
          <div>⭐ 個練規則：永運場次當日勾選任一場 → 整天免費</div>
          <div>🔒 編輯期限：點名後 24 小時可修改（主管理員不受限）</div>
        </div>
      </section>
    </div>
  );
}

// ============ MONTH LOCK SECTION ============
function MonthLockSection({ attendance, setAttendance, roster, user, logAction }) {
  const today = new Date();
  const [viewY, setViewY] = useState(today.getFullYear());
  const [viewM, setViewM] = useState(today.getMonth());
  const [confirmLock, setConfirmLock] = useState(null); // { Y, M } or null
  const [confirmUnlock, setConfirmUnlock] = useState(null); // { Y, M } or null

  const monthStr = `${viewY}-${pad(viewM + 1)}`;
  const isLocked = isMonthLocked(attendance, monthStr);
  const lockData = attendance[`__lock_${monthStr}`];

  // 統計該月有多少天有點名紀錄
  const monthStats = useMemo(() => {
    let daysWithAttendance = 0;
    Object.keys(attendance).forEach(dateStr => {
      if (!dateStr.startsWith(monthStr)) return;
      if (dateStr.startsWith("__")) return;  // skip __lock_*
      const d = attendance[dateStr];
      if (d && (Object.keys(d.am || {}).length > 0 || Object.keys(d.pm || {}).length > 0)) {
        daysWithAttendance++;
      }
    });
    return { daysWithAttendance };
  }, [attendance, monthStr]);

  const goPrev = () => {
    const { Y: nY, M: nM } = shiftMonth(viewY, viewM, -1);
    setViewY(nY); setViewM(nM);
  };
  const goNext = () => {
    const { Y: nY, M: nM } = shiftMonth(viewY, viewM, 1);
    setViewY(nY); setViewM(nM);
  };

  const doLock = () => {
    // 把當前 roster 的 sch 快照存進該月 lock 區
    const schSnapshot = {};
    roster.forEach(p => {
      schSnapshot[p.seq] = [...p.sch];
    });
    setAttendance(prev => ({
      ...prev,
      [`__lock_${monthStr}`]: {
        lockedAt: Date.now(),
        lockedBy: user.email,
        schSnapshot,
        rosterSize: roster.length,
      },
    }), {
      logPayload: {
        target: `lock/${monthStr}`,
        targetLabel: `鎖定 ${viewY} 年 ${viewM + 1} 月`,
        before: null,
        after: { rosterSize: roster.length, lockedBy: user.email },
      },
    });
    if (logAction) {
      logAction({
        action: "lock_month",
        target: `lock/${monthStr}`,
        targetLabel: `鎖定 ${viewY} 年 ${viewM + 1} 月（${roster.length} 位隊員的訓練表已快照）`,
      });
    }
    setConfirmLock(null);
  };

  const doUnlock = () => {
    setAttendance(prev => {
      const next = { ...prev };
      delete next[`__lock_${monthStr}`];
      return next;
    }, {
      logPayload: {
        target: `lock/${monthStr}`,
        targetLabel: `解鎖 ${viewY} 年 ${viewM + 1} 月`,
        before: { rosterSize: lockData?.rosterSize },
        after: null,
      },
    });
    if (logAction) {
      logAction({
        action: "unlock_month",
        target: `lock/${monthStr}`,
        targetLabel: `解鎖 ${viewY} 年 ${viewM + 1} 月`,
      });
    }
    setConfirmUnlock(null);
  };

  return (
    <>
      {/* 月份切換 */}
      <div className="flex items-center justify-between gap-2 mb-3 p-3 rounded-lg"
           style={{ background: "var(--panel-2)" }}>
        <button onClick={goPrev}
                className="btn-tactile w-8 h-8 rounded-md flex items-center justify-center border"
                style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <div className="display-cn text-base sm:text-lg font-bold" style={{ color: "var(--ink)" }}>
          {viewY} 年 {viewM + 1} 月
          {isLocked && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--green-bg)", color: "var(--green)", fontWeight: 700 }}>
              🔒 已鎖定
            </span>
          )}
        </div>
        <button onClick={goNext}
                className="btn-tactile w-8 h-8 rounded-md flex items-center justify-center border"
                style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* 月份資訊 */}
      <div className="text-xs mb-3 space-y-1" style={{ color: "var(--ink-2)" }}>
        <div>📊 該月有點名紀錄：<span className="num font-bold">{monthStats.daysWithAttendance}</span> 天</div>
        {isLocked && lockData && (
          <>
            <div>🔒 鎖定時間：{new Date(lockData.lockedAt).toLocaleString("zh-TW")}</div>
            <div>👤 鎖定人：{lockData.lockedBy}</div>
            <div>👥 鎖定當下隊員數：{lockData.rosterSize} 人</div>
          </>
        )}
      </div>

      {/* 鎖定/解鎖按鈕 */}
      {!isLocked ? (
        confirmLock ? (
          <div className="rounded-lg p-3 border-2 space-y-2"
               style={{ background: "var(--amber-bg)", borderColor: "var(--amber)" }}>
            <div className="text-xs sm:text-sm" style={{ color: "#5C4810" }}>
              <div className="font-bold mb-1">⚠️ 確認鎖定 {viewY} 年 {viewM + 1} 月？</div>
              <div>系統會把當下 {roster.length} 位隊員的訓練表快照存進去。</div>
              <div>之後改 sch（管理分頁）→ 不影響此月份統計。</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmLock(null)}
                      className="btn-tactile flex-1 px-3 py-2 rounded-md text-sm border-2"
                      style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
                取消
              </button>
              <button onClick={doLock}
                      className="btn-tactile flex-1 px-3 py-2 rounded-md text-sm font-medium"
                      style={{ background: "var(--green)", color: "#fff" }}>
                🔒 確認鎖定
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmLock(true)}
                  className="btn-tactile w-full px-4 py-3 rounded-lg font-medium border-2 flex items-center justify-center gap-2"
                  style={{ background: "var(--accent-bg)", borderColor: "var(--accent)", color: "var(--accent-2)" }}>
            🔒 鎖定 {viewY} 年 {viewM + 1} 月
          </button>
        )
      ) : (
        confirmUnlock ? (
          <div className="rounded-lg p-3 border-2 space-y-2"
               style={{ background: "var(--red-bg)", borderColor: "var(--red)" }}>
            <div className="text-xs sm:text-sm" style={{ color: "var(--red)" }}>
              <div className="font-bold mb-1">⚠️ 確認解鎖？</div>
              <div>解鎖後，當下訓練表（sch）會生效於此月份。</div>
              <div>歷史統計可能會跟著變動。</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmUnlock(null)}
                      className="btn-tactile flex-1 px-3 py-2 rounded-md text-sm border-2"
                      style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
                取消
              </button>
              <button onClick={doUnlock}
                      className="btn-tactile flex-1 px-3 py-2 rounded-md text-sm font-medium"
                      style={{ background: "var(--red)", color: "#fff" }}>
                🔓 確認解鎖
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmUnlock(true)}
                  className="btn-tactile w-full px-4 py-3 rounded-lg font-medium border-2"
                  style={{ background: "var(--panel-2)", borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            🔓 解鎖此月份
          </button>
        )
      )}
    </>
  );
}

// ============ SWIM STATS VIEW (比賽成績) ============
// 工具：把秒數轉成 m:ss.xx 格式
const formatTime = (sec) => {
  if (sec === null || sec === undefined || isNaN(sec)) return "—";
  const totalSec = Number(sec);
  if (totalSec < 60) return totalSec.toFixed(2);
  const min = Math.floor(totalSec / 60);
  const s = (totalSec - min * 60).toFixed(2).padStart(5, "0");
  return `${min}:${s}`;
};

// 解析時間字串：1:23.45 / 1:23:45 / 83.45 / 純秒數
const parseTime = (str) => {
  if (typeof str === "number") return str;
  if (!str || typeof str !== "string") return null;
  str = str.trim();
  if (!str) return null;
  // m:ss.xx 或 m:ss:xx
  if (str.includes(":")) {
    const parts = str.split(/[:：]/).map(p => parseFloat(p));
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) {
      // 1:23:45 也視為 1分23.45秒
      return parts[0] * 60 + parts[1] + parts[2] / 100;
    }
  }
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
};

function SwimStatsView({ swimStats, setSwimStats, swimStatsLoaded, isAdmin, isOwner, logAction, user }) {
  const [subTab, setSubTab] = useState("swimmer");  // swimmer / event / meet
  const [selectedSwimmer, setSelectedSwimmer] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedMeet, setSelectedMeet] = useState(null);

  // 處理初始化（如果還沒有資料）
  if (!swimStatsLoaded) {
    return (
      <div className="rounded-2xl p-8 border-2 text-center"
           style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <div className="text-sm" style={{ color: "var(--mute)" }}>載入中...</div>
      </div>
    );
  }

  const hasData = swimStats.swimmers && Object.keys(swimStats.swimmers).length > 0;

  if (!hasData) {
    // 沒資料畫面（首次初始化）
    return (
      <div className="space-y-4">
        <section className="rounded-2xl p-6 sm:p-8 border-2 text-center"
                 style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
          <div className="text-6xl mb-3">🏆</div>
          <h2 className="display-cn text-xl sm:text-2xl mb-2" style={{ color: "var(--ink)" }}>
            比賽成績
          </h2>
          {isOwner ? (
            <>
              <p className="text-sm mb-4" style={{ color: "var(--ink-2)" }}>
                目前還沒有比賽成績資料。<br/>
                可以從原本的 swim-stats 系統匯出 JSON 後上傳。
              </p>
              <SwimStatsImporter swimStats={swimStats} setSwimStats={setSwimStats} logAction={logAction} />
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--mute)" }}>
              比賽成績資料尚未匯入。
            </p>
          )}
        </section>
      </div>
    );
  }

  // 主要介面
  return (
    <div className="space-y-4">
      {/* Header */}
      <section className="rounded-2xl p-4 sm:p-5 border-2"
               style={{ background: "var(--ink)", borderColor: "var(--ink)", color: "var(--bg)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] sm:text-xs tk-x mb-1" style={{ color: "rgba(255,252,246,0.6)" }}>
              SWIM STATS · 比賽成績
            </div>
            <div className="display-cn text-2xl sm:text-3xl" style={{ color: "var(--bg)" }}>
              {Object.keys(swimStats.swimmers).length} 位選手 · {swimStats.meets.length} 場比賽
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tk-x" style={{ color: "rgba(255,252,246,0.6)" }}>EVENTS</div>
            <div className="num text-3xl sm:text-4xl font-bold" style={{ color: "var(--green-2)" }}>
              {swimStats.events.length}
            </div>
          </div>
        </div>
      </section>

      {/* Sub tabs */}
      <div className="flex gap-1 p-1 rounded-2xl border-2 overflow-x-auto"
           style={{ borderColor: "var(--ink)", background: "var(--panel)" }}>
        {[
          { k: "swimmer", l: "選手", icon: User },
          { k: "event", l: "項目", icon: Trophy },
          { k: "meet", l: "比賽", icon: CalendarDays },
          { k: "compare", l: "對比", icon: BarChart3 },
          { k: "records", l: "紀錄", icon: FileText },
          ...(isOwner ? [{ k: "input", l: "錄入", icon: Edit3 }] : []),
        ].map(t => {
          const active = subTab === t.k;
          const Ic = t.icon;
          return (
            <button key={t.k} onClick={() => setSubTab(t.k)}
                    className="btn-tactile flex-1 flex items-center justify-center gap-1 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap"
                    style={{
                      background: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--bg)" : "var(--ink-2)",
                      minWidth: 60,
                    }}>
              <Ic size={14} strokeWidth={2.5} />
              {t.l}
            </button>
          );
        })}
      </div>

      {/* 主內容 */}
      {subTab === "swimmer" && (
        <SwimmerView
          swimStats={swimStats}
          selectedSwimmer={selectedSwimmer}
          setSelectedSwimmer={setSelectedSwimmer}
          setSwimStats={setSwimStats}
          isOwner={isOwner}
          logAction={logAction}
        />
      )}
      {subTab === "event" && (
        <EventView
          swimStats={swimStats}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
        />
      )}
      {subTab === "meet" && (
        <MeetView
          swimStats={swimStats}
          selectedMeet={selectedMeet}
          setSelectedMeet={setSelectedMeet}
        />
      )}
      {subTab === "compare" && (
        <CompareView swimStats={swimStats} />
      )}
      {subTab === "records" && (
        <RecordsView swimStats={swimStats} />
      )}
      {subTab === "input" && isOwner && (
        <InputView
          swimStats={swimStats}
          setSwimStats={setSwimStats}
          logAction={logAction}
          user={user}
        />
      )}

      {/* 管理員的匯入工具 */}
      {isOwner && (
        <section className="rounded-xl p-3 border"
                 style={{ background: "var(--panel-2)", borderColor: "var(--line)" }}>
          <details>
            <summary className="text-xs cursor-pointer" style={{ color: "var(--mute)" }}>
              ⚙️ 管理工具（主管理員）
            </summary>
            <div className="mt-3">
              <SwimStatsImporter swimStats={swimStats} setSwimStats={setSwimStats} logAction={logAction} />
              {swimStats._version && (
                <div className="text-[10px] mt-2" style={{ color: "var(--mute)" }}>
                  上次更新：{new Date(swimStats._version).toLocaleString("zh-TW")}
                </div>
              )}
            </div>
          </details>
        </section>
      )}
    </div>
  );
}

// === 選手檢視 ===
function SwimmerView({ swimStats, selectedSwimmer, setSelectedSwimmer, setSwimStats, isOwner, logAction }) {
  const { roster } = useRoster();

  // B：合併「成績有的名字」+「roster 全員」→ 確保 roster 上的新選手也會出現
  const statNames = Object.keys(swimStats.swimmers || {});
  const rosterNames = (roster || []).map(p => p.name);
  const allNamesSet = new Set([...statNames, ...rosterNames]);
  const names = sortSwimmerNames([...allNamesSet], roster);

  // 哪些名字「有成績紀錄」（用來標示「尚無成績」）
  const hasRecords = (n) => (swimStats.swimmers[n] || []).length > 0;

  // 依年級分組（比照點名：九 → 八 → 七 → 其他）
  const nameGrade = {};
  (roster || []).forEach(p => { nameGrade[p.name] = p.grade; });
  const grouped = [9, 8, 7]
    .map(g => ({ grade: g, label: GRADE_NAMES[g], members: names.filter(n => nameGrade[n] === g) }))
    .filter(g => g.members.length > 0);
  const others = names.filter(n => nameGrade[n] === undefined);

  // C：偵測「可能改名」的選手 = 有成績、但名字不在 roster 上
  const orphanNames = statNames.filter(n => !rosterNames.includes(n) && hasRecords(n));

  const renderBtn = (n) => {
    const active = selectedSwimmer === n;
    const noRec = !hasRecords(n);
    return (
      <button key={n} onClick={() => setSelectedSwimmer(active ? null : n)}
              className="btn-tactile px-2.5 py-1 rounded-md text-xs font-medium border inline-flex items-center gap-1"
              style={{
                background: active ? "var(--ink)" : "transparent",
                color: active ? "var(--bg)" : (noRec ? "var(--mute)" : "var(--ink-2)"),
                borderColor: active ? "var(--ink)" : "var(--line-strong)",
                borderStyle: noRec ? "dashed" : "solid",
              }}>
        {n}
        {noRec && <span className="text-[9px]" style={{ opacity: 0.7 }}>·無成績</span>}
      </button>
    );
  };

  return (
    <section className="rounded-2xl p-4 sm:p-5 border-2"
             style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
      <div className="text-[10px] tk-x mb-3" style={{ color: "var(--mute)" }}>
        選擇選手 · {names.length} 位
      </div>

      {/* C：改名偵測提示（只有主管理員看得到 + 能操作） */}
      {isOwner && orphanNames.length > 0 && setSwimStats && (
        <RenameDetector
          orphanNames={orphanNames}
          roster={roster}
          swimStats={swimStats}
          setSwimStats={setSwimStats}
          logAction={logAction}
        />
      )}

      {/* 選手選擇（依年級分組） */}
      <div className="space-y-3 mb-4">
        {grouped.map(g => (
          <div key={g.grade}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ background: "var(--accent-bg)", color: "var(--accent-2)" }}>
                {g.label}
              </span>
              <span className="num text-[10px]" style={{ color: "var(--mute)" }}>
                {g.members.length} 位
              </span>
              <span className="flex-1 h-px" style={{ background: "var(--line)" }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {g.members.map(renderBtn)}
            </div>
          </div>
        ))}
        {others.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ background: "#FBE7D5", color: "#9A6420" }}>
                其他
              </span>
              <span className="num text-[10px]" style={{ color: "var(--mute)" }}>
                {others.length} 位（不在點名名單）
              </span>
              <span className="flex-1 h-px" style={{ background: "var(--line)" }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {others.map(renderBtn)}
            </div>
          </div>
        )}
      </div>

      {selectedSwimmer ? (
        <SwimmerDetail name={selectedSwimmer} swimStats={swimStats} />
      ) : (
        <div className="text-center py-8" style={{ color: "var(--mute)" }}>
          <div className="text-4xl mb-2">🏊</div>
          <div className="text-sm">點選上方選手查看詳細成績</div>
        </div>
      )}
    </section>
  );
}

// === C：改名偵測 + 對應工具（主管理員專用） ===
function RenameDetector({ orphanNames, roster, swimStats, setSwimStats, logAction }) {
  const [open, setOpen] = useState(false);
  const [mapping, setMapping] = useState({});  // { 舊名: 新名 }
  const [busy, setBusy] = useState(false);

  // roster 上「沒有成績」的名字 = 可能的新名字候選
  const statNames = Object.keys(swimStats.swimmers || {});
  const candidates = (roster || [])
    .map(p => p.name)
    .filter(name => !statNames.includes(name));  // roster 有、成績沒有 → 可能是改名後的新名字

  const applyRename = async (oldName) => {
    const newName = mapping[oldName];
    if (!newName) return;
    if (!confirm(`將成績選手「${oldName}」改名為「${newName}」？\n所有歷史成績會一併轉移。`)) return;
    setBusy(true);
    try {
      const next = { ...swimStats.swimmers };
      // 把舊名的成績搬到新名（若新名已存在則合併，以新名為主）
      const oldRecords = next[oldName] || [];
      const existingNew = next[newName] || [];
      next[newName] = [...existingNew, ...oldRecords];
      delete next[oldName];
      await setSwimStats({ ...swimStats, swimmers: next });
      if (logAction) logAction("rename_swimmer", {
        target: `${oldName}→${newName}`,
        targetLabel: `成績選手改名：${oldName} → ${newName}`,
      });
      setMapping(m => { const c = { ...m }; delete c[oldName]; return c; });
    } catch (e) {
      alert("改名失敗：" + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 rounded-xl border-2 overflow-hidden"
         style={{ borderColor: "#E89B3C", background: "#FFF8F0" }}>
      <button onClick={() => setOpen(!open)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span className="text-sm font-bold" style={{ color: "#9A6420" }}>
            偵測到 {orphanNames.length} 位選手可能改名了
          </span>
        </div>
        <span style={{ color: "#9A6420" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="text-[11px] leading-relaxed px-2 py-1.5 rounded"
               style={{ background: "#FBEAD5", color: "#7A5018" }}>
            這些選手有比賽成績，但名字不在目前的點名名單上。<br/>
            可能原因：① 在點名改了名字 → 請對應到新名字 ② 已畢業 → 不用處理（保留歷史成績）
          </div>
          {orphanNames.map(oldName => (
            <div key={oldName} className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium px-2 py-1 rounded"
                    style={{ background: "#FBE7D5", color: "#9A6420" }}>
                {oldName}
              </span>
              <span style={{ color: "var(--mute)" }}>→</span>
              <select value={mapping[oldName] || ""}
                      onChange={e => setMapping(m => ({ ...m, [oldName]: e.target.value }))}
                      className="flex-1 min-w-[120px] px-2 py-1 rounded border text-sm"
                      style={{ borderColor: "var(--line-strong)", background: "#fff" }}>
                <option value="">-- 對應到點名名單上的選手 --</option>
                {candidates.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => applyRename(oldName)}
                      disabled={!mapping[oldName] || busy}
                      className="btn-tactile px-3 py-1 rounded text-xs font-medium"
                      style={{
                        background: mapping[oldName] && !busy ? "var(--green)" : "var(--line)",
                        color: mapping[oldName] && !busy ? "#fff" : "var(--mute)",
                      }}>
                轉移成績
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// === 選手詳細成績 ===
function SwimmerDetail({ name, swimStats }) {
  const records = swimStats.swimmers[name] || [];

  // 計算每項目的 PB（最佳成績）
  const pbMap = useMemo(() => {
    const map = {};
    records.forEach(r => {
      Object.entries(r.results || {}).forEach(([ev, time]) => {
        if (!map[ev] || time < map[ev].time) {
          map[ev] = { time, meet: r.meet };
        }
      });
    });
    return map;
  }, [records]);

  const pbEvents = Object.keys(pbMap).sort((a, b) => {
    const ai = swimStats.events.indexOf(a);
    const bi = swimStats.events.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  if (records.length === 0) {
    return (
      <div className="text-center py-6" style={{ color: "var(--mute)" }}>
        <div className="text-sm">這位選手還沒有比賽紀錄</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PB 區塊 */}
      <div>
        <div className="display-cn text-base mb-2 flex items-center gap-2" style={{ color: "var(--ink)" }}>
          <Trophy size={16} strokeWidth={2.5} style={{ color: "var(--accent)" }} />
          <span>個人最佳 PB · {pbEvents.length} 項</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pbEvents.map(ev => (
            <div key={ev} className="rounded-lg p-2 border"
                 style={{ background: "var(--bg)", borderColor: "var(--line)" }}>
              <div className="text-[11px]" style={{ color: "var(--mute)" }}>{ev}</div>
              <div className="num text-lg font-bold" style={{ color: "var(--ink)" }}>
                {formatTime(pbMap[ev].time)}
              </div>
              <div className="text-[10px] truncate" style={{ color: "var(--mute)" }}>
                {pbMap[ev].meet}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 進步曲線 */}
      <ProgressChart name={name} swimStats={swimStats} pbMap={pbMap} pbEvents={pbEvents} />

      {/* 歷次比賽 */}
      <div>
        <div className="display-cn text-base mb-2" style={{ color: "var(--ink)" }}>
          📅 歷次比賽 · {records.length} 場
        </div>
        <div className="space-y-2">
          {records.map((r, i) => (
            <div key={i} className="rounded-lg p-3 border"
                 style={{ background: "var(--bg)", borderColor: "var(--line)" }}>
              <div className="font-bold text-sm mb-2" style={{ color: "var(--ink)" }}>
                {r.meet}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(r.results || {}).map(([ev, t]) => {
                  const isPB = pbMap[ev] && pbMap[ev].meet === r.meet && pbMap[ev].time === t;
                  return (
                    <div key={ev} className="rounded px-2 py-1 border"
                         style={{
                           background: isPB ? "var(--green-bg)" : "transparent",
                           borderColor: isPB ? "var(--green)" : "var(--line)",
                         }}>
                      <span className="text-[11px]" style={{ color: "var(--mute)" }}>{ev}</span>
                      <span className="num font-bold ml-1" style={{ color: isPB ? "var(--green)" : "var(--ink)" }}>
                        {formatTime(t)}
                      </span>
                      {isPB && <span className="ml-1" style={{ color: "var(--green)" }}>★</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === 進步曲線（SVG 折線圖） ===
// 游泳邏輯：秒數越小越快，所以 Y 軸要「上面=快，下面=慢」
// 也就是 SVG 的 Y 軸要反轉（畫面上 = 高分 = 低秒數）
function ProgressChart({ name, swimStats, pbMap, pbEvents }) {
  const [selectedEvent, setSelectedEvent] = useState(pbEvents[0] || null);

  // 收集這個選手該項目的所有紀錄（按 meet 順序）
  const dataPoints = useMemo(() => {
    if (!selectedEvent) return [];
    const records = swimStats.swimmers[name] || [];
    const points = [];
    // 按 swimStats.meets 的順序排列（不是 records 內部順序）
    swimStats.meets.forEach((meetName, idx) => {
      const r = records.find(x => x.meet === meetName);
      if (r && r.results?.[selectedEvent] != null) {
        points.push({
          meet: meetName,
          meetIdx: idx,
          time: r.results[selectedEvent],
          isPB: pbMap[selectedEvent]?.meet === meetName,
        });
      }
    });
    return points;
  }, [selectedEvent, name, swimStats, pbMap]);

  // 計算趨勢
  const trend = useMemo(() => {
    if (dataPoints.length < 2) return null;
    const first = dataPoints[0].time;
    const last = dataPoints[dataPoints.length - 1].time;
    const diff = last - first;
    return {
      diff,
      improved: diff < 0,  // 秒數減少 = 進步
      pct: ((Math.abs(diff) / first) * 100).toFixed(1),
    };
  }, [dataPoints]);

  if (pbEvents.length === 0) return null;

  return (
    <div>
      <div className="display-cn text-base mb-2 flex items-center gap-2" style={{ color: "var(--ink)" }}>
        <BarChart3 size={16} strokeWidth={2.5} style={{ color: "var(--accent-2)" }} />
        <span>📈 進步曲線</span>
      </div>

      {/* 項目選擇 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {pbEvents.map(ev => {
          const active = selectedEvent === ev;
          return (
            <button key={ev} onClick={() => setSelectedEvent(ev)}
                    className="btn-tactile px-2.5 py-1 rounded-md text-xs font-medium border"
                    style={{
                      background: active ? "var(--accent-2)" : "transparent",
                      color: active ? "#fff" : "var(--accent-2)",
                      borderColor: "var(--accent-2)",
                    }}>
              {ev}
            </button>
          );
        })}
      </div>

      {/* 圖表 */}
      {dataPoints.length === 0 ? (
        <div className="text-center py-6 text-sm" style={{ color: "var(--mute)" }}>
          選擇項目查看進步曲線
        </div>
      ) : dataPoints.length === 1 ? (
        <div className="rounded-lg p-4 border text-center"
             style={{ background: "var(--bg)", borderColor: "var(--line)" }}>
          <div className="text-sm mb-1" style={{ color: "var(--mute)" }}>
            目前只有 1 場紀錄
          </div>
          <div className="num font-bold text-lg" style={{ color: "var(--ink)" }}>
            {formatTime(dataPoints[0].time)}
          </div>
          <div className="text-xs" style={{ color: "var(--mute)" }}>
            {dataPoints[0].meet}
          </div>
        </div>
      ) : (
        <ChartSVG dataPoints={dataPoints} trend={trend} />
      )}
    </div>
  );
}

// === 折線圖 SVG ===
function ChartSVG({ dataPoints, trend }) {
  const [hovered, setHovered] = useState(null);

  // SVG 尺寸 - 拉大讓空間更足
  const W = 700;
  const H = 360;
  const padL = 60;
  const padR = 30;
  const padT = 30;
  const padB = 110;  // 底下留更多空間給比賽名
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // 取得時間範圍
  const times = dataPoints.map(p => p.time);
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const range = maxT - minT;
  const padding = range * 0.2 || 1;
  const yMin = minT - padding;
  const yMax = maxT + padding;

  // x: 平均分配，y: 反轉（小秒數=高位置）
  const getX = (i) => padL + (chartW * i) / (Math.max(dataPoints.length - 1, 1));
  const getY = (time) => padT + chartH * ((time - yMin) / (yMax - yMin));

  // 折線 path
  const linePath = dataPoints.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.time)}`
  ).join(" ");

  // 漸層填色 path（折線到底部）
  const fillPath = linePath +
    ` L ${getX(dataPoints.length - 1)} ${padT + chartH}` +
    ` L ${getX(0)} ${padT + chartH} Z`;

  // Y 軸刻度（5 條水平線，看起來更密）
  const yTicks = [];
  for (let i = 0; i <= 4; i++) {
    const t = yMin + (yMax - yMin) * (i / 4);
    yTicks.push({ time: t, y: padT + chartH * (i / 4) });
  }

  // 縮短比賽名稱（取後段，例如 "115年全中運" → "全中運"）
  const shortenMeet = (name) => {
    // 移除「年」前面的數字（如「113年市中運」→「市中運」）
    const m = name.match(/年(.+)$/);
    if (m) return m[1];
    if (name.length > 6) return name.slice(0, 6) + "…";
    return name;
  };

  return (
    <div className="rounded-lg p-3 border"
         style={{ background: "var(--bg)", borderColor: "var(--line)" }}>
      {/* 趨勢摘要 */}
      {trend && (
        <div className="mb-2 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs" style={{ color: "var(--mute)" }}>
            第一場 → 最後一場
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="num text-xs" style={{ color: "var(--ink-2)" }}>
              {formatTime(dataPoints[0].time)} → {formatTime(dataPoints[dataPoints.length - 1].time)}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    background: trend.improved ? "var(--green-bg)" : "#FBE5DA",
                    color: trend.improved ? "var(--green)" : "#B23A28",
                  }}>
              {trend.improved ? "▼" : "▲"} {Math.abs(trend.diff).toFixed(2)}s ({trend.pct}%)
              {trend.improved ? " 進步" : " 退步"}
            </span>
          </div>
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        {/* 漸層定義 */}
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-2)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y 軸刻度線 + 標籤 */}
        {yTicks.map((tk, i) => (
          <g key={i}>
            <line x1={padL} y1={tk.y} x2={W - padR} y2={tk.y}
                  stroke="var(--line)" strokeWidth={1} strokeDasharray={i === 4 ? "" : "3,3"} />
            <text x={padL - 10} y={tk.y + 4} textAnchor="end"
                  fontSize={11} fill="var(--mute)" className="num">
              {formatTime(tk.time)}
            </text>
          </g>
        ))}

        {/* Y 軸標示「快 ↑」「慢 ↓」 - 放在圖外左側上方 */}
        <text x={padL} y={padT - 14} fontSize={10} fill="var(--green)" fontWeight="bold">↑ 快 (秒數少)</text>
        <text x={W - padR} y={padT - 14} fontSize={10} fill="#B23A28" fontWeight="bold" textAnchor="end">↓ 慢 (秒數多)</text>

        {/* 漸層填色 */}
        <path d={fillPath} fill="url(#chartGradient)" />

        {/* 折線 */}
        <path d={linePath} fill="none" stroke="var(--accent-2)" strokeWidth={2.5}
              strokeLinecap="round" strokeLinejoin="round" />

        {/* 資料點 + 互動 */}
        {dataPoints.map((p, i) => {
          const cx = getX(i);
          const cy = getY(p.time);
          const isHovered = hovered === i;
          return (
            <g key={i}>
              {/* 透明大圓 - 增加 hover 範圍 */}
              <circle cx={cx} cy={cy} r={20} fill="transparent"
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      style={{ cursor: "pointer" }} />
              {/* PB 點：綠色雙圈 */}
              {p.isPB && (
                <circle cx={cx} cy={cy} r={10} fill="none"
                        stroke="var(--green)" strokeWidth={1.5} opacity={0.4} />
              )}
              {/* 主圓點 */}
              <circle cx={cx} cy={cy} r={p.isPB ? 6 : 4.5}
                      fill={p.isPB ? "var(--green)" : "var(--accent-2)"}
                      stroke="#fff" strokeWidth={2}
                      style={{ pointerEvents: "none" }} />
            </g>
          );
        })}

        {/* X 軸底線 */}
        <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH}
              stroke="var(--ink)" strokeWidth={1.5} />

        {/* X 軸：比賽名（短版，直立 + 縮短） */}
        {dataPoints.map((p, i) => {
          const cx = getX(i);
          const cy = padT + chartH + 12;
          return (
            <g key={`x-${i}`}>
              {/* 連到資料點的虛線（淡） */}
              <line x1={cx} y1={padT + chartH} x2={cx} y2={cy - 2}
                    stroke="var(--line-strong)" strokeWidth={0.5} strokeDasharray="2,2" opacity={0.5} />
              {/* PB 場次標 ★ 在 X 軸 */}
              {p.isPB && (
                <text x={cx} y={cy + 8} textAnchor="middle" fontSize={11} fill="var(--green)" fontWeight="bold">
                  ★
                </text>
              )}
              {/* 比賽名（直立 90 度避免重疊） */}
              <text x={cx} y={cy + (p.isPB ? 22 : 10)}
                    transform={`rotate(-45 ${cx} ${cy + (p.isPB ? 22 : 10)})`}
                    textAnchor="end" fontSize={10} fill="var(--ink-2)">
                {shortenMeet(p.meet)}
              </text>
            </g>
          );
        })}

        {/* Hover Tooltip */}
        {hovered !== null && dataPoints[hovered] && (() => {
          const p = dataPoints[hovered];
          const cx = getX(hovered);
          const cy = getY(p.time);
          const tipW = 130;
          const tipH = 45;
          // 防止 tooltip 超出邊界
          let tipX = cx - tipW / 2;
          if (tipX < padL) tipX = padL;
          if (tipX + tipW > W - padR) tipX = W - padR - tipW;
          // 預設 tooltip 在點上方，如果太擠就放下方
          let tipY = cy - tipH - 15;
          if (tipY < padT) tipY = cy + 15;
          return (
            <g style={{ pointerEvents: "none" }}>
              {/* 連接線 */}
              <line x1={cx} y1={cy} x2={cx} y2={tipY + (tipY < cy ? tipH : 0)}
                    stroke="var(--ink)" strokeWidth={1} strokeDasharray="2,2" />
              {/* 強調點 */}
              <circle cx={cx} cy={cy} r={p.isPB ? 8 : 7}
                      fill={p.isPB ? "var(--green)" : "var(--accent-2)"}
                      stroke="#fff" strokeWidth={3} />
              {/* Tooltip 框 */}
              <rect x={tipX} y={tipY} width={tipW} height={tipH} rx={6}
                    fill="var(--ink)" />
              <text x={tipX + 8} y={tipY + 18} fontSize={11} fill="rgba(255,252,246,0.7)">
                {p.meet}
              </text>
              <text x={tipX + 8} y={tipY + 36} fontSize={15}
                    fontWeight="bold" fill="#fff" className="num">
                {formatTime(p.time)}
                {p.isPB && <tspan fill="var(--green-2)" fontWeight="bold"> ★ PB</tspan>}
              </text>
            </g>
          );
        })()}
      </svg>

      <div className="text-[10px] mt-1 text-center" style={{ color: "var(--mute)" }}>
        ★ = 個人最佳 · 點圖上資料點查看詳細 · 線往下表示時間減少（進步）
      </div>
    </div>
  );
}

function EventView({ swimStats, selectedEvent, setSelectedEvent }) {
  return (
    <section className="rounded-2xl p-4 sm:p-5 border-2"
             style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
      <div className="text-[10px] tk-x mb-3" style={{ color: "var(--mute)" }}>
        選擇項目
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {swimStats.events.map(ev => {
          const active = selectedEvent === ev;
          return (
            <button key={ev} onClick={() => setSelectedEvent(active ? null : ev)}
                    className="btn-tactile px-2.5 py-1 rounded-md text-xs font-medium border"
                    style={{
                      background: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--bg)" : "var(--ink-2)",
                      borderColor: active ? "var(--ink)" : "var(--line-strong)",
                    }}>
              {ev}
            </button>
          );
        })}
      </div>

      {selectedEvent ? (
        <EventRanking event={selectedEvent} swimStats={swimStats} />
      ) : (
        <div className="text-center py-8" style={{ color: "var(--mute)" }}>
          <div className="text-4xl mb-2">📊</div>
          <div className="text-sm">點選上方項目查看隊內排行</div>
        </div>
      )}
    </section>
  );
}

// === 項目排行內容 ===
function EventRanking({ event, swimStats }) {
  const rankings = useMemo(() => {
    const arr = [];
    Object.entries(swimStats.swimmers).forEach(([name, records]) => {
      let best = null, bestMeet = null;
      records.forEach(r => {
        const t = r.results?.[event];
        if (t != null && (best === null || t < best)) {
          best = t;
          bestMeet = r.meet;
        }
      });
      if (best !== null) arr.push({ name, time: best, meet: bestMeet });
    });
    arr.sort((a, b) => a.time - b.time);
    return arr;
  }, [event, swimStats]);

  if (rankings.length === 0) {
    return (
      <div className="text-center py-6" style={{ color: "var(--mute)" }}>
        <div className="text-sm">沒有 {event} 的紀錄</div>
      </div>
    );
  }

  return (
    <div>
      <div className="display-cn text-base mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}>
        🏆 <span>{event}</span>
        <span className="text-xs font-normal" style={{ color: "var(--mute)" }}>· 隊內 PB 排行</span>
      </div>
      <div className="space-y-1">
        {rankings.map((r, i) => (
          <div key={r.name} className="grid items-center gap-2 px-3 py-2 rounded-lg border"
               style={{
                 gridTemplateColumns: "30px 1fr auto auto",
                 background: i < 3 ? "var(--green-bg)" : "var(--bg)",
                 borderColor: i < 3 ? "var(--green)" : "var(--line)",
               }}>
            <span className="num font-bold text-center" style={{
              color: i < 3 ? "var(--green)" : "var(--mute)",
              fontSize: i < 3 ? 16 : 12,
            }}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
            </span>
            <span className="font-medium text-sm" style={{ color: "var(--ink)" }}>
              {r.name}
            </span>
            <span className="num font-bold" style={{ color: "var(--ink)" }}>
              {formatTime(r.time)}
            </span>
            <span className="text-[10px] hidden sm:inline" style={{ color: "var(--mute)" }}>
              {r.meet}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// === 比賽檢視 ===
function MeetView({ swimStats, selectedMeet, setSelectedMeet }) {
  return (
    <section className="rounded-2xl p-4 sm:p-5 border-2"
             style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
      <div className="text-[10px] tk-x mb-3" style={{ color: "var(--mute)" }}>
        選擇比賽
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {swimStats.meets.map(m => {
          const active = selectedMeet === m;
          return (
            <button key={m} onClick={() => setSelectedMeet(active ? null : m)}
                    className="btn-tactile px-2.5 py-1 rounded-md text-xs font-medium border"
                    style={{
                      background: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--bg)" : "var(--ink-2)",
                      borderColor: active ? "var(--ink)" : "var(--line-strong)",
                    }}>
              {m}
            </button>
          );
        })}
      </div>

      {selectedMeet ? (
        <MeetDetail meet={selectedMeet} swimStats={swimStats} />
      ) : (
        <div className="text-center py-8" style={{ color: "var(--mute)" }}>
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-sm">點選上方比賽查看全隊成績</div>
        </div>
      )}
    </section>
  );
}

// === 比賽內容 ===
function MeetDetail({ meet, swimStats }) {
  // 收集所有選手在這場比賽的成績
  const meetData = useMemo(() => {
    const arr = [];
    Object.entries(swimStats.swimmers).forEach(([name, records]) => {
      const r = records.find(x => x.meet === meet);
      if (r && r.results && Object.keys(r.results).length > 0) {
        arr.push({ name, results: r.results });
      }
    });
    return arr;
  }, [meet, swimStats]);

  if (meetData.length === 0) {
    return (
      <div className="text-center py-6" style={{ color: "var(--mute)" }}>
        <div className="text-sm">沒有這場比賽的紀錄</div>
      </div>
    );
  }

  return (
    <div>
      <div className="display-cn text-base mb-3" style={{ color: "var(--ink)" }}>
        🏆 {meet} · {meetData.length} 位參賽
      </div>
      <div className="space-y-2">
        {meetData.map(d => (
          <div key={d.name} className="rounded-lg p-3 border"
               style={{ background: "var(--bg)", borderColor: "var(--line)" }}>
            <div className="font-bold text-sm mb-2" style={{ color: "var(--ink)" }}>
              {d.name}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(d.results).map(([ev, t]) => (
                <div key={ev} className="rounded px-2 py-1 border"
                     style={{ background: "transparent", borderColor: "var(--line)" }}>
                  <span className="text-[11px]" style={{ color: "var(--mute)" }}>{ev}</span>
                  <span className="num font-bold ml-1" style={{ color: "var(--ink)" }}>
                    {formatTime(t)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// === 選手對比 (A vs B) ===
function CompareView({ swimStats }) {
  const { roster } = useRoster();
  const [swimmerA, setSwimmerA] = useState(null);
  const [swimmerB, setSwimmerB] = useState(null);
  const names = sortSwimmerNames(Object.keys(swimStats.swimmers), roster);

  // 計算 PB
  const calcPB = (name) => {
    if (!name) return {};
    const pb = {};
    (swimStats.swimmers[name] || []).forEach(r => {
      Object.entries(r.results || {}).forEach(([ev, t]) => {
        if (!pb[ev] || t < pb[ev].time) pb[ev] = { time: t, meet: r.meet };
      });
    });
    return pb;
  };

  const pbA = useMemo(() => calcPB(swimmerA), [swimmerA, swimStats]);
  const pbB = useMemo(() => calcPB(swimmerB), [swimmerB, swimStats]);

  // 找兩人都有紀錄的項目
  const commonEvents = swimStats.events.filter(ev => pbA[ev] || pbB[ev]);

  return (
    <section className="rounded-2xl p-4 sm:p-5 border-2"
             style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
      <div className="text-[10px] tk-x mb-3" style={{ color: "var(--mute)" }}>
        選手對比 · A vs B
      </div>

      {/* 兩個下拉 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <select value={swimmerA || ""} onChange={e => setSwimmerA(e.target.value || null)}
                className="px-3 py-2 rounded-md border-2 text-sm font-medium"
                style={{ borderColor: "var(--accent)", background: "var(--accent-bg)", color: "var(--accent-2)" }}>
          <option value="">選手 A</option>
          {names.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={swimmerB || ""} onChange={e => setSwimmerB(e.target.value || null)}
                className="px-3 py-2 rounded-md border-2 text-sm font-medium"
                style={{ borderColor: "var(--purple, #7C4DBC)", background: "#EFE4F8", color: "#7C4DBC" }}>
          <option value="">選手 B</option>
          {names.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {(!swimmerA || !swimmerB) ? (
        <div className="text-center py-8" style={{ color: "var(--mute)" }}>
          <div className="text-4xl mb-2">⚖️</div>
          <div className="text-sm">請選擇兩位選手進行對比</div>
        </div>
      ) : commonEvents.length === 0 ? (
        <div className="text-center py-8" style={{ color: "var(--mute)" }}>
          <div className="text-sm">兩位選手沒有共同項目</div>
        </div>
      ) : (
        <div className="space-y-1">
          {/* 表頭 */}
          <div className="grid items-center gap-2 px-2 py-2 rounded"
               style={{
                 gridTemplateColumns: "1fr 60px auto 60px 1fr",
                 background: "var(--panel-2)",
               }}>
            <div className="text-xs font-bold text-right" style={{ color: "var(--accent-2)" }}>{swimmerA}</div>
            <div className="text-[10px] tk-x text-center" style={{ color: "var(--mute)" }}>A 時間</div>
            <div className="text-[10px] tk-x text-center" style={{ color: "var(--mute)" }}>項目</div>
            <div className="text-[10px] tk-x text-center" style={{ color: "var(--mute)" }}>B 時間</div>
            <div className="text-xs font-bold" style={{ color: "#7C4DBC" }}>{swimmerB}</div>
          </div>
          {commonEvents.map(ev => {
            const tA = pbA[ev]?.time;
            const tB = pbB[ev]?.time;
            const hasA = tA !== undefined;
            const hasB = tB !== undefined;
            const aWins = hasA && hasB && tA < tB;
            const bWins = hasA && hasB && tB < tA;
            const diff = hasA && hasB ? Math.abs(tA - tB) : null;
            return (
              <div key={ev} className="grid items-center gap-2 px-2 py-2 rounded border"
                   style={{
                     gridTemplateColumns: "1fr 60px auto 60px 1fr",
                     borderColor: "var(--line)",
                     background: "var(--bg)",
                   }}>
                {/* A 的勝負標 */}
                <div className="text-right">
                  {aWins && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                  style={{ background: "var(--accent-bg)", color: "var(--accent-2)" }}>
                    快 {diff.toFixed(2)}s
                  </span>}
                </div>
                {/* A 的時間 */}
                <div className="num text-sm font-bold text-center"
                     style={{ color: aWins ? "var(--accent-2)" : (hasA ? "var(--ink)" : "var(--mute)") }}>
                  {hasA ? formatTime(tA) : "—"}
                </div>
                {/* 項目名 */}
                <div className="text-xs font-bold text-center px-2" style={{ color: "var(--ink)", minWidth: 50 }}>
                  {ev}
                </div>
                {/* B 的時間 */}
                <div className="num text-sm font-bold text-center"
                     style={{ color: bWins ? "#7C4DBC" : (hasB ? "var(--ink)" : "var(--mute)") }}>
                  {hasB ? formatTime(tB) : "—"}
                </div>
                {/* B 的勝負標 */}
                <div>
                  {bWins && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                  style={{ background: "#EFE4F8", color: "#7C4DBC" }}>
                    快 {diff.toFixed(2)}s
                  </span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// === 完整成績清單（含篩選） ===
function RecordsView({ swimStats }) {
  const { roster } = useRoster();
  const [filterSwimmer, setFilterSwimmer] = useState("");
  const [filterMeet, setFilterMeet] = useState("");
  const [filterEvent, setFilterEvent] = useState("");

  // 攤平所有紀錄
  const allRecords = useMemo(() => {
    const arr = [];
    Object.entries(swimStats.swimmers || {}).forEach(([name, records]) => {
      (records || []).forEach(r => {
        Object.entries(r.results || {}).forEach(([ev, t]) => {
          arr.push({ swimmer: name, meet: r.meet, event: ev, time: t });
        });
      });
    });
    return arr;
  }, [swimStats]);

  // 篩選
  const filtered = allRecords.filter(r =>
    (!filterSwimmer || r.swimmer === filterSwimmer) &&
    (!filterMeet || r.meet === filterMeet) &&
    (!filterEvent || r.event === filterEvent)
  );

  // 計算每人每項目的 PB（用於標 ★）
  const pbSet = useMemo(() => {
    const map = {};
    allRecords.forEach(r => {
      const k = `${r.swimmer}|${r.event}`;
      if (!map[k] || r.time < map[k].time) map[k] = { time: r.time, meet: r.meet };
    });
    const set = new Set();
    Object.entries(map).forEach(([k, v]) => {
      set.add(`${k}|${v.meet}|${v.time}`);
    });
    return set;
  }, [allRecords]);

  const clearFilters = () => {
    setFilterSwimmer(""); setFilterMeet(""); setFilterEvent("");
  };

  const hasFilter = filterSwimmer || filterMeet || filterEvent;

  return (
    <section className="rounded-2xl p-4 sm:p-5 border-2"
             style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-[10px] tk-x" style={{ color: "var(--mute)" }}>
          完整成績清單 · 共 {allRecords.length} 筆{hasFilter && ` · 篩選後 ${filtered.length} 筆`}
        </div>
        {hasFilter && (
          <button onClick={clearFilters}
                  className="btn-tactile text-[11px] px-2 py-1 rounded border"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            清除篩選
          </button>
        )}
      </div>

      {/* 篩選器 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <select value={filterSwimmer} onChange={e => setFilterSwimmer(e.target.value)}
                className="px-3 py-2 rounded-md border text-xs"
                style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }}>
          <option value="">所有選手</option>
          {sortSwimmerNames(Object.keys(swimStats.swimmers || {}), roster).map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterMeet} onChange={e => setFilterMeet(e.target.value)}
                className="px-3 py-2 rounded-md border text-xs"
                style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }}>
          <option value="">所有比賽</option>
          {(swimStats.meets || []).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)}
                className="px-3 py-2 rounded-md border text-xs"
                style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }}>
          <option value="">所有項目</option>
          {(swimStats.events || []).map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* 表格 */}
      {filtered.length === 0 ? (
        <div className="text-center py-8" style={{ color: "var(--mute)" }}>
          <div className="text-sm">沒有符合條件的紀錄</div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--line)" }}>
          <div className="grid items-center text-xs font-bold px-2 py-2"
               style={{
                 gridTemplateColumns: "1fr 1.5fr 60px 70px",
                 background: "var(--ink)", color: "var(--bg)",
               }}>
            <div>選手</div>
            <div>比賽</div>
            <div className="text-center">項目</div>
            <div className="text-right">時間</div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filtered.map((r, i) => {
              const isPB = pbSet.has(`${r.swimmer}|${r.event}|${r.meet}|${r.time}`);
              return (
                <div key={i} className="grid items-center px-2 py-1.5 text-xs"
                     style={{
                       gridTemplateColumns: "1fr 1.5fr 60px 70px",
                       borderBottom: "1px solid var(--line)",
                       background: i % 2 === 0 ? "var(--bg)" : "var(--panel-2)",
                     }}>
                  <div className="font-medium truncate" style={{ color: "var(--ink)" }}>{r.swimmer}</div>
                  <div className="truncate" style={{ color: "var(--ink-2)" }}>{r.meet}</div>
                  <div className="text-center" style={{ color: "var(--ink-2)" }}>{r.event}</div>
                  <div className="num text-right font-bold" style={{ color: isPB ? "var(--green)" : "var(--ink)" }}>
                    {formatTime(r.time)}{isPB && " ★"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="text-[10px] mt-2" style={{ color: "var(--mute)" }}>
        ★ 表示該選手該項目的個人最佳
      </div>
    </section>
  );
}


// === 整場比賽錄入（管理員） ===
function InputView({ swimStats, setSwimStats, logAction, user }) {
  const [mode, setMode] = useState("meet");  // meet / single / manage
  return (
    <div className="space-y-3">
      {/* 模式切換 */}
      <div className="flex gap-1 p-1 rounded-xl border-2 flex-wrap"
           style={{ borderColor: "var(--accent-2)", background: "var(--accent-bg)" }}>
        {[
          { k: "meet", l: "整場比賽錄入", icon: "🏆" },
          { k: "single", l: "快速單筆", icon: "⚡" },
          { k: "manage", l: "選手 / 比賽管理", icon: "📋" },
        ].map(t => {
          const active = mode === t.k;
          return (
            <button key={t.k} onClick={() => setMode(t.k)}
                    className="btn-tactile flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
                    style={{
                      background: active ? "var(--accent-2)" : "transparent",
                      color: active ? "#fff" : "var(--accent-2)",
                      minWidth: 100,
                    }}>
              <span>{t.icon}</span>
              {t.l}
            </button>
          );
        })}
      </div>

      {mode === "meet" && <MeetInput swimStats={swimStats} setSwimStats={setSwimStats} logAction={logAction} />}
      {mode === "single" && <SingleInput swimStats={swimStats} setSwimStats={setSwimStats} logAction={logAction} />}
      {mode === "manage" && <SwimStatsManage swimStats={swimStats} setSwimStats={setSwimStats} logAction={logAction} />}
    </div>
  );
}

// === 整場比賽錄入 ===
function MeetInput({ swimStats, setSwimStats, logAction }) {
  const { roster } = useRoster();
  const [selectedMeet, setSelectedMeet] = useState("");
  const [showNewMeet, setShowNewMeet] = useState(false);
  const [newMeetName, setNewMeetName] = useState("");
  const [selectedSwimmers, setSelectedSwimmers] = useState(new Set());
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState("");

  const allNames = sortSwimmerNames(Object.keys(swimStats.swimmers || {}), roster);

  const applyLastSwimmers = () => {
    if (swimStats.meets.length === 0) return;
    const lastMeet = swimStats.meets[swimStats.meets.length - 1];
    const last = new Set();
    Object.entries(swimStats.swimmers || {}).forEach(([name, records]) => {
      if (records.some(r => r.meet === lastMeet)) last.add(name);
    });
    setSelectedSwimmers(last);
  };

  const getExisting = (name, ev) => {
    const records = swimStats.swimmers[name] || [];
    const r = records.find(x => x.meet === selectedMeet);
    return r?.results?.[ev];
  };

  const addNewMeet = () => {
    const trimmed = newMeetName.trim();
    if (!trimmed) return;
    if (swimStats.meets.includes(trimmed)) {
      alert("這場比賽已存在");
      return;
    }
    setSwimStats({
      ...swimStats,
      meets: [...swimStats.meets, trimmed],
    });
    setSelectedMeet(trimmed);
    setNewMeetName("");
    setShowNewMeet(false);
    if (logAction) logAction("add_meet", { target: trimmed, targetLabel: `新增比賽：${trimmed}` });
  };

  const toggleSwimmer = (name) => {
    const next = new Set(selectedSwimmers);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedSwimmers(next);
  };

  const setCellDraft = (name, ev, val) => {
    setDraft(d => ({ ...d, [name]: { ...(d[name] || {}), [ev]: val } }));
  };

  const changeCount = useMemo(() => {
    let n = 0;
    Object.entries(draft).forEach(([name, evs]) => {
      Object.entries(evs).forEach(([ev, v]) => {
        const trimmed = (v || "").trim();
        const existing = getExisting(name, ev);
        const newTime = trimmed ? parseTime(trimmed) : null;
        if (newTime !== null) {
          if (existing === undefined || Math.abs(existing - newTime) > 0.001) n++;
        }
      });
    });
    return n;
  }, [draft, swimStats, selectedMeet]);

  const saveAll = async () => {
    if (!selectedMeet) {
      setSaveResult("✗ 請先選比賽");
      return;
    }
    setSaving(true);
    setSaveResult("");
    try {
      const newSwimmers = { ...(swimStats.swimmers || {}) };
      let updateCount = 0;
      Object.entries(draft).forEach(([name, evs]) => {
        const records = [...(newSwimmers[name] || [])];
        let meetRecIdx = records.findIndex(r => r.meet === selectedMeet);
        let meetRec;
        if (meetRecIdx < 0) {
          meetRec = { meet: selectedMeet, results: {} };
          records.push(meetRec);
          meetRecIdx = records.length - 1;
        } else {
          meetRec = { meet: selectedMeet, results: { ...records[meetRecIdx].results } };
          records[meetRecIdx] = meetRec;
        }
        Object.entries(evs).forEach(([ev, v]) => {
          const trimmed = (v || "").trim();
          if (trimmed === "") return;
          const t = parseTime(trimmed);
          if (t === null) return;
          if (meetRec.results[ev] !== t) {
            meetRec.results[ev] = t;
            updateCount++;
          }
        });
        if (Object.keys(meetRec.results).length === 0) {
          records.splice(meetRecIdx, 1);
        }
        newSwimmers[name] = records;
      });
      await setSwimStats({ ...swimStats, swimmers: newSwimmers });
      setSaveResult(`✓ 已儲存 ${updateCount} 筆成績`);
      setDraft({});
      if (logAction) logAction("save_meet_input", {
        target: selectedMeet,
        targetLabel: `錄入「${selectedMeet}」共 ${updateCount} 筆`,
      });
    } catch (e) {
      setSaveResult(`✗ ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <section className="rounded-xl p-3 border-2"
               style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="num text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ background: "var(--accent-2)", color: "#fff" }}>1</span>
          <span className="text-sm font-bold" style={{ color: "var(--ink)" }}>選擇比賽</span>
        </div>
        {!showNewMeet ? (
          <div className="flex gap-2 flex-wrap">
            <select value={selectedMeet} onChange={e => setSelectedMeet(e.target.value)}
                    className="flex-1 min-w-[180px] px-3 py-2 rounded-md border-2 text-sm"
                    style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }}>
              <option value="">-- 選一場比賽 --</option>
              {swimStats.meets.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={() => setShowNewMeet(true)}
                    className="btn-tactile px-3 py-2 rounded-md text-xs font-medium border-2"
                    style={{ borderColor: "var(--green)", color: "var(--green)" }}>
              + 新增比賽
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input type="text" value={newMeetName} onChange={e => setNewMeetName(e.target.value)}
                   onKeyDown={e => e.key === "Enter" && addNewMeet()}
                   placeholder="例：115 年市中運"
                   className="flex-1 px-3 py-2 rounded-md border-2 text-sm"
                   style={{ borderColor: "var(--green)", background: "var(--bg)" }} />
            <button onClick={addNewMeet} disabled={!newMeetName.trim()}
                    className="btn-tactile px-3 py-2 rounded-md text-xs font-medium"
                    style={{ background: "var(--green)", color: "#fff" }}>
              建立
            </button>
            <button onClick={() => { setShowNewMeet(false); setNewMeetName(""); }}
                    className="btn-tactile px-3 py-2 rounded-md text-xs"
                    style={{ color: "var(--mute)" }}>
              取消
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl p-3 border-2"
               style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="num text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ background: "var(--accent-2)", color: "#fff" }}>2</span>
            <span className="text-sm font-bold" style={{ color: "var(--ink)" }}>
              勾選參賽選手 <span className="num" style={{ color: "var(--accent-2)" }}>{selectedSwimmers.size}</span> / {allNames.length}
            </span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setSelectedSwimmers(new Set(allNames))}
                    className="btn-tactile text-[11px] px-2 py-1 rounded border"
                    style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>全選</button>
            <button onClick={() => setSelectedSwimmers(new Set())}
                    className="btn-tactile text-[11px] px-2 py-1 rounded border"
                    style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>清除</button>
            <button onClick={applyLastSwimmers}
                    className="btn-tactile text-[11px] px-2 py-1 rounded border"
                    style={{ borderColor: "var(--accent)", color: "var(--accent-2)" }}>套用上一場</button>
          </div>
        </div>
        <div className="space-y-2.5">
          {(() => {
            const nameGrade = {};
            (roster || []).forEach(p => { nameGrade[p.name] = p.grade; });
            const groups = [9, 8, 7]
              .map(g => ({ grade: g, label: GRADE_NAMES[g], members: allNames.filter(n => nameGrade[n] === g) }))
              .filter(g => g.members.length > 0);
            const others = allNames.filter(n => nameGrade[n] === undefined);
            const renderChip = (n) => {
              const sel = selectedSwimmers.has(n);
              return (
                <button key={n} onClick={() => toggleSwimmer(n)}
                        className="btn-tactile px-2 py-1 rounded text-[11px] sm:text-xs font-medium border"
                        style={{
                          background: sel ? "var(--accent-2)" : "transparent",
                          color: sel ? "#fff" : "var(--ink-2)",
                          borderColor: sel ? "var(--accent-2)" : "var(--line-strong)",
                        }}>
                  {sel && "✓ "}{n}
                </button>
              );
            };
            return (
              <>
                {groups.map(g => (
                  <div key={g.grade}>
                    <div className="text-[10px] font-bold mb-1" style={{ color: "var(--accent-2)" }}>
                      {g.label}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.members.map(renderChip)}
                    </div>
                  </div>
                ))}
                {others.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold mb-1" style={{ color: "#9A6420" }}>
                      其他
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {others.map(renderChip)}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      <section className="rounded-xl p-3 border-2"
               style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="num text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ background: "var(--accent-2)", color: "#fff" }}>3</span>
          <span className="text-sm font-bold" style={{ color: "var(--ink)" }}>
            填入成績 <span className="text-[10px] font-normal" style={{ color: "var(--mute)" }}>
              （藍底為既有,留空表示未參賽）
            </span>
          </span>
        </div>
        {!selectedMeet || selectedSwimmers.size === 0 ? (
          <div className="text-center py-6 text-sm" style={{ color: "var(--mute)" }}>
            請先選擇比賽與參賽選手
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{
                    position: "sticky", left: 0, zIndex: 2,
                    background: "var(--ink)", color: "var(--bg)",
                    padding: "6px 8px", textAlign: "left", minWidth: 80,
                    borderBottom: "2px solid var(--ink)",
                  }}>選手</th>
                  {swimStats.events.map(ev => (
                    <th key={ev} style={{
                      background: "var(--ink)", color: "var(--bg)",
                      padding: "6px 4px", minWidth: 60, fontSize: 10,
                      borderBottom: "2px solid var(--ink)",
                    }}>{ev}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortSwimmerNames([...selectedSwimmers], roster).map(name => (
                  <tr key={name}>
                    <td style={{
                      position: "sticky", left: 0, zIndex: 1,
                      background: "var(--panel-2)", padding: "4px 8px",
                      fontWeight: 600, color: "var(--ink)",
                      borderBottom: "1px solid var(--line)",
                    }}>{name}</td>
                    {swimStats.events.map(ev => {
                      const existing = getExisting(name, ev);
                      const draftVal = draft[name]?.[ev];
                      const hasExisting = existing !== undefined;
                      const displayVal = draftVal !== undefined ? draftVal :
                        (hasExisting ? formatTime(existing) : "");
                      return (
                        <td key={ev} style={{
                          padding: 1, borderBottom: "1px solid var(--line)",
                          background: hasExisting && draftVal === undefined ? "#E8F1F8" : "transparent",
                        }}>
                          <input type="text" value={displayVal}
                                 onChange={e => setCellDraft(name, ev, e.target.value)}
                                 className="num w-full px-1 py-1 rounded text-xs"
                                 style={{
                                   background: "transparent", border: "1px solid transparent",
                                   minWidth: 50,
                                 }} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="sticky bottom-2 z-10 rounded-xl border-2 p-3 flex items-center justify-between flex-wrap gap-2 shadow-lg"
           style={{ background: "var(--ink)", borderColor: "var(--ink)" }}>
        <div className="text-xs" style={{ color: "rgba(242,237,226,0.8)" }}>
          {changeCount > 0 ? (
            <>準備儲存 <span className="num font-bold" style={{ color: "var(--green-2)" }}>{changeCount}</span> 筆變更</>
          ) : "尚無變更"}
          {saveResult && (
            <span className="ml-2 font-medium"
                  style={{ color: saveResult.startsWith("✓") ? "var(--green-2)" : "#FAA8A8" }}>
              · {saveResult}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setDraft({}); setSaveResult(""); }}
                  className="btn-tactile px-3 py-1.5 rounded text-xs border"
                  style={{ borderColor: "rgba(242,237,226,0.3)", color: "rgba(242,237,226,0.8)" }}>
            清空草稿
          </button>
          <button onClick={saveAll} disabled={changeCount === 0 || saving}
                  className="btn-tactile px-4 py-1.5 rounded font-bold text-xs"
                  style={{
                    background: changeCount > 0 && !saving ? "var(--green)" : "rgba(255,255,255,0.15)",
                    color: changeCount > 0 && !saving ? "#fff" : "rgba(242,237,226,0.4)",
                  }}>
            {saving ? "儲存中..." : "💾 儲存全部"}
          </button>
        </div>
      </div>
    </div>
  );
}

// === 快速單筆輸入 ===
function SingleInput({ swimStats, setSwimStats, logAction }) {
  const { roster } = useRoster();
  const [name, setName] = useState("");
  const [meet, setMeet] = useState("");
  const [event, setEvent] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [result, setResult] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name || !meet || !event || !timeStr.trim()) {
      setResult("✗ 請填完整");
      return;
    }
    const t = parseTime(timeStr.trim());
    if (t === null) {
      setResult("✗ 時間格式錯誤");
      return;
    }
    setSaving(true);
    try {
      const newSwimmers = { ...(swimStats.swimmers || {}) };
      const records = [...(newSwimmers[name] || [])];
      const idx = records.findIndex(r => r.meet === meet);
      if (idx >= 0) {
        records[idx] = {
          meet,
          results: { ...records[idx].results, [event]: t },
        };
      } else {
        records.push({ meet, results: { [event]: t } });
      }
      newSwimmers[name] = records;
      await setSwimStats({ ...swimStats, swimmers: newSwimmers });
      setResult(`✓ ${name} / ${meet} / ${event} = ${formatTime(t)}`);
      setTimeStr("");
      if (logAction) logAction("save_single_input", {
        target: `${name}-${meet}-${event}`,
        targetLabel: `${name} ${meet} ${event}：${formatTime(t)}`,
      });
    } catch (e) {
      setResult(`✗ ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl p-4 border-2"
             style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
      <div className="text-sm font-bold mb-3" style={{ color: "var(--ink)" }}>⚡ 快速新增 / 修改單筆</div>
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select value={name} onChange={e => setName(e.target.value)}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }}>
            <option value="">選手</option>
            {sortSwimmerNames(Object.keys(swimStats.swimmers || {}), roster).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={meet} onChange={e => setMeet(e.target.value)}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }}>
            <option value="">比賽</option>
            {(swimStats.meets || []).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={event} onChange={e => setEvent(e.target.value)}
                  className="px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }}>
            <option value="">項目</option>
            {(swimStats.events || []).map(ev => <option key={ev} value={ev}>{ev}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <input type="text" value={timeStr} onChange={e => setTimeStr(e.target.value)}
                 onKeyDown={e => e.key === "Enter" && save()}
                 placeholder="時間 (1:23.45 或 83.45)"
                 className="num flex-1 px-3 py-2 rounded-md border text-sm"
                 style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }} />
          <button onClick={save} disabled={saving}
                  className="btn-tactile px-4 py-2 rounded-md font-bold text-sm"
                  style={{ background: "var(--accent-2)", color: "#fff" }}>
            {saving ? "..." : "儲存"}
          </button>
        </div>
        {result && (
          <div className="text-xs mt-1"
               style={{ color: result.startsWith("✓") ? "var(--green)" : "var(--red)" }}>
            {result}
          </div>
        )}
        <div className="text-[10px]" style={{ color: "var(--mute)" }}>
          時間格式：1:23.45 / 1:23:45 / 83.45。同選手同比賽同項目會自動覆蓋。
        </div>
      </div>
    </section>
  );
}

// === 選手 / 比賽管理 ===
function SwimStatsManage({ swimStats, setSwimStats, logAction }) {
  const { roster } = useRoster();
  const [newSwimmer, setNewSwimmer] = useState("");
  const [newMeet, setNewMeet] = useState("");

  const addSwimmer = async () => {
    const n = newSwimmer.trim();
    if (!n) return;
    if (swimStats.swimmers[n]) { alert("選手已存在"); return; }
    await setSwimStats({
      ...swimStats,
      swimmers: { ...swimStats.swimmers, [n]: [] },
    });
    setNewSwimmer("");
    if (logAction) logAction("add_swimmer", { target: n, targetLabel: `新增選手：${n}` });
  };

  const removeSwimmer = async (n) => {
    if (!confirm(`刪除選手「${n}」？所有相關成績會一併移除。`)) return;
    const next = { ...swimStats.swimmers };
    delete next[n];
    await setSwimStats({ ...swimStats, swimmers: next });
    if (logAction) logAction("remove_swimmer", { target: n, targetLabel: `刪除選手：${n}` });
  };

  // 從點名名單批次匯入：把 roster 有、但成績沒有的選手全部加進來（空成績）
  const syncFromRoster = async () => {
    const existing = swimStats.swimmers || {};
    const toAdd = (roster || []).map(p => p.name).filter(name => !existing[name]);
    if (toAdd.length === 0) {
      alert("點名名單上的選手都已在成績名單中");
      return;
    }
    if (!confirm(`將從點名名單新增 ${toAdd.length} 位選手到成績名單：\n${toAdd.join("、")}`)) return;
    const next = { ...existing };
    toAdd.forEach(name => { next[name] = []; });
    await setSwimStats({ ...swimStats, swimmers: next });
    if (logAction) logAction("sync_swimmers_from_roster", {
      target: "swim_stats",
      targetLabel: `從點名名單匯入 ${toAdd.length} 位選手`,
    });
  };

  const addMeet = async () => {
    const m = newMeet.trim();
    if (!m) return;
    if (swimStats.meets.includes(m)) { alert("比賽已存在"); return; }
    await setSwimStats({ ...swimStats, meets: [...swimStats.meets, m] });
    setNewMeet("");
    if (logAction) logAction("add_meet", { target: m, targetLabel: `新增比賽：${m}` });
  };

  const removeMeet = async (m) => {
    if (!confirm(`刪除比賽「${m}」？所有相關成績會一併移除。`)) return;
    const newSwimmers = { ...swimStats.swimmers };
    Object.keys(newSwimmers).forEach(n => {
      newSwimmers[n] = newSwimmers[n].filter(r => r.meet !== m);
    });
    await setSwimStats({
      ...swimStats,
      meets: swimStats.meets.filter(x => x !== m),
      swimmers: newSwimmers,
    });
    if (logAction) logAction("remove_meet", { target: m, targetLabel: `刪除比賽：${m}` });
  };

  const moveMeet = async (m, dir) => {
    const idx = swimStats.meets.indexOf(m);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= swimStats.meets.length) return;
    const newMeets = [...swimStats.meets];
    [newMeets[idx], newMeets[newIdx]] = [newMeets[newIdx], newMeets[idx]];
    await setSwimStats({ ...swimStats, meets: newMeets });
  };

  return (
    <div className="space-y-3">
      <section className="rounded-xl p-3 border-2"
               style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="text-sm font-bold" style={{ color: "var(--ink)" }}>
            選手管理 <span className="num text-xs font-normal" style={{ color: "var(--mute)" }}>
              ({Object.keys(swimStats.swimmers || {}).length})
            </span>
          </div>
          <button onClick={syncFromRoster}
                  className="btn-tactile px-2.5 py-1 rounded-md text-[11px] font-medium border"
                  style={{ borderColor: "var(--accent-2)", color: "var(--accent-2)" }}>
            ↻ 從點名名單匯入
          </button>
        </div>
        <div className="text-[10px] mb-2" style={{ color: "var(--mute)" }}>
          選手順序自動依照「點名名單」排列。橘點 = 不在點名名單上的選手。
        </div>
        <div className="flex gap-2 mb-3">
          <input type="text" value={newSwimmer} onChange={e => setNewSwimmer(e.target.value)}
                 onKeyDown={e => e.key === "Enter" && addSwimmer()}
                 placeholder="新選手名字"
                 className="flex-1 px-3 py-1.5 rounded-md border text-sm"
                 style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }} />
          <button onClick={addSwimmer} disabled={!newSwimmer.trim()}
                  className="btn-tactile px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{ background: "var(--green)", color: "#fff" }}>+ 新增</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sortSwimmerNames(Object.keys(swimStats.swimmers || {}), roster).map(n => {
            const inRoster = (roster || []).some(p => p.name === n);
            return (
              <div key={n} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border"
                   style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }}>
                {!inRoster && (
                  <span title="不在點名名單上" style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#E89B3C", display: "inline-block",
                  }} />
                )}
                <span>{n}</span>
                <button onClick={() => removeSwimmer(n)}
                        className="text-[10px] hover:text-red-600"
                        style={{ color: "var(--mute)" }}>✕</button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl p-3 border-2"
               style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <div className="text-sm font-bold mb-2" style={{ color: "var(--ink)" }}>
          比賽管理 <span className="num text-xs font-normal" style={{ color: "var(--mute)" }}>
            ({(swimStats.meets || []).length})
          </span>
        </div>
        <div className="flex gap-2 mb-3">
          <input type="text" value={newMeet} onChange={e => setNewMeet(e.target.value)}
                 onKeyDown={e => e.key === "Enter" && addMeet()}
                 placeholder="新比賽名稱"
                 className="flex-1 px-3 py-1.5 rounded-md border text-sm"
                 style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }} />
          <button onClick={addMeet} disabled={!newMeet.trim()}
                  className="btn-tactile px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{ background: "var(--green)", color: "#fff" }}>+ 新增</button>
        </div>
        <div className="space-y-1">
          {(swimStats.meets || []).map((m, i) => (
            <div key={m} className="flex items-center gap-2 px-2 py-1.5 rounded border"
                 style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
              <span className="num text-[10px]" style={{ color: "var(--mute)", minWidth: 20 }}>{i + 1}</span>
              <span className="flex-1 text-sm" style={{ color: "var(--ink)" }}>{m}</span>
              <button onClick={() => moveMeet(m, -1)} disabled={i === 0}
                      className="text-xs px-1.5 py-0.5 rounded border"
                      style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>▲</button>
              <button onClick={() => moveMeet(m, 1)} disabled={i === swimStats.meets.length - 1}
                      className="text-xs px-1.5 py-0.5 rounded border"
                      style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>▼</button>
              <button onClick={() => removeMeet(m)}
                      className="text-xs px-1.5 py-0.5 rounded border"
                      style={{ borderColor: "var(--red)", color: "var(--red)" }}>✕</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


function SwimStatsImporter({ swimStats, setSwimStats, logAction }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState("");

  const handleImport = async (file) => {
    setImporting(true);
    setResult("");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.swimmers || !data.events || !data.meets) {
        throw new Error("檔案格式不正確（缺少 swimmers/events/meets 欄位）");
      }
      await setSwimStats({
        events: data.events,
        meets: data.meets,
        swimmers: data.swimmers,
      });
      const cnt = Object.keys(data.swimmers).length;
      setResult(`✓ 成功匯入 ${cnt} 位選手 / ${data.meets.length} 場比賽 / ${data.events.length} 個項目`);
      if (logAction) logAction("import_swim_stats", {
        target: "swim_stats",
        targetLabel: `匯入比賽成績（${cnt} 位選手）`,
      });
    } catch (e) {
      setResult(`✗ ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = () => {
    try {
      const exportData = {
        events: swimStats.events || [],
        meets: swimStats.meets || [],
        swimmers: swimStats.swimmers || {},
        _version: swimStats._version || new Date().toISOString(),
      };
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.href = url;
      a.download = `swim_stats_${ts}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setResult("✓ 已下載 JSON 備份");
      if (logAction) logAction("export_swim_stats", {
        target: "swim_stats",
        targetLabel: `匯出比賽成績備份`,
      });
    } catch (e) {
      setResult(`✗ ${e.message}`);
    }
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        <label className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium cursor-pointer"
               style={{ background: "var(--accent-2)", color: "#fff" }}>
          📥 匯入 JSON
          <input type="file" accept=".json" className="hidden"
                 onChange={e => e.target.files[0] && handleImport(e.target.files[0])} />
        </label>
        <button onClick={handleExport}
                className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium border-2"
                style={{ borderColor: "var(--accent-2)", color: "var(--accent-2)" }}>
          📤 匯出 JSON 備份
        </button>
      </div>
      {importing && (
        <div className="text-xs mt-2" style={{ color: "var(--mute)" }}>處理中...</div>
      )}
      {result && (
        <div className="text-xs mt-2" style={{ color: result.startsWith("✓") ? "var(--green)" : "var(--red)" }}>
          {result}
        </div>
      )}
    </div>
  );
}


// ============ CALENDAR EDITOR VIEW ============
function CalendarEditorView({ attendance, setAttendance, logAction, isOwner, isAdmin }) {
  const today = new Date();
  const [viewY, setViewY] = useState(today.getFullYear());
  const [viewM, setViewM] = useState(today.getMonth());
  const [editingDate, setEditingDate] = useState(null); // 正在編輯的日期 dateStr
  const [confirmOverwrite, setConfirmOverwrite] = useState(null); // 已有點名的覆蓋警告
  // 正在編輯時的暫存值
  const [editAm, setEditAm] = useState(null);
  const [editPm, setEditPm] = useState(null);
  const [editNote, setEditNote] = useState("");

  // 月份切換
  const goPrev = () => {
    const { Y: nY, M: nM } = shiftMonth(viewY, viewM, -1);
    setViewY(nY); setViewM(nM);
  };
  const goNext = () => {
    const { Y: nY, M: nM } = shiftMonth(viewY, viewM, 1);
    setViewY(nY); setViewM(nM);
  };
  const goToday = () => {
    setViewY(today.getFullYear());
    setViewM(today.getMonth());
  };

  // 一個日期是否「已有點名」
  const hasAttendanceData = (dateStr) => {
    const a = attendance[dateStr];
    if (!a) return false;
    const checkObj = (o) => o && Object.keys(o).length > 0;
    return checkObj(a.am) || checkObj(a.pm) || checkObj(a.am_late) || checkObj(a.pm_late) ||
           checkObj(a.am_solo) || checkObj(a.pm_solo) || checkObj(a.am_notes) || checkObj(a.pm_notes);
  };

  // 開啟編輯：載入該日當前場地與備註
  const openEdit = (dateStr) => {
    const am = getVenue(attendance, dateStr, "am");
    const pm = getVenue(attendance, dateStr, "pm");
    const dayData = attendance[dateStr];
    const note = dayData?.notes || getCalendarNote(dateStr) || "";
    setEditAm(am);
    setEditPm(pm);
    setEditNote(note);
    setEditingDate(dateStr);
  };

  const closeEdit = () => {
    setEditingDate(null);
    setEditAm(null);
    setEditPm(null);
    setEditNote("");
    setConfirmOverwrite(null);
  };

  // 實際儲存
  const doSave = async () => {
    const dateStr = editingDate;
    const beforeAm = getVenue(attendance, dateStr, "am");
    const beforePm = getVenue(attendance, dateStr, "pm");
    const beforeNote = attendance[dateStr]?.notes || "";

    setAttendance(prev => {
      const next = { ...prev };
      const day = { ...(next[dateStr] || {}) };
      day.venue = { am: editAm, pm: editPm };
      if (editNote.trim()) {
        day.notes = editNote.trim();
      } else {
        delete day.notes;
      }
      next[dateStr] = day;
      return next;
    }, {
      dateStr: dateStr,
      logPayload: {
        target: `calendar/${dateStr}`,
        targetLabel: `編輯行事曆：${dateStr}`,
        before: { am: beforeAm, pm: beforePm, notes: beforeNote },
        after: { am: editAm, pm: editPm, notes: editNote },
      },
    });
    closeEdit();
  };

  // 儲存（含確認）
  const handleSave = () => {
    if (hasAttendanceData(editingDate)) {
      setConfirmOverwrite(true);
      return;
    }
    doSave();
  };

  // 快速套用：刪除訓練日（兩場都 closed）
  const setAsClosed = () => {
    setEditAm("closed");
    setEditPm("closed");
  };
  // 快速套用：龍門全天
  const setAsLongmen = () => {
    setEditAm("longmen");
    setEditPm("longmen");
  };
  // 快速套用：永運全天
  const setAsYongyun = () => {
    setEditAm("yongyun");
    setEditPm("yongyun");
  };

  // 月曆網格
  const Y = viewY, M = viewM;
  const firstDay = new Date(Y, M, 1).getDay();
  const lastDate = new Date(Y, M + 1, 0).getDate();
  const lead = (firstDay + 6) % 7; // 週一開始
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push({ blank: true });
  for (let d = 1; d <= lastDate; d++) cells.push({ d });
  while (cells.length % 7 !== 0) cells.push({ blank: true });

  const todayStr = (today.getFullYear() === Y && today.getMonth() === M) ? toDateStr(today) : null;

  return (
    <div className="space-y-4">
      <header>
        <h2 className="display-cn text-xl sm:text-2xl mb-1" style={{ color: "var(--ink)" }}>
          📅 行事曆編輯
        </h2>
        <p className="text-xs sm:text-sm" style={{ color: "var(--mute)" }}>
          每天的場地與備註可隨時編輯，覆蓋預設值
        </p>
      </header>

      {/* 月份切換列 */}
      <section className="rounded-2xl border-2 p-3 sm:p-4"
               style={{ background: "var(--panel)", borderColor: "var(--ink)" }}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <button onClick={goPrev}
                  className="btn-tactile flex items-center gap-1 px-3 py-2 rounded-lg border-2"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            <ChevronLeft size={16} strokeWidth={2.5} />
            上個月
          </button>
          <div className="display-cn text-lg sm:text-xl font-bold text-center" style={{ color: "var(--ink)" }}>
            {Y} 年 {MONTH_NAMES_CN[M]}
          </div>
          <button onClick={goNext}
                  className="btn-tactile flex items-center gap-1 px-3 py-2 rounded-lg border-2"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            下個月
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
        <button onClick={goToday}
                className="btn-tactile w-full flex items-center justify-center gap-1 py-2 rounded-lg border"
                style={{
                  borderColor: "var(--accent)",
                  background: "var(--accent-bg)",
                  color: "var(--accent)",
                }}>
          <RotateCcw size={13} strokeWidth={2.5} />
          回今天
        </button>

        {/* 提示橫條 - 只給管理員看 */}
        {isAdmin && (
          <div className="mt-3 px-3 py-2 rounded-lg flex items-start gap-2"
               style={{ background: "var(--accent-bg)", color: "var(--accent-2)" }}>
            <span className="text-base shrink-0" style={{ marginTop: 1 }}>💡</span>
            <div className="text-[11px] sm:text-xs leading-relaxed">
              點任一格可編輯該日場地與備註。已有點名的日期會顯示 🔒，需要確認才能改。
            </div>
          </div>
        )}

        {/* 圖例 */}
        <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px]" style={{ color: "var(--mute)" }}>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ background: "var(--panel)", border: "0.5px solid var(--line-strong)" }} />
            龍門
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ background: VENUES.yongyun.bg, border: `0.5px solid ${VENUES.yongyun.color}` }} />
            永運
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ background: VENUES.closed.bg, border: `0.5px solid ${VENUES.closed.color}` }} />
            停練
          </span>
          <span className="flex items-center gap-1">🔒 已有點名</span>
          <span className="flex items-center gap-1">⭐ 整日備註</span>
        </div>
      </section>

      {/* 月曆網格 */}
      <section className="rounded-2xl border-2 p-2 sm:p-3"
               style={{ background: "var(--panel-2)", borderColor: "var(--line-strong)" }}>
        {/* 星期標頭 */}
        <div className="grid grid-cols-7 gap-1 mb-1.5 text-[10px] sm:text-xs"
             style={{ color: "var(--mute)" }}>
          {["一","二","三","四","五","六","日"].map((d, i) => (
            <div key={d} className="text-center font-medium tk-l py-1"
                 style={{ color: "var(--ink-2)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {cells.map((c, i) => {
            if (c.blank) return <div key={i} />;
            const dateStr = `${Y}-${pad(M + 1)}-${pad(c.d)}`;
            const dateInfo = getDateInfo(dateStr);
            const isSun = dateInfo.isSun;
            // 判斷此日是否「實際無訓練」（沒設場地 + 沒備註 + 沒點名 + Excel 沒設定）
            const dayData = attendance[dateStr];
            const hasManualVenue = !!dayData?.venue;
            const hasCalendarEntry = !!VENUE_CALENDAR[dateStr];
            const am = getVenue(attendance, dateStr, "am");
            const pm = getVenue(attendance, dateStr, "pm");
            const note = dayData?.notes || getCalendarNote(dateStr);
            const hasData = hasAttendanceData(dateStr);
            const isToday = dateStr === todayStr;
            const isAllClosed = am === "closed" && pm === "closed";
            const isAllYongyun = am === "yongyun" && pm === "yongyun";

            // 「空白格」= 週日且沒任何資料
            const isEmpty = isSun && !hasManualVenue && !hasCalendarEntry && !hasData && !note;

            // 主背景色
            let bg = "var(--panel)";
            let bd = "var(--line)";
            if (isEmpty) { bg = "transparent"; bd = "var(--line)"; }
            else if (isAllClosed) { bg = VENUES.closed.bg; bd = VENUES.closed.color; }
            else if (isAllYongyun) { bg = VENUES.yongyun.bg; bd = VENUES.yongyun.color; }
            else if (am === "yongyun" || pm === "yongyun") { bg = VENUES.yongyun.bg; bd = VENUES.yongyun.color; }

            return (
              <button key={i}
                      onClick={() => isAdmin && openEdit(dateStr)}
                      className="btn-tactile relative rounded-lg p-1.5 sm:p-2 text-left flex flex-col"
                      style={{
                        background: bg,
                        border: isToday ? `2px solid var(--accent)` : isEmpty ? `1px dashed var(--line-strong)` : `1px solid ${bd}`,
                        minHeight: 70,
                        cursor: isAdmin ? "pointer" : "default",
                        opacity: isAllClosed && !isEmpty ? 0.85 : 1,
                      }}>
                {/* 日期數字 */}
                <div className="flex items-start justify-between">
                  <span className="num text-sm sm:text-base font-bold"
                        style={{
                          color: isEmpty ? "var(--mute)"
                            : isAllClosed ? VENUES.closed.color
                            : "var(--ink)",
                        }}>
                    {c.d}
                  </span>
                  {hasData && (
                    <span className="text-[9px]" title="已有點名資料">🔒</span>
                  )}
                </div>

                {/* 空白格：顯示「+ 新增」按鈕 */}
                {isEmpty ? (
                  <div className="flex-1 flex flex-col items-center justify-center" style={{ color: "var(--mute)" }}>
                    <div className="text-base font-bold leading-none">+</div>
                    <div className="text-[8px] sm:text-[9px] leading-tight mt-1">新增訓練</div>
                  </div>
                ) : (
                  <>
                    {/* 場地內容 */}
                    <div className="text-[9px] sm:text-[10px] leading-tight mt-1 space-y-0.5" style={{ color: VENUES[am].color }}>
                      {am === "closed" && pm === "closed" ? (
                        <div style={{ color: VENUES.closed.color, fontWeight: 600 }}>停練</div>
                      ) : (
                        <>
                          <div style={{ color: VENUES[am].color }}>
                            早:{VENUES[am].label}
                          </div>
                          <div style={{ color: VENUES[pm].color }}>
                            午:{VENUES[pm].label}
                          </div>
                        </>
                      )}
                    </div>

                    {/* 備註 */}
                    {note && (
                      <div className="text-[9px] mt-0.5 truncate font-bold"
                           style={{ color: "var(--ink-2)" }}
                           title={note}>
                        ⭐{note}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 編輯對話框 */}
      {editingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: "rgba(20, 18, 16, 0.6)" }}
             onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}>
          <div className="rounded-2xl border-2 p-4 sm:p-5 max-w-md w-full max-h-[90vh] overflow-y-auto"
               style={{ background: "var(--panel)", borderColor: "var(--ink)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] tk-l" style={{ color: "var(--mute)" }}>編輯行事曆</div>
                <div className="display-cn text-lg sm:text-xl font-bold" style={{ color: "var(--ink)" }}>
                  {editingDate.split("-").join(" / ")} {getDateInfo(editingDate).dayLabel}
                </div>
              </div>
              <button onClick={closeEdit}
                      className="btn-tactile w-8 h-8 rounded-md flex items-center justify-center"
                      style={{ color: "var(--mute)" }}>
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* 已有點名警告 */}
            {hasAttendanceData(editingDate) && (
              <div className="mb-3 px-3 py-2 rounded-lg border flex items-start gap-2"
                   style={{ background: "var(--amber-bg)", borderColor: "var(--amber)" }}>
                <AlertTriangle size={14} strokeWidth={2.5} style={{ color: "#5C4810", marginTop: 2 }} />
                <div className="text-[11px]" style={{ color: "#5C4810" }}>
                  此日已有點名資料。改場地不會清除點名紀錄，但會影響統計。
                </div>
              </div>
            )}

            {/* 週日新增訓練提示 */}
            {getDateInfo(editingDate).isSun && !hasAttendanceData(editingDate) && (
              <div className="mb-3 px-3 py-2 rounded-lg border flex items-start gap-2"
                   style={{ background: VENUES.yongyun.bg, borderColor: VENUES.yongyun.color }}>
                <span style={{ color: VENUES.yongyun.color, fontWeight: 700, marginTop: 1 }}>+</span>
                <div className="text-[11px]" style={{ color: VENUES.yongyun.color }}>
                  這是週日。預設沒有訓練，但你可以加練。例：選「整天永運」+ 備註「比賽前加練」
                </div>
              </div>
            )}

            {/* 快速套用 */}
            <div className="mb-3">
              <div className="text-[10px] tk-l mb-1.5" style={{ color: "var(--mute)" }}>快速套用</div>
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={setAsLongmen}
                        className="btn-tactile py-1.5 rounded-md text-xs font-medium border"
                        style={{
                          background: "var(--panel-2)",
                          borderColor: "var(--line-strong)",
                          color: VENUES.longmen.color,
                        }}>
                  整天龍門
                </button>
                <button onClick={setAsYongyun}
                        className="btn-tactile py-1.5 rounded-md text-xs font-medium border"
                        style={{
                          background: VENUES.yongyun.bg,
                          borderColor: VENUES.yongyun.color,
                          color: VENUES.yongyun.color,
                        }}>
                  整天永運
                </button>
                <button onClick={setAsClosed}
                        className="btn-tactile py-1.5 rounded-md text-xs font-medium border"
                        style={{
                          background: VENUES.closed.bg,
                          borderColor: VENUES.closed.color,
                          color: VENUES.closed.color,
                        }}>
                  整天停練
                </button>
              </div>
            </div>

            {/* 早訓場地 */}
            <div className="mb-3">
              <div className="text-[10px] tk-l mb-1.5" style={{ color: "var(--mute)" }}>早訓場地</div>
              <div className="grid grid-cols-3 gap-1.5">
                {["longmen", "yongyun", "closed"].map(v => (
                  <button key={v} onClick={() => setEditAm(v)}
                          className="btn-tactile py-2 rounded-md text-xs font-medium border-2"
                          style={{
                            background: editAm === v ? VENUES[v].color : VENUES[v].bg,
                            borderColor: VENUES[v].color,
                            color: editAm === v ? "#fff" : VENUES[v].color,
                          }}>
                    {VENUES[v].label}
                  </button>
                ))}
              </div>
            </div>

            {/* 午訓場地 */}
            <div className="mb-3">
              <div className="text-[10px] tk-l mb-1.5" style={{ color: "var(--mute)" }}>午訓場地</div>
              <div className="grid grid-cols-3 gap-1.5">
                {["longmen", "yongyun", "closed"].map(v => (
                  <button key={v} onClick={() => setEditPm(v)}
                          className="btn-tactile py-2 rounded-md text-xs font-medium border-2"
                          style={{
                            background: editPm === v ? VENUES[v].color : VENUES[v].bg,
                            borderColor: VENUES[v].color,
                            color: editPm === v ? "#fff" : VENUES[v].color,
                          }}>
                    {VENUES[v].label}
                  </button>
                ))}
              </div>
            </div>

            {/* 整日備註 */}
            <div className="mb-3">
              <div className="text-[10px] tk-l mb-1.5" style={{ color: "var(--mute)" }}>整日備註（選填）</div>
              <input type="text" value={editNote}
                     onChange={e => setEditNote(e.target.value)}
                     placeholder="例如：青年盃比賽 / 兒童節 / 月考..."
                     className="w-full px-3 py-2 rounded-md text-sm"
                     style={{
                       border: "1px solid var(--line-strong)",
                       background: "var(--panel-2)",
                       color: "var(--ink)",
                     }} />
              <div className="text-[10px] mt-1" style={{ color: "var(--mute)" }}>
                會顯示在月曆格子上方
              </div>
            </div>

            {/* 操作按鈕 */}
            {!confirmOverwrite ? (
              <div className="flex gap-2">
                <button onClick={closeEdit}
                        className="btn-tactile flex-1 px-4 py-2 rounded-lg text-sm font-medium border-2"
                        style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
                  取消
                </button>
                <button onClick={handleSave}
                        className="btn-tactile flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-medium"
                        style={{ background: "var(--green)", color: "#fff" }}>
                  <Check size={14} strokeWidth={2.5} />
                  儲存變更
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-lg p-3 border-2"
                     style={{ background: "var(--red-bg)", borderColor: "var(--red)" }}>
                  <div className="text-sm font-bold mb-1" style={{ color: "var(--red)" }}>
                    ⚠️ 確認覆蓋？
                  </div>
                  <div className="text-xs" style={{ color: "var(--ink-2)" }}>
                    此日已有點名資料。改場地會影響當月統計與費用計算，但點名紀錄不會被刪除。
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmOverwrite(null)}
                          className="btn-tactile flex-1 px-4 py-2 rounded-lg text-sm font-medium border-2"
                          style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
                    取消
                  </button>
                  <button onClick={doSave}
                          className="btn-tactile flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-medium"
                          style={{ background: "var(--red)", color: "#fff" }}>
                    <Check size={14} strokeWidth={2.5} />
                    確認覆蓋
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
