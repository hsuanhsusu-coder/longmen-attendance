import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, onSnapshot, setDoc, collection, addDoc, query, orderBy, limit, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import {
  Check, X, Download, RotateCcw, Zap, AlertTriangle, Sparkles,
  Award, ChevronLeft, ChevronRight, ListChecks, CalendarDays,
  BarChart3, ClipboardCheck, Sun, Moon, Trophy, AlertCircle, Camera, Eye,
  LogOut, Cloud, CloudOff, RefreshCw, User, Settings, Plus, Trash2, Edit3, Save,
  Crown, Shield, Lock, History, Undo2, Filter, FileText
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
  { seq: 8,  cls: 804, num: 16, name: "蔡萬潼", grade: 8, sch: [1,0,0,0,1,1,0,0,1,1,0,0] },
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

// ============ DATE HELPERS ============
const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromDateStr = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

// ============ 場地常數 ============
const VENUES = {
  longmen: { id: "longmen", label: "龍門", short: "龍", color: "#1A3D4D", bg: "#E8EEF0", fee: 0 },
  yongyun: { id: "yongyun", label: "永運", short: "永", color: "#A85518", bg: "#FBE5D2", fee: 50 },
};
const VENUE_FEE = 50;
// 預設場地：週六(dow=6) 永運，其他龍門
const getDefaultVenue = (dateStr) => {
  const d = fromDateStr(dateStr);
  return d.getDay() === 6 ? "yongyun" : "longmen";
};
// 取得某天某時段的場地（優先讀 venue 設定，沒設讀預設）
const getVenue = (attendance, dateStr, period) => {
  const venueObj = attendance?.[dateStr]?.venue;
  if (venueObj && venueObj[period]) return venueObj[period];
  return getDefaultVenue(dateStr);
};

const getDateInfo = (dateStr) => {
  const date = fromDateStr(dateStr);
  const dow = date.getDay();
  if (dow === 0) return { off: true, dow };
  const dayIdx = dow - 1;
  return {
    off: false, dow,
    dayLabel: DAYS[dayIdx],
    amIdx: dayIdx * 2,
    pmIdx: dayIdx * 2 + 1,
    isSat: dow === 6,
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

  const userEmail = (user.email || "").toLowerCase();
  const ownerEmail = (config.owner || "").toLowerCase();
  const adminList = (config.admins || []).map(e => (e || "").toLowerCase());
  const isOwner = ownerEmail === userEmail;
  const isAdmin = isOwner || adminList.includes(userEmail);
  const noAdminsYet = configLoaded && !ownerEmail && adminList.length === 0;

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

  const exportAll = () => {
    const csvSafe = (s) => `"${(s || "").replace(/"/g, '""')}"`;
    const lines = [
      ["日期", "星期", "時段", "場地", "序號", "班級", "座號", "姓名", "年級", "表定", "實際", "遲到", "備註", "永運費"].join(",")
    ];
    TRAINING_DAYS.forEach((day) => {
      const dayData = attendance[day.dateStr] || {};
      ["am", "pm"].forEach((per) => {
        const idx = per === "am" ? day.info.amIdx : day.info.pmIdx;
        const slot = dayData[per] || {};
        const lateSlot = dayData[per === "am" ? "am_late" : "pm_late"] || {};
        const noteSlot = dayData[per === "am" ? "am_notes" : "pm_notes"] || {};
        const venue = getVenue(attendance, day.dateStr, per);
        const venueLabel = VENUES[venue].label;
        const isYy = venue === "yongyun";
        roster.forEach((p) => {
          const sch = p.sch[idx] === 1;
          const ac = slot[p.seq];
          const isLate = !!lateSlot[p.seq];
          const note = noteSlot[p.seq] || "";
          const fee = isYy && ac === "present" ? `$${VENUE_FEE}` : "";
          lines.push([
            day.dateStr, day.info.dayLabel,
            per === "am" ? "早訓" : "午訓",
            venueLabel,
            p.seq, p.cls, p.num, p.name,
            GRADE_NAMES[p.grade],
            sch ? "出席" : "不出席",
            ac === "present" ? "出席" : ac === "absent" ? "未到" : "未點名",
            isLate ? "是" : "",
            csvSafe(note),
            fee,
          ].join(","));
        });
      });
      // 整日備註單獨一行
      if (dayData.notes) {
        lines.push([day.dateStr, day.info.dayLabel, "整日備註", "", "", "", "", "", "", "", "", "", csvSafe(dayData.notes), ""].join(","));
      }
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `點名_${Y}年${M + 1}月_全部紀錄.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Screenshot mode: render clean view only
  if (screenshotMode) {
    return (
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
              <button onClick={exportAll}
                      className="btn-tactile w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg border-2 font-medium"
                      style={{ borderColor: "var(--accent-2)", background: "var(--accent-2)", color: "var(--bg)" }}>
                <Download size={16} strokeWidth={2.5} />
                匯出全月 CSV
              </button>
            </div>
          </div>
        </header>

        <TabBar tab={tab} setTab={setTab} isOwner={isOwner} />

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
            />
          )}
          {tab === "monthly" && (
            <MonthlyView attendance={attendance} setSelectedDate={setSelectedDate} setTab={setTab}
                         Y={Y} M={M} TRAINING_DAYS={TRAINING_DAYS} />
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
function TabBar({ tab, setTab, isOwner }) {
  const tabs = [
    { k: "rollcall", l: "點名", icon: ClipboardCheck },
    { k: "daily", l: "每日總覽", icon: ListChecks },
    { k: "monthly", l: "當月統計", icon: BarChart3 },
    { k: "manage", l: "管理", icon: Settings },
    ...(isOwner ? [{ k: "audit", l: "紀錄", icon: History }] : []),
  ];
  return (
    <div className="flex gap-1 mb-4 p-1 rounded-2xl border-2"
         style={{ borderColor: "var(--ink)", background: "var(--panel)" }}>
      {tabs.map(t => {
        const active = tab === t.k;
        const Ic = t.icon;
        return (
          <button key={t.k} onClick={() => setTab(t.k)}
                  className="btn-tactile flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm sm:text-base font-medium"
                  style={{
                    background: active ? "var(--ink)" : "transparent",
                    color: active ? "var(--bg)" : "var(--ink-2)",
                  }}>
            <Ic size={16} strokeWidth={2.5} />
            {t.l}
          </button>
        );
      })}
    </div>
  );
}

// ============ MINI CALENDAR ============
function MiniCalendar({ selectedDate, onPick, attendance }) {
  // Derive Y, M from selectedDate so calendar always shows the month being viewed
  const [viewY, setViewY] = useState(() => monthFromDate(selectedDate).Y);
  const [viewM, setViewM] = useState(() => monthFromDate(selectedDate).M);
  // Keep view in sync if selectedDate jumps to another month externally
  useEffect(() => {
    const { Y: nY, M: nM } = monthFromDate(selectedDate);
    setViewY(nY);
    setViewM(nM);
  }, [selectedDate]);

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
          // 判斷是否有任一場次為永運
          const isYongyun = !isOff && (
            getVenue(attendance, ds, "am") === "yongyun" ||
            getVenue(attendance, ds, "pm") === "yongyun"
          );
          return (
            <button key={i}
                    onClick={() => !isOff && onPick(ds)}
                    disabled={isOff}
                    className="btn-tactile relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm sm:text-base"
                    style={{
                      background: isSelected ? "var(--ink)"
                        : isOff ? "transparent"
                        : isYongyun ? VENUES.yongyun.bg
                        : "var(--panel-2)",
                      color: isSelected ? "var(--bg)"
                        : isOff ? "var(--mute)"
                        : isYongyun ? VENUES.yongyun.color
                        : "var(--ink)",
                      border: isToday && !isSelected ? "2px solid var(--accent)" : "2px solid transparent",
                      cursor: isOff ? "not-allowed" : "pointer",
                      fontWeight: isSelected ? 700 : 400,
                    }}>
              <span className="num">{c.d}</span>
              {isYongyun && !isSelected && (
                <span className="absolute top-0.5 right-0.5 text-[8px] font-bold leading-none"
                      style={{ color: VENUES.yongyun.color }}>
                  永
                </span>
              )}
              {hasData && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full"
                      style={{ background: isYongyun ? VENUES.yongyun.color : "var(--green-2)" }} />
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
  const sessionLate = attendance[selectedDate]?.[lateKey] || {};
  const sessionNotes = attendance[selectedDate]?.[notesKey] || {};
  const dayNote = attendance[selectedDate]?.notes || "";

  const rows = useMemo(() => roster.map(p => {
    const scheduled = p.sch[sessionIdx] === 1;
    const actual = sessionAtt[p.seq] || null;
    const late = !!sessionLate[p.seq];
    const note = sessionNotes[p.seq] || "";
    let status = "pending_excused";
    if (scheduled && actual === "present") status = "on_time";
    else if (scheduled && actual === "absent") status = "no_show";
    else if (!scheduled && actual === "present") status = "bonus";
    else if (!scheduled && actual === "absent") status = "confirmed_excused";
    else if (scheduled && !actual) status = "pending";
    return { ...p, scheduled, actual, status, late, note };
  }), [sessionIdx, sessionAtt, sessionLate, sessionNotes, roster]);

  const stats = useMemo(() => ({
    scheduledTotal: rows.filter(r => r.scheduled).length,
    excusedTotal: rows.filter(r => !r.scheduled).length,
    onTime: rows.filter(r => r.status === "on_time").length,
    noShow: rows.filter(r => r.status === "no_show").length,
    pending: rows.filter(r => r.status === "pending").length,
    bonus: rows.filter(r => r.status === "bonus").length,
  }), [rows]);
  const rate = stats.scheduledTotal === 0 ? 0 : Math.round(stats.onTime / stats.scheduledTotal * 100);

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
      // 切換到非 present 時順便清掉 late 標記
      const lateKey = period === "am" ? "am_late" : "pm_late";
      const lateSlot = { ...(day[lateKey] || {}) };
      if (after !== "present" && lateSlot[seq]) {
        delete lateSlot[seq];
        day[lateKey] = lateSlot;
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
          <button onClick={() => setShowCalendar(s => !s)}
                  className="btn-tactile flex items-center gap-1 text-[10px] sm:text-xs px-2.5 py-1 rounded-md border"
                  style={{
                    borderColor: showCalendar ? "var(--ink)" : "var(--line-strong)",
                    background: showCalendar ? "var(--ink)" : "transparent",
                    color: showCalendar ? "var(--bg)" : "var(--ink-2)",
                  }}>
            <CalendarDays size={12} strokeWidth={2.5} />
            {showCalendar ? "收合月曆" : "選日期"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navDate(-1)}
                  className="btn-tactile w-10 h-10 sm:w-11 sm:h-11 rounded-lg border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}
                  title="上一個訓練日">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="flex-1 text-center px-2 py-2 rounded-lg"
               style={{ background: "var(--panel-2)" }}>
            <div className="display-cn text-xl sm:text-3xl leading-tight" style={{ color: "var(--ink)" }}>
              {selectedDate.split("-").join(" / ")}
            </div>
            <div className="num text-xs sm:text-sm" style={{ color: "var(--mute)" }}>
              {dateInfo.dayLabel}
            </div>
          </div>
          <button onClick={() => navDate(1)}
                  className="btn-tactile w-10 h-10 sm:w-11 sm:h-11 rounded-lg border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}
                  title="下一個訓練日">
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
        {showCalendar && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--line)" }}>
            <MiniCalendar selectedDate={selectedDate}
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
        <div className="grid grid-cols-2 gap-2">
          {[
            { k: "am", l: "早訓", Ic: Sun },
            { k: "pm", l: "午訓", Ic: Moon },
          ].map(p => {
            const active = period === p.k;
            const Ic = p.Ic;
            const pVenue = getVenue(attendance, selectedDate, p.k);
            const pVenueObj = VENUES[pVenue];
            return (
              <button key={p.k} onClick={() => setPeriod(p.k)}
                      className="btn-tactile flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium relative"
                      style={{
                        borderColor: active ? "var(--red)" : "var(--line)",
                        background: active ? "var(--red)" : "transparent",
                        color: active ? "#fff" : "var(--ink-2)",
                      }}>
                <Ic size={16} strokeWidth={2.5} />
                {p.l}
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold ml-1"
                      style={{
                        background: active ? "rgba(255,255,255,0.25)" : pVenueObj.bg,
                        color: active ? "#fff" : pVenueObj.color,
                      }}>
                  📍{pVenueObj.short}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 場地切換 */}
      <section className="rounded-2xl p-4 sm:p-5 border-2"
               style={{
                 background: VENUES[currentVenue].bg,
                 borderColor: VENUES[currentVenue].color,
               }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="text-[10px] sm:text-xs tk-x" style={{ color: VENUES[currentVenue].color, opacity: 0.7 }}>
            VENUE · {periodLabel}場地
          </div>
          {currentVenue === "yongyun" && (
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: VENUES.yongyun.color, color: "#fff" }}>
              💰 每人 ${VENUE_FEE}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(VENUES).map(v => {
            const active = currentVenue === v.id;
            return (
              <button key={v.id} onClick={() => setVenue(v.id)} disabled={locked}
                      className="btn-tactile flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 font-medium"
                      style={{
                        borderColor: active ? v.color : "var(--line)",
                        background: active ? v.color : "var(--panel)",
                        color: active ? "#fff" : "var(--ink-2)",
                        opacity: locked ? 0.6 : 1,
                      }}>
                <span style={{ fontSize: 14 }}>📍</span>
                <span>{v.label}</span>
                {v.fee > 0 && (
                  <span className="text-[10px] px-1 rounded ml-1"
                        style={{
                          background: active ? "rgba(255,255,255,0.25)" : "rgba(168, 85, 24, 0.15)",
                          color: active ? "#fff" : v.color,
                        }}>
                    ${v.fee}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="text-[10px] mt-2 text-center" style={{ color: VENUES[currentVenue].color, opacity: 0.7 }}>
          {currentVenue === "yongyun"
            ? `本場為永運場次，出席每位隊員加收 $${VENUE_FEE}`
            : "本場為龍門泳池，無額外費用"}
        </div>
      </section>

      {/* 鎖定提示：超過 24 小時且非主管理員 */}
      {locked && (
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
        <StatCard tag="SCHEDULED" label="表定出席" value={stats.scheduledTotal} sub="人" color="var(--ink)" />
        <StatCard tag="PRESENT" label="實際出席" value={stats.onTime} sub={`／ ${stats.scheduledTotal}`} color="var(--green)" bg="var(--green-bg)" />
        <StatCard tag="ABSENT" label="缺席" value={stats.noShow} sub="人" color="var(--red)" bg="var(--red-bg)" alert={stats.noShow > 0} />
        <StatCard tag="RATE" label="出席率" value={rate} sub="%" color="var(--ink)" ring={rate} />
      </section>

      {/* 整日備註 */}
      <DayNoteSection dayNote={dayNote} setDayNote={setDayNote} locked={locked} />

      {(stats.pending > 0 || stats.bonus > 0) && (
        <div className="flex flex-wrap gap-2">
          {stats.pending > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm border"
                 style={{ background: "var(--amber-bg)", borderColor: "var(--amber)", color: "#5C4810" }}>
              <AlertTriangle size={14} strokeWidth={2.5} />
              <span className="font-medium">尚有 <span className="num">{stats.pending}</span> 位表定隊員未點名</span>
            </div>
          )}
          {stats.bonus > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm border"
                 style={{ background: "var(--blue-bg)", borderColor: "var(--blue)", color: "var(--blue)" }}>
              <Sparkles size={14} strokeWidth={2.5} />
              <span className="font-medium"><span className="num">{stats.bonus}</span> 位補訓出席</span>
            </div>
          )}
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
      </section>

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
              {g.members.map(m => <CallRow key={m.seq} m={m} mark={mark} markLate={markLate} setPersonNote={setPersonNote} />)}
            </div>
          </div>
        ))}
      </section>

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

function CallRow({ m, mark, markLate, setPersonNote }) {
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

  let actualLabel = null;
  if (m.status === "on_time") actualLabel = { t: m.late ? "✓ 出席（遲到）" : "✓ 實際出席", b: m.late ? "#E07B30" : "var(--green)", f: "#fff" };
  else if (m.status === "no_show") actualLabel = { t: "✗ 未到", b: "var(--red)", f: "#fff" };
  else if (m.status === "bonus") actualLabel = { t: m.late ? "+ 補訓（遲到）" : "+ 補訓出席", b: m.late ? "#E07B30" : "var(--blue)", f: "#fff" };
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
      </div>

      {/* 遲到標記（出席時才顯示） */}
      {isPresent && (
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
          {!showNote && (
            <button onClick={() => setShowNote(true)}
                    className="btn-tactile text-[11px] sm:text-xs px-2 py-1 rounded"
                    style={{ color: "var(--mute)", border: "1px dashed var(--line-strong)" }}>
              + 加備註
            </button>
          )}
        </div>
      )}

      {/* 對「未到 / 未點名」也允許加備註 */}
      {!isPresent && !showNote && m.status !== "pending_excused" && (
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
                     Y, M, MONTH_DAYS, TRAINING_DAYS }) {
  const { roster } = useRoster();
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
    const amSch = p.sch[dateInfo.amIdx] === 1;
    const pmSch = p.sch[dateInfo.pmIdx] === 1;
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
            <button onClick={() => setShowCalendar(s => !s)}
                    className="btn-tactile flex items-center gap-1 text-[10px] sm:text-xs px-2.5 py-1 rounded-md border"
                    style={{
                      borderColor: showCalendar ? "var(--ink)" : "var(--line-strong)",
                      background: showCalendar ? "var(--ink)" : "transparent",
                      color: showCalendar ? "var(--bg)" : "var(--ink-2)",
                    }}>
              <CalendarDays size={12} strokeWidth={2.5} />
              {showCalendar ? "收合" : "選日期"}
            </button>
            <button onClick={exportDay}
                    className="btn-tactile flex items-center gap-1 text-[10px] sm:text-xs px-2.5 py-1 rounded-md border"
                    style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
              <Download size={12} strokeWidth={2.5} />
              匯出當日
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navDate(-1)}
                  className="btn-tactile w-10 h-10 sm:w-11 sm:h-11 rounded-lg border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="flex-1 text-center px-2 py-2 rounded-lg" style={{ background: "var(--panel-2)" }}>
            <div className="display-cn text-xl sm:text-3xl leading-tight" style={{ color: "var(--ink)" }}>
              {selectedDate.split("-").join(" / ")}
            </div>
            <div className="num text-xs sm:text-sm" style={{ color: "var(--mute)" }}>
              {dateInfo.dayLabel}
            </div>
          </div>
          <button onClick={() => navDate(1)}
                  className="btn-tactile w-10 h-10 sm:w-11 sm:h-11 rounded-lg border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
        {showCalendar && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--line)" }}>
            <MiniCalendar selectedDate={selectedDate}
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
  return (
    <button onClick={onClick}
            className="btn-tactile rounded-2xl p-4 sm:p-5 border-2 text-left"
            style={{ background: "var(--panel)", borderColor: "var(--line-strong)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Ic size={18} strokeWidth={2.5} style={{ color: "var(--ink-2)" }} />
          <span className="display-cn text-lg" style={{ color: "var(--ink)" }}>{label}</span>
          {venueObj && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: venueObj.bg, color: venueObj.color }}>
              📍{venueObj.label}
              {venueObj.fee > 0 && <span className="ml-1">${venueObj.fee}</span>}
            </span>
          )}
        </div>
        <span className="text-[10px] tk-l" style={{ color: "var(--mute)" }}>點此前往點名 →</span>
      </div>
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
  const dim = allExcused ? 0.55 : 1;
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
function MonthlyView({ attendance, setSelectedDate, setTab, Y, M, TRAINING_DAYS }) {
  const { roster } = useRoster();
  const personStats = useMemo(() => roster.map(p => {
    let scheduled = 0, present = 0, absent = 0, bonus = 0, pending = 0, late = 0;
    let yyAm = 0, yyPm = 0; // 永運場次出席（早/午）
    const matrix = TRAINING_DAYS.map(day => {
      const dayData = attendance[day.dateStr] || {};
      const amVenue = getVenue(attendance, day.dateStr, "am");
      const pmVenue = getVenue(attendance, day.dateStr, "pm");
      const am = (() => {
        const sch = p.sch[day.info.amIdx] === 1;
        const ac = dayData.am?.[p.seq];
        const isLate = !!dayData.am_late?.[p.seq];
        if (sch) scheduled++;
        if (sch && ac === "present") {
          present++; if (isLate) late++;
          if (amVenue === "yongyun") yyAm++;
          return "on_time";
        }
        if (sch && ac === "absent") { absent++; return "no_show"; }
        if (sch && !ac) { pending++; return "pending"; }
        if (!sch && ac === "present") {
          bonus++; if (isLate) late++;
          if (amVenue === "yongyun") yyAm++;
          return "bonus";
        }
        if (!sch && ac === "absent") return "confirmed_excused";
        return "off";
      })();
      const pm = (() => {
        const sch = p.sch[day.info.pmIdx] === 1;
        const ac = dayData.pm?.[p.seq];
        const isLate = !!dayData.pm_late?.[p.seq];
        if (sch) scheduled++;
        if (sch && ac === "present") {
          present++; if (isLate) late++;
          if (pmVenue === "yongyun") yyPm++;
          return "on_time";
        }
        if (sch && ac === "absent") { absent++; return "no_show"; }
        if (sch && !ac) { pending++; return "pending"; }
        if (!sch && ac === "present") {
          bonus++; if (isLate) late++;
          if (pmVenue === "yongyun") yyPm++;
          return "bonus";
        }
        if (!sch && ac === "absent") return "confirmed_excused";
        return "off";
      })();
      return { day, am, pm };
    });
    const rate = scheduled === 0 ? 0 : present / scheduled;
    const yyTotal = yyAm + yyPm;
    const yyFee = yyTotal * VENUE_FEE;
    return { ...p, scheduled, present, absent, bonus, pending, late, rate, matrix, yyAm, yyPm, yyTotal, yyFee };
  }), [attendance, roster, TRAINING_DAYS]);

  // 永運場次統計（共幾次永運訓練、總費用）
  const yyStats = useMemo(() => {
    let yyAmSessions = 0, yyPmSessions = 0;
    TRAINING_DAYS.forEach(day => {
      if (getVenue(attendance, day.dateStr, "am") === "yongyun") yyAmSessions++;
      if (getVenue(attendance, day.dateStr, "pm") === "yongyun") yyPmSessions++;
    });
    const totalFee = personStats.reduce((acc, s) => acc + s.yyFee, 0);
    const totalAttendees = personStats.reduce((acc, s) => acc + s.yyTotal, 0);
    const paidPeople = personStats.filter(s => s.yyTotal > 0).length;
    return { yyAmSessions, yyPmSessions, totalFee, totalAttendees, paidPeople };
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
          <div>
            <div className="text-[10px] sm:text-xs tk-x" style={{ color: "rgba(255,252,246,0.6)" }}>
              MONTHLY OVERVIEW
            </div>
            <div className="display text-4xl sm:text-6xl mt-1">
              {MONTH_NAMES_EN[M]} <span style={{ color: "var(--accent)" }}>{Y}</span>
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

function YongyunFeeSection({ Y, M, yyStats, personStats, TRAINING_DAYS, attendance }) {
  const [expanded, setExpanded] = useState(false);
  const paidList = useMemo(() =>
    [...personStats].filter(s => s.yyTotal > 0).sort((a, b) => b.yyFee - a.yyFee || a.seq - b.seq),
    [personStats]);

  const exportFee = () => {
    const csvSafe = (s) => `"${(s || "").replace(/"/g, '""')}"`;
    const lines = [
      [`${Y} 年 ${M + 1} 月 永運費用統計`].join(","),
      [`本月永運場次：早訓 ${yyStats.yyAmSessions} 場 + 午訓 ${yyStats.yyPmSessions} 場 = 共 ${yyStats.yyAmSessions + yyStats.yyPmSessions} 場`].join(","),
      [`每場次費用：$${VENUE_FEE} / 人`].join(","),
      "",
      ["序號", "班級", "座號", "姓名", "年級", "早訓出席次數", "午訓出席次數", "永運總出席", "應收費用"].join(","),
    ];
    paidList.forEach(s => {
      lines.push([
        s.seq, s.cls, s.num, s.name, GRADE_NAMES[s.grade],
        s.yyAm, s.yyPm, s.yyTotal, `$${s.yyFee}`,
      ].join(","));
    });
    lines.push("");
    lines.push([`應收人數：${yyStats.paidPeople} 人`].join(","));
    lines.push([`總人次：${yyStats.totalAttendees} 人次`].join(","));
    lines.push([`總費用：$${yyStats.totalFee}`].join(","));
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `永運費用_${Y}年${M + 1}月.csv`; a.click();
    URL.revokeObjectURL(url);
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
            {yyStats.paidPeople} 人 · {yyStats.totalAttendees} 人次 ·
            早訓 {yyStats.yyAmSessions} 場 + 午訓 {yyStats.yyPmSessions} 場
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setExpanded(e => !e)}
                  className="btn-tactile flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border-2"
                  style={{ borderColor: VENUES.yongyun.color, color: VENUES.yongyun.color, background: "rgba(255,255,255,0.5)" }}>
            <span>{expanded ? "▾" : "▸"}</span>
            {expanded ? "收起明細" : "展開明細"}
          </button>
          <button onClick={exportFee}
                  className="btn-tactile flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium"
                  style={{ background: VENUES.yongyun.color, color: "#fff" }}>
            <Download size={12} strokeWidth={2.5} />
            匯出 CSV
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ background: "rgba(255,255,255,0.6)", borderTop: `1px solid ${VENUES.yongyun.color}` }}>
          {paidList.length === 0 ? (
            <div className="p-4 text-center text-sm" style={{ color: VENUES.yongyun.color }}>
              尚無人出席永運場次
            </div>
          ) : (
            <>
              <div className="grid items-center gap-2 px-3 sm:px-4 py-2 text-[10px] tk-l"
                   style={{ background: VENUES.yongyun.color, color: "#fff",
                            gridTemplateColumns: "32px 1fr 50px 50px 60px 70px" }}>
                <span>序號</span>
                <span>姓名</span>
                <span className="text-center">早</span>
                <span className="text-center">午</span>
                <span className="text-center">總次</span>
                <span className="text-right">費用</span>
              </div>
              {paidList.map(s => (
                <div key={s.seq} className="grid items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm"
                     style={{
                       gridTemplateColumns: "32px 1fr 50px 50px 60px 70px",
                       borderBottom: "1px solid rgba(168, 85, 24, 0.15)",
                     }}>
                  <span className="num text-[11px]" style={{ color: VENUES.yongyun.color, opacity: 0.7 }}>
                    {pad(s.seq)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium truncate" style={{ color: "var(--ink)" }}>{s.name}</div>
                    <div className="num text-[10px]" style={{ color: VENUES.yongyun.color, opacity: 0.7 }}>
                      {s.cls}-{pad(s.num)}
                    </div>
                  </div>
                  <span className="num text-center" style={{ color: "var(--ink-2)" }}>{s.yyAm}</span>
                  <span className="num text-center" style={{ color: "var(--ink-2)" }}>{s.yyPm}</span>
                  <span className="num text-center font-bold" style={{ color: VENUES.yongyun.color }}>
                    {s.yyTotal}
                  </span>
                  <span className="num text-right font-bold" style={{ color: VENUES.yongyun.color }}>
                    ${s.yyFee}
                  </span>
                </div>
              ))}
              <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex justify-between"
                   style={{ background: VENUES.yongyun.color, color: "#fff" }}>
                <span>合計</span>
                <span>{yyStats.paidPeople} 人 · {yyStats.totalAttendees} 人次 · ${yyStats.totalFee}</span>
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
  const dateInfo = getDateInfo(selectedDate);
  const amAtt = attendance[selectedDate]?.am || {};
  const pmAtt = attendance[selectedDate]?.pm || {};
  const amLate = attendance[selectedDate]?.am_late || {};
  const pmLate = attendance[selectedDate]?.pm_late || {};
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
    const amSch = p.sch[dateInfo.amIdx] === 1;
    const pmSch = p.sch[dateInfo.pmIdx] === 1;
    return {
      ...p, amSch, pmSch,
      amStatus: computeStatus(amSch, amAtt[p.seq]),
      pmStatus: computeStatus(pmSch, pmAtt[p.seq]),
      amLate: !!amLate[p.seq],
      pmLate: !!pmLate[p.seq],
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
  const notedRows = rows.filter(r => r.amNote || r.pmNote);

  // Tiny status chip - 4 distinct outcomes (+ late variant)
  const Tiny = ({ status, late }) => {
    const map = {
      // 表定+到 = 正常出席 (深綠實心)
      on_time:           { t: "✓", bg: "#1F5C3A", fg: "#fff", bd: "transparent" },
      // 表定+缺 = 缺席 (鮮紅 + 邊框，最醒目)
      no_show:           { t: "✗", bg: "#B23A28", fg: "#fff", bd: "#7A1F0F" },
      // 表定+未點 (亮黃)
      pending:           { t: "?", bg: "#F6C53C", fg: "#3D2F00", bd: "transparent" },
      // 不表定+到 = 補訓 (鮮藍實心)
      bonus:             { t: "+", bg: "#2F4FA8", fg: "#fff", bd: "transparent" },
      // 不表定+缺 = 已請假 (淺灰，幾乎隱形)
      confirmed_excused: { t: "—", bg: "#EAE3D4", fg: "#8B8275", bd: "transparent" },
      // 不表定+未點 = 無訓練 (淺灰)
      pending_excused:   { t: "—", bg: "#EAE3D4", fg: "#B7AC93", bd: "transparent" },
    };
    let s = map[status] || map.pending_excused;
    // 遲到時：橘色背景，符號改鐘
    if (late && (status === "on_time" || status === "bonus")) {
      s = { t: "🕐", bg: "#E07B30", fg: "#fff", bd: "#A85518" };
    }
    return (
      <span style={{
        display: "inline-block", width: 16, height: 16,
        background: s.bg, color: s.fg, borderRadius: 3,
        border: `1px solid ${s.bd}`,
        fontSize: late ? 9 : 11, fontWeight: 900, textAlign: "center",
        lineHeight: late ? "13px" : "14px",
        fontFamily: "system-ui, sans-serif",
        boxSizing: "border-box",
      }}>{s.t}</span>
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
        padding: "3px 6px",
        borderBottom: "1px solid #EAE3D4",
        opacity: allExcused ? 0.5 : 1,
        background: rowBg,
        // 遲到時用左邊橘條
        boxShadow: hasLate && !hasNoShow ? "inset 3px 0 0 #E07B30" : "none",
      }}>
        <span style={{ background: gradeBar(m.grade), height: 10, borderRadius: 1 }} />
        <span className="num" style={{ fontSize: 9, color: "#8B8275" }}>{pad(m.seq)}</span>
        <span style={{
          fontSize: 12, fontWeight: hasNoShow ? 700 : 500,
          color: hasNoShow ? "#7A1F0F" : "#141210",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {m.name}
          {hasNote && (
            <span style={{ marginLeft: 3, fontSize: 9 }} title="有備註">📝</span>
          )}
        </span>
        <Tiny status={m.amStatus} late={m.amLate} />
        <Tiny status={m.pmStatus} late={m.pmLate} />
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Floating controls (won't be in screenshot if cropped) */}
      <div className="sticky top-2 z-50 flex justify-end px-3 py-2"
           style={{ pointerEvents: "none" }}>
        <div className="flex gap-2" style={{ pointerEvents: "auto" }}>
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
          <button onClick={onExit}
                  className="btn-tactile flex items-center gap-1 px-3 h-8 rounded-full border-2 text-xs font-medium shadow-md"
                  style={{ background: "#1A3D4D", borderColor: "#1A3D4D", color: "#F2EDE2" }}>
            <X size={12} strokeWidth={2.5} />
            結束
          </button>
        </div>
      </div>

      {/* Compact card */}
      <div className="px-2 pb-4" style={{ marginTop: -32 }}>
        <div className="mx-auto rounded-xl border-2 overflow-hidden"
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
                  <div className="display-cn" style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.1 }}>
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
            background: "#F8F3E8", padding: "6px 12px",
            borderBottom: "1px solid #DDD3BF",
            fontSize: 11, display: "flex", justifyContent: "space-around",
            flexWrap: "wrap", gap: 8,
          }}>
            <div className="flex items-center gap-1">
              <Sun size={12} strokeWidth={2.5} style={{ color: "#2E2820" }} />
              <span style={{ color: "#2E2820" }}>早</span>
              <span className="num" style={{ color: "#1F5C3A", fontWeight: 700 }}>{amS.on}</span>
              <span className="num" style={{ color: "#8B8275" }}>／{amS.sch}</span>
              {amS.no > 0 && (
                <span className="num" style={{ color: "#B23A28", fontWeight: 700 }}>缺{amS.no}</span>
              )}
              {amS.late > 0 && (
                <span className="num" style={{ color: "#E07B30", fontWeight: 700 }}>遲{amS.late}</span>
              )}
              {amS.pn > 0 && (
                <span className="num" style={{ color: "#B8860B", fontWeight: 700 }}>待{amS.pn}</span>
              )}
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "0 3px", borderRadius: 2,
                background: VENUES[amVenue].bg, color: VENUES[amVenue].color, marginLeft: 2,
              }}>📍{VENUES[amVenue].label}</span>
            </div>
            <div className="flex items-center gap-1">
              <Moon size={12} strokeWidth={2.5} style={{ color: "#2E2820" }} />
              <span style={{ color: "#2E2820" }}>午</span>
              <span className="num" style={{ color: "#1F5C3A", fontWeight: 700 }}>{pmS.on}</span>
              <span className="num" style={{ color: "#8B8275" }}>／{pmS.sch}</span>
              {pmS.no > 0 && (
                <span className="num" style={{ color: "#B23A28", fontWeight: 700 }}>缺{pmS.no}</span>
              )}
              {pmS.late > 0 && (
                <span className="num" style={{ color: "#E07B30", fontWeight: 700 }}>遲{pmS.late}</span>
              )}
              {pmS.pn > 0 && (
                <span className="num" style={{ color: "#B8860B", fontWeight: 700 }}>待{pmS.pn}</span>
              )}
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "0 3px", borderRadius: 2,
                background: VENUES[pmVenue].bg, color: VENUES[pmVenue].color, marginLeft: 2,
              }}>📍{VENUES[pmVenue].label}</span>
            </div>
          </div>

          {/* 永運費用提示橫條（有任一場永運時顯示） */}
          {hasYongyun && (
            <div style={{
              background: VENUES.yongyun.bg, padding: "4px 12px",
              borderBottom: "1px solid #DDD3BF",
              fontSize: 10, color: VENUES.yongyun.color, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <span>💰</span>
              <span>本日永運場次：</span>
              {amVenue === "yongyun" && <span>早訓 {amS.on + amS.bn} 人</span>}
              {amVenue === "yongyun" && pmVenue === "yongyun" && <span style={{ color: "#8B8275" }}>·</span>}
              {pmVenue === "yongyun" && <span>午訓 {pmS.on + pmS.bn} 人</span>}
              <span style={{ marginLeft: "auto" }}>
                每人 ${VENUE_FEE}
              </span>
            </div>
          )}

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

          {/* Pending warning - 待點名提醒 */}
          {pendingees.length > 0 && (
            <div style={{
              background: "#F6C53C", padding: "5px 12px",
              borderBottom: "2px solid #D9A82C",
              fontSize: 10, color: "#3D2F00", fontWeight: 700,
              lineHeight: 1.4,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 12 }}>⚠</span>
              <span style={{ letterSpacing: "0.05em" }}>
                尚有 <span className="num" style={{ fontSize: 12 }}>{pendingees.length}</span> 位未點名：
              </span>
              <span style={{ fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {pendingees.map(r => r.name).join("、")}
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
            fontSize: 9, letterSpacing: "0.1em",
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
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setError(null);
      } else {
        setError(err.message || "登入失敗");
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
              {error}
            </div>
          )}

          <p className="text-[11px] text-center mt-4 leading-relaxed"
             style={{ color: "var(--mute)" }}>
            僅限龍門國中泳隊教練 / 老師使用<br />
            登入後即可雲端同步點名紀錄
          </p>
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

      {/* Admin section */}
      <AdminListSection user={user} config={config} setConfig={setConfig}
                         isOwner={isOwner} logAction={logAction} />

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
          <button onClick={() => setAdding(true)}
                  className="btn-tactile flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 font-medium"
                  style={{ borderColor: "var(--accent)", background: "var(--accent)", color: "#fff" }}>
            <Plus size={16} strokeWidth={2.5} />
            新增隊員
          </button>
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
               style={{ background: "var(--amber-bg)", borderColor: "var(--amber)" }}>
        <div className="flex items-start gap-3">
          <Eye size={18} strokeWidth={2.5} style={{ color: "#5C4810", marginTop: 2 }} />
          <div className="flex-1">
            <div className="font-medium text-sm mb-1" style={{ color: "#5C4810" }}>唯讀模式</div>
            <p className="text-xs leading-relaxed" style={{ color: "#5C4810" }}>
              你目前不是管理員，僅能查看名單。如需修改隊員資料或課表，請聯絡管理員新增你：
            </p>
            {ownerEmail && (
              <div className="mt-2 flex items-center gap-1.5">
                <Crown size={11} strokeWidth={2.5} style={{ color: "#F6C53C" }} />
                <span className="text-[10px]" style={{ color: "#5C4810" }}>主管理員</span>
                <span className="num text-[11px] px-2 py-0.5 rounded font-medium"
                      style={{ background: "#5C4810", color: "#F6EAC4" }}>
                  {ownerEmail}
                </span>
              </div>
            )}
            {adminEmails.filter(e => e.toLowerCase() !== (ownerEmail || "").toLowerCase()).length > 0 && (
              <div className="mt-2">
                <div className="text-[10px] mb-1" style={{ color: "#5C4810" }}>一般管理員</div>
                <div className="flex flex-wrap gap-1.5">
                  {adminEmails.filter(e => e.toLowerCase() !== (ownerEmail || "").toLowerCase()).map(e => (
                    <span key={e} className="num text-[11px] px-2 py-0.5 rounded font-medium"
                          style={{ background: "#5C4810", color: "#F6EAC4" }}>
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-2 text-[11px]" style={{ color: "#5C4810", opacity: 0.7 }}>
              你的 Email：<span className="num font-medium">{userEmail}</span>
            </div>
          </div>
        </div>
      </section>

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

function AdminListSection({ user, config, setConfig, isOwner, logAction }) {
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const admins = config.admins || [];
  const ownerEmail = (config.owner || "").toLowerCase();
  const userEmail = (user.email || "").toLowerCase();

  const addAdmin = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) return;
    if (admins.map(a => a.toLowerCase()).includes(trimmed)) {
      setNewEmail("");
      setAdding(false);
      return;
    }
    setConfig({ ...config, admins: [...admins, trimmed] });
    if (logAction) {
      logAction("add_admin", {
        target: trimmed,
        targetLabel: `新增管理員 - ${trimmed}`,
      });
    }
    setNewEmail("");
    setAdding(false);
  };

  const removeAdmin = (email) => {
    if (admins.length <= 1) return;
    // 不能移除主管理員（owner）
    if (email.toLowerCase() === ownerEmail) return;
    setConfig({ ...config, admins: admins.filter(a => a !== email) });
    if (logAction) {
      logAction("remove_admin", {
        target: email,
        targetLabel: `移除管理員 - ${email}`,
      });
    }
    setConfirmRemove(null);
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
        <div className="mb-3 rounded-lg p-3" style={{ background: "var(--panel)", border: "2px solid var(--accent-2)" }}>
          <div className="text-[11px] tk-l mb-1" style={{ color: "var(--mute)" }}>新管理員 Email</div>
          <div className="flex gap-2">
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                   onKeyDown={e => e.key === "Enter" && addAdmin()}
                   placeholder="example@gmail.com"
                   className="flex-1 px-3 py-2 rounded-md border-2 text-sm num"
                   style={{ borderColor: "var(--line)" }}
                   autoFocus />
            <button onClick={() => { setAdding(false); setNewEmail(""); }}
                    className="btn-tactile px-3 py-2 rounded-md border text-xs"
                    style={{ borderColor: "var(--line-strong)", color: "var(--ink-2)" }}>
              取消
            </button>
            <button onClick={addAdmin}
                    className="btn-tactile px-3 py-2 rounded-md border-2 text-xs font-medium"
                    style={{ borderColor: "var(--accent-2)", background: "var(--accent-2)", color: "#fff" }}>
              加入
            </button>
          </div>
          <div className="text-[10px] mt-2 leading-relaxed" style={{ color: "var(--mute)" }}>
            必須是對方用來登入的 Google 帳號 Email，他下次刷新頁面就會獲得管理權限。
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {admins.map(email => {
          const isMe = email.toLowerCase() === userEmail;
          const isOwnerEntry = email.toLowerCase() === ownerEmail;
          const canRemove = admins.length > 1 && !isOwnerEntry;
          return (
            <div key={email} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                 style={{
                   background: "var(--panel)",
                   border: isOwnerEntry ? "2px solid var(--accent-2)" : "1px solid var(--accent)",
                 }}>
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
