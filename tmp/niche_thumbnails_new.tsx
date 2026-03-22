// ── Niche detailed thumbnails (light colorful redesign 22.03.2026) ────────
const NICHE_THUMBNAILS: Record<string, React.ReactNode> = {
  food: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#fff7ed"/>
      <rect x="0" y="0" width="140" height="13" fill="#fed7aa"/>
      <circle cx="10" cy="6.5" r="4" fill="#c2410c"/>
      <rect x="20" y="5" width="22" height="4" rx="2" fill="#ea580c" opacity=".5"/>
      <rect x="100" y="4" width="18" height="6" rx="3" fill="#ea580c"/>
      <ellipse cx="70" cy="35" rx="24" ry="7" fill="#fed7aa"/>
      <ellipse cx="65" cy="30" rx="8" ry="6" fill="#dc2626"/>
      <ellipse cx="76" cy="31" rx="7" ry="5" fill="#16a34a"/>
      <ellipse cx="70" cy="28" rx="6" ry="4" fill="#ea580c"/>
      <path d="M54 22 Q56 18 54 15" stroke="#c2410c" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".6"/>
      <path d="M70 20 Q72 16 70 13" stroke="#c2410c" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".6"/>
      <path d="M86 22 Q88 18 86 15" stroke="#c2410c" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".6"/>
      <rect x="38" y="52" width="64" height="6" rx="2" fill="#7c2d12" opacity=".8"/>
      <rect x="46" y="61" width="48" height="3" rx="1.5" fill="#c2410c" opacity=".4"/>
      <rect x="10" y="68" width="36" height="14" rx="3" fill="#fed7aa"/>
      <rect x="12" y="72" width="24" height="3" rx="1" fill="#ea580c"/>
      <rect x="52" y="68" width="36" height="14" rx="3" fill="#fed7aa"/>
      <rect x="54" y="72" width="20" height="3" rx="1" fill="#f97316" opacity=".7"/>
      <rect x="94" y="68" width="36" height="14" rx="3" fill="#fed7aa"/>
      <rect x="96" y="72" width="22" height="3" rx="1" fill="#f97316" opacity=".7"/>
    </svg>
  ),
  shop: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#f5f3ff"/>
      <rect x="0" y="0" width="140" height="13" fill="#ddd6fe"/>
      <circle cx="10" cy="6.5" r="4" fill="#6d28d9"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#7c3aed" opacity=".5"/>
      <rect x="108" y="3" width="24" height="7" rx="3.5" fill="#7c3aed"/>
      <rect x="18" y="16" width="104" height="56" rx="3" fill="#ede9fe"/>
      <rect x="18" y="16" width="104" height="14" rx="3" fill="#ddd6fe"/>
      <rect x="18" y="16" width="26" height="14" fill="#8b5cf6" opacity=".5"/>
      <rect x="44" y="16" width="26" height="14" fill="#7c3aed" opacity=".35"/>
      <rect x="70" y="16" width="26" height="14" fill="#8b5cf6" opacity=".5"/>
      <rect x="96" y="16" width="26" height="14" fill="#7c3aed" opacity=".35"/>
      <rect x="38" y="19" width="64" height="7" rx="2" fill="#ede9fe" opacity=".8"/>
      <rect x="48" y="21" width="44" height="3" rx="1" fill="#6d28d9" opacity=".7"/>
      <rect x="22" y="34" width="30" height="22" rx="2" fill="#f5f3ff"/>
      <rect x="88" y="34" width="30" height="22" rx="2" fill="#f5f3ff"/>
      <rect x="26" y="37" width="8" height="12" rx="1" fill="#f59e0b" opacity=".8"/>
      <rect x="36" y="39" width="7" height="10" rx="1" fill="#ec4899" opacity=".8"/>
      <rect x="92" y="36" width="7" height="14" rx="1" fill="#22c55e" opacity=".8"/>
      <rect x="101" y="38" width="8" height="12" rx="1" fill="#3b82f6" opacity=".8"/>
      <rect x="57" y="34" width="26" height="28" rx="2" fill="#f5f3ff"/>
      <circle cx="80" cy="48" r="1.5" fill="#9333ea" opacity=".5"/>
      <rect x="18" y="72" width="104" height="8" fill="#ede9fe"/>
      <rect x="24" y="75" width="10" height="3" rx="1" fill="#7c3aed" opacity=".5"/>
    </svg>
  ),
  ecommerce: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#f0f9ff"/>
      <rect x="0" y="0" width="140" height="13" fill="#bae6fd"/>
      <circle cx="10" cy="6.5" r="4" fill="#0369a1"/>
      <rect x="20" y="4" width="20" height="4" rx="2" fill="#0284c7" opacity=".5"/>
      <rect x="30" y="3.5" width="50" height="6" rx="3" fill="#e0f2fe"/>
      <circle cx="36" cy="6.5" r="2" fill="#7dd3fc"/>
      <rect x="118" y="3" width="14" height="8" rx="4" fill="#0369a1"/>
      <rect x="121" y="5.5" width="5" height="3" rx="1" fill="white" opacity=".8"/>
      <rect x="8" y="18" width="37" height="28" rx="3" fill="#e0f2fe"/>
      <rect x="8" y="18" width="37" height="18" rx="3" fill="#fca5a5"/>
      <rect x="12" y="40" width="20" height="2.5" rx="1" fill="#0369a1" opacity=".7"/>
      <rect x="12" y="44" width="14" height="2" rx="1" fill="#0284c7" opacity=".5"/>
      <rect x="52" y="18" width="37" height="28" rx="3" fill="#e0f2fe"/>
      <rect x="52" y="18" width="37" height="18" rx="3" fill="#c4b5fd"/>
      <rect x="56" y="40" width="20" height="2.5" rx="1" fill="#0369a1" opacity=".7"/>
      <rect x="56" y="44" width="14" height="2" rx="1" fill="#0284c7" opacity=".5"/>
      <rect x="96" y="18" width="37" height="28" rx="3" fill="#e0f2fe"/>
      <rect x="96" y="18" width="37" height="18" rx="3" fill="#86efac"/>
      <rect x="100" y="40" width="20" height="2.5" rx="1" fill="#0369a1" opacity=".7"/>
      <rect x="100" y="44" width="14" height="2" rx="1" fill="#0284c7" opacity=".5"/>
      <rect x="8" y="50" width="37" height="28" rx="3" fill="#e0f2fe"/>
      <rect x="8" y="50" width="37" height="18" rx="3" fill="#fde68a"/>
      <rect x="52" y="50" width="37" height="28" rx="3" fill="#e0f2fe"/>
      <rect x="52" y="50" width="37" height="18" rx="3" fill="#fca5a5" opacity=".7"/>
      <rect x="96" y="50" width="37" height="28" rx="3" fill="#e0f2fe"/>
      <rect x="96" y="50" width="37" height="18" rx="3" fill="#7dd3fc"/>
    </svg>
  ),
  startup: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#f7fee7"/>
      <rect x="0" y="0" width="140" height="13" fill="#d9f99d"/>
      <circle cx="10" cy="6.5" r="4" fill="#3f6212"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#4d7c0f" opacity=".6"/>
      <rect x="108" y="3" width="24" height="7" rx="3" fill="#4d7c0f"/>
      <rect x="20" y="18" width="84" height="8" rx="2" fill="#3f6212" opacity=".85"/>
      <rect x="20" y="29" width="65" height="5" rx="1.5" fill="#65a30d"/>
      <rect x="20" y="37" width="50" height="5" rx="1.5" fill="#84cc16" opacity=".7"/>
      <rect x="20" y="46" width="32" height="10" rx="5" fill="#4d7c0f"/>
      <rect x="57" y="46" width="32" height="10" rx="5" fill="none" stroke="#65a30d" strokeWidth="1.5"/>
      <path d="M116 40 L121 22 L126 40 Z" fill="#65a30d"/>
      <rect x="118" y="37" width="6" height="16" rx="2" fill="#3f6212"/>
      <ellipse cx="121" cy="55" rx="4" ry="6" fill="#a3e635" opacity=".9"/>
      <ellipse cx="121" cy="55" rx="2.5" ry="4" fill="#ecfccb"/>
      <circle cx="110" cy="20" r="2.5" fill="#84cc16" opacity=".7"/>
      <circle cx="130" cy="32" r="2" fill="#a3e635" opacity=".6"/>
      <circle cx="104" cy="35" r="1.5" fill="#65a30d" opacity=".5"/>
      <rect x="8" y="62" width="28" height="18" rx="3" fill="#ecfccb"/>
      <rect x="10" y="65" width="14" height="6" rx="1" fill="#84cc16"/>
      <rect x="10" y="74" width="20" height="2.5" rx="1" fill="#4d7c0f" opacity=".5"/>
      <rect x="42" y="62" width="28" height="18" rx="3" fill="#ecfccb"/>
      <rect x="44" y="65" width="14" height="6" rx="1" fill="#65a30d"/>
      <rect x="44" y="74" width="20" height="2.5" rx="1" fill="#4d7c0f" opacity=".5"/>
      <rect x="76" y="62" width="28" height="18" rx="3" fill="#ecfccb"/>
      <rect x="78" y="65" width="14" height="6" rx="1" fill="#4d7c0f"/>
      <rect x="78" y="74" width="20" height="2.5" rx="1" fill="#4d7c0f" opacity=".5"/>
    </svg>
  ),
  portfolio: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#fffbeb"/>
      <rect x="0" y="0" width="140" height="13" fill="#fde68a"/>
      <circle cx="10" cy="6.5" r="4" fill="#92400e"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#b45309" opacity=".5"/>
      <rect x="8" y="16" width="78" height="50" rx="4" fill="#fef3c7"/>
      <circle cx="28" cy="36" r="14" fill="#f59e0b" opacity=".35"/>
      <circle cx="50" cy="40" r="12" fill="#f97316" opacity=".3"/>
      <circle cx="42" cy="24" r="10" fill="#dc2626" opacity=".25"/>
      <path d="M14 48 Q28 36 42 44 Q56 52 70 40" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="10" y="57" width="40" height="3" rx="1.5" fill="#92400e" opacity=".6"/>
      <rect x="10" y="62" width="28" height="2" rx="1" fill="#b45309" opacity=".4"/>
      <rect x="92" y="16" width="40" height="22" rx="3" fill="#fef3c7"/>
      <ellipse cx="112" cy="27" rx="12" ry="8" fill="#f59e0b" opacity=".5"/>
      <rect x="92" y="42" width="40" height="22" rx="3" fill="#fef3c7"/>
      <ellipse cx="112" cy="53" rx="12" ry="8" fill="#f97316" opacity=".4"/>
      <rect x="8" y="70" width="24" height="12" rx="2" fill="#fde68a"/>
      <rect x="36" y="70" width="24" height="12" rx="2" fill="#fde68a"/>
      <rect x="64" y="70" width="24" height="12" rx="2" fill="#fde68a"/>
      <rect x="92" y="70" width="24" height="12" rx="2" fill="#fde68a"/>
      <rect x="120" y="70" width="12" height="12" rx="2" fill="#f59e0b"/>
    </svg>
  ),
  beauty: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#fdf2f8"/>
      <rect x="0" y="0" width="140" height="13" fill="#fbcfe8"/>
      <circle cx="10" cy="6.5" r="4" fill="#be185d"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#db2777" opacity=".5"/>
      <rect x="0" y="13" width="70" height="40" fill="#fce7f3"/>
      <ellipse cx="35" cy="20" rx="8" ry="8" fill="#f9a8d4" opacity=".9"/>
      <rect x="27" y="28" width="16" height="22" rx="4" fill="#fbcfe8"/>
      <line x1="55" y1="15" x2="55" y2="21" stroke="#be185d" strokeWidth="1.5" opacity=".7"/>
      <line x1="52" y1="18" x2="58" y2="18" stroke="#be185d" strokeWidth="1.5" opacity=".7"/>
      <line x1="12" y1="16" x2="12" y2="22" stroke="#ec4899" strokeWidth="1.5" opacity=".6"/>
      <line x1="9" y1="19" x2="15" y2="19" stroke="#ec4899" strokeWidth="1.5" opacity=".6"/>
      <rect x="76" y="16" width="50" height="6" rx="2" fill="#831843" opacity=".7"/>
      <rect x="76" y="25" width="40" height="3" rx="1.5" fill="#be185d" opacity=".5"/>
      <rect x="76" y="31" width="44" height="3" rx="1.5" fill="#db2777" opacity=".35"/>
      <rect x="76" y="37" width="36" height="3" rx="1.5" fill="#db2777" opacity=".25"/>
      <rect x="76" y="44" width="28" height="7" rx="3.5" fill="#be185d"/>
      <rect x="8" y="57" width="28" height="24" rx="3" fill="#fce7f3"/>
      <rect x="8" y="57" width="28" height="14" rx="3" fill="#f9a8d4"/>
      <rect x="10" y="74" width="16" height="2.5" rx="1" fill="#be185d" opacity=".5"/>
      <rect x="42" y="57" width="28" height="24" rx="3" fill="#fce7f3"/>
      <rect x="42" y="57" width="28" height="14" rx="3" fill="#ec4899" opacity=".5"/>
      <rect x="44" y="74" width="16" height="2.5" rx="1" fill="#be185d" opacity=".5"/>
      <rect x="76" y="57" width="28" height="24" rx="3" fill="#fce7f3"/>
      <rect x="76" y="57" width="28" height="14" rx="3" fill="#f472b6" opacity=".55"/>
      <rect x="110" y="57" width="22" height="24" rx="3" fill="#fce7f3"/>
      <rect x="110" y="57" width="22" height="14" rx="3" fill="#f9a8d4" opacity=".7"/>
    </svg>
  ),
  health: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#f0fdf4"/>
      <rect x="0" y="0" width="140" height="13" fill="#bbf7d0"/>
      <circle cx="10" cy="6.5" r="4" fill="#15803d"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#16a34a" opacity=".5"/>
      <rect x="8" y="16" width="124" height="36" rx="4" fill="#dcfce7"/>
      <polyline points="12,36 24,36 30,22 36,48 42,30 48,34 56,34 62,34 68,34 74,20 80,46 86,34 98,34 110,34 120,26 128,34 132,34" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="12,36 24,36 30,22 36,48 42,30 48,34 56,34 62,34 68,34 74,20 80,46 86,34 98,34 110,34 120,26 128,34 132,34" fill="none" stroke="#4ade80" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity=".12"/>
      <rect x="10" y="19" width="14" height="7" rx="1" fill="#4ade80"/>
      <rect x="26" y="20" width="22" height="5" rx="1" fill="#15803d" opacity=".5"/>
      <rect x="8" y="57" width="36" height="22" rx="3" fill="#dcfce7"/>
      <rect x="10" y="60" width="16" height="7" rx="1" fill="#16a34a"/>
      <rect x="10" y="70" width="28" height="2.5" rx="1" fill="#15803d" opacity=".4"/>
      <rect x="10" y="74" width="20" height="2" rx="1" fill="#4ade80" opacity=".5"/>
      <rect x="52" y="57" width="36" height="22" rx="3" fill="#dcfce7"/>
      <rect x="54" y="60" width="16" height="7" rx="1" fill="#15803d"/>
      <rect x="54" y="70" width="28" height="2.5" rx="1" fill="#15803d" opacity=".4"/>
      <rect x="96" y="57" width="36" height="22" rx="3" fill="#dcfce7"/>
      <rect x="98" y="60" width="16" height="7" rx="1" fill="#4ade80" opacity=".9"/>
      <rect x="98" y="70" width="28" height="2.5" rx="1" fill="#15803d" opacity=".4"/>
    </svg>
  ),
  education: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#eff6ff"/>
      <rect x="0" y="0" width="140" height="13" fill="#bfdbfe"/>
      <circle cx="10" cy="6.5" r="4" fill="#1d4ed8"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#2563eb" opacity=".5"/>
      <rect x="108" y="3" width="24" height="7" rx="3.5" fill="#1d4ed8"/>
      <rect x="8" y="18" width="60" height="38" rx="4" fill="#dbeafe"/>
      <rect x="8" y="18" width="60" height="22" rx="4" fill="#93c5fd"/>
      <rect x="28" y="24" width="20" height="3" rx="1" fill="white" opacity=".8"/>
      <path d="M38 27 L46 23 L38 19 L30 23 Z" fill="white" opacity=".7"/>
      <rect x="44" y="22" width="1.5" height="8" rx=".75" fill="white" opacity=".6"/>
      <rect x="12" y="43" width="40" height="3" rx="1.5" fill="#1d4ed8" opacity=".6"/>
      <rect x="12" y="48" width="28" height="2.5" rx="1" fill="#3b82f6" opacity=".4"/>
      <rect x="12" y="52" width="20" height="5" rx="2.5" fill="#1d4ed8"/>
      <rect x="35" y="52" width="4" height="3" rx=".5" fill="#fbbf24" opacity=".9"/>
      <rect x="41" y="52" width="4" height="3" rx=".5" fill="#fbbf24" opacity=".9"/>
      <rect x="47" y="52" width="4" height="3" rx=".5" fill="#fbbf24" opacity=".6"/>
      <rect x="74" y="18" width="58" height="17" rx="3" fill="#dbeafe"/>
      <rect x="74" y="18" width="28" height="17" rx="3" fill="#93c5fd"/>
      <rect x="106" y="21" width="22" height="3" rx="1" fill="#1d4ed8" opacity=".6"/>
      <rect x="106" y="27" width="16" height="2" rx="1" fill="#3b82f6" opacity=".4"/>
      <rect x="74" y="40" width="58" height="17" rx="3" fill="#dbeafe"/>
      <rect x="74" y="40" width="28" height="17" rx="3" fill="#bfdbfe"/>
      <rect x="106" y="43" width="22" height="3" rx="1" fill="#1d4ed8" opacity=".6"/>
      <rect x="106" y="49" width="16" height="2" rx="1" fill="#3b82f6" opacity=".4"/>
      <rect x="8" y="62" width="124" height="6" rx="3" fill="#dbeafe"/>
      <rect x="8" y="62" width="78" height="6" rx="3" fill="#3b82f6" opacity=".5"/>
      <rect x="8" y="72" width="124" height="6" rx="3" fill="#dbeafe"/>
      <rect x="8" y="72" width="50" height="6" rx="3" fill="#60a5fa" opacity=".5"/>
      <rect x="8" y="82" width="124" height="6" rx="3" fill="#dbeafe"/>
      <rect x="8" y="82" width="95" height="6" rx="3" fill="#93c5fd" opacity=".6"/>
    </svg>
  ),
  agency: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#fff7ed"/>
      <rect x="0" y="0" width="140" height="13" fill="#fed7aa"/>
      <circle cx="10" cy="6.5" r="4" fill="#c2410c"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#ea580c" opacity=".5"/>
      <rect x="35" y="16" width="70" height="58" rx="2" fill="#ffedd5"/>
      <rect x="35" y="12" width="70" height="8" rx="2" fill="#fed7aa"/>
      <rect x="41" y="20" width="16" height="10" rx="1" fill="#f97316" opacity=".9"/>
      <rect x="63" y="20" width="16" height="10" rx="1" fill="#ff6b35" opacity=".95"/>
      <rect x="85" y="20" width="16" height="10" rx="1" fill="#ea580c" opacity=".6"/>
      <rect x="41" y="34" width="16" height="10" rx="1" fill="#ea580c" opacity=".5"/>
      <rect x="63" y="34" width="16" height="10" rx="1" fill="#f97316" opacity=".95"/>
      <rect x="85" y="34" width="16" height="10" rx="1" fill="#fb923c" opacity=".8"/>
      <rect x="41" y="48" width="16" height="10" rx="1" fill="#f97316" opacity=".7"/>
      <rect x="63" y="48" width="16" height="10" rx="1" fill="#c2410c" opacity=".5"/>
      <rect x="85" y="48" width="16" height="10" rx="1" fill="#ea580c" opacity=".7"/>
      <rect x="57" y="60" width="26" height="14" rx="1" fill="#fed7aa"/>
      <circle cx="70" cy="67" r="1.5" fill="#c2410c" opacity=".4"/>
      <rect x="43" y="14" width="54" height="4" rx="1" fill="#c2410c" opacity=".7"/>
      <rect x="8" y="30" width="24" height="42" rx="1" fill="#ffedd5"/>
      <rect x="12" y="34" width="8" height="6" rx="1" fill="#fb923c" opacity=".6"/>
      <rect x="12" y="44" width="8" height="6" rx="1" fill="#f97316" opacity=".5"/>
      <rect x="108" y="36" width="24" height="36" rx="1" fill="#ffedd5"/>
      <rect x="112" y="40" width="8" height="6" rx="1" fill="#fb923c" opacity=".5"/>
      <rect x="0" y="76" width="140" height="12" fill="#ffedd5"/>
      <rect x="0" y="76" width="140" height="1" fill="#fed7aa"/>
    </svg>
  ),
  consulting: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#fffbeb"/>
      <rect x="0" y="0" width="140" height="13" fill="#fde68a"/>
      <circle cx="10" cy="6.5" r="4" fill="#b45309"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#d97706" opacity=".5"/>
      <rect x="8" y="16" width="86" height="56" rx="4" fill="#fef3c7"/>
      <rect x="18" y="52" width="12" height="14" rx="1" fill="#3b82f6"/>
      <rect x="34" y="42" width="12" height="24" rx="1" fill="#3b82f6" opacity=".8"/>
      <rect x="50" y="32" width="12" height="34" rx="1" fill="#16a34a"/>
      <rect x="66" y="25" width="12" height="41" rx="1" fill="#16a34a"/>
      <rect x="82" y="20" width="8" height="46" rx="1" fill="#f59e0b"/>
      <polyline points="24,52 40,42 56,32 72,25 86,18" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeDasharray="3,2"/>
      <circle cx="86" cy="18" r="3" fill="#dc2626"/>
      <line x1="14" y1="66" x2="90" y2="66" stroke="#92400e" strokeWidth="1" opacity=".3"/>
      <line x1="14" y1="20" x2="14" y2="66" stroke="#92400e" strokeWidth="1" opacity=".3"/>
      <rect x="100" y="16" width="32" height="14" rx="3" fill="#fde68a"/>
      <rect x="104" y="19" width="14" height="5" rx="1" fill="#f59e0b"/>
      <rect x="104" y="26" width="20" height="2" rx="1" fill="#b45309" opacity=".4"/>
      <rect x="100" y="34" width="32" height="14" rx="3" fill="#fde68a"/>
      <rect x="104" y="37" width="14" height="5" rx="1" fill="#16a34a"/>
      <rect x="104" y="44" width="20" height="2" rx="1" fill="#b45309" opacity=".4"/>
      <rect x="100" y="52" width="32" height="14" rx="3" fill="#fde68a"/>
      <rect x="104" y="55" width="14" height="5" rx="1" fill="#dc2626" opacity=".8"/>
      <rect x="104" y="62" width="20" height="2" rx="1" fill="#b45309" opacity=".4"/>
    </svg>
  ),
  blog: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#f8fafc"/>
      <rect x="0" y="0" width="140" height="13" fill="#e2e8f0"/>
      <circle cx="10" cy="6.5" r="4" fill="#475569"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#64748b" opacity=".5"/>
      <rect x="8" y="16" width="124" height="34" rx="3" fill="#f1f5f9"/>
      <rect x="8" y="28" width="124" height="22" fill="#cbd5e1" opacity=".4"/>
      <circle cx="110" cy="28" r="8" fill="#fbbf24" opacity=".5"/>
      <path d="M8 38 Q30 28 55 34 Q80 40 105 30 Q120 24 132 28 L132 50 L8 50 Z" fill="#16a34a" opacity=".25"/>
      <rect x="12" y="18" width="28" height="7" rx="3.5" fill="#64748b" opacity=".7"/>
      <rect x="14" y="20" width="18" height="3" rx="1" fill="white" opacity=".7"/>
      <rect x="8" y="53" width="90" height="6" rx="2" fill="#1e293b" opacity=".7"/>
      <rect x="8" y="62" width="110" height="3" rx="1.5" fill="#64748b" opacity=".4"/>
      <rect x="8" y="67" width="96" height="3" rx="1.5" fill="#94a3b8" opacity=".4"/>
      <circle cx="14" cy="78" r="5" fill="#475569" opacity=".6"/>
      <rect x="22" y="75" width="24" height="3" rx="1.5" fill="#475569" opacity=".5"/>
      <rect x="22" y="80" width="16" height="2" rx="1" fill="#94a3b8" opacity=".4"/>
      <rect x="102" y="75" width="30" height="7" rx="3.5" fill="#e2e8f0"/>
      <rect x="106" y="77" width="18" height="3" rx="1" fill="#64748b" opacity=".4"/>
    </svg>
  ),
  event: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#fff1f2"/>
      <rect x="0" y="0" width="140" height="13" fill="#fecdd3"/>
      <circle cx="10" cy="6.5" r="4" fill="#be123c"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#e11d48" opacity=".5"/>
      <path d="M15 72 L30 32 L55 32 L45 72 Z" fill="#fda4af" opacity=".3"/>
      <path d="M50 72 L60 32 L80 32 L72 72 Z" fill="#fb7185" opacity=".25"/>
      <path d="M85 72 L88 32 L110 32 L108 72 Z" fill="#fda4af" opacity=".3"/>
      <rect x="20" y="62" width="100" height="7" rx="2" fill="#fecdd3"/>
      <circle cx="25" cy="18" r="4" fill="#fbbf24" opacity=".9"/>
      <circle cx="55" cy="14" r="4" fill="#fbbf24" opacity=".9"/>
      <circle cx="85" cy="14" r="4" fill="#fbbf24" opacity=".9"/>
      <circle cx="115" cy="18" r="4" fill="#fbbf24" opacity=".9"/>
      <circle cx="70" cy="52" r="5" fill="#fda4af" opacity=".7"/>
      <rect x="67" y="57" width="6" height="8" rx="2" fill="#fecdd3"/>
      <circle cx="30" cy="72" r="4" fill="#fda4af" opacity=".5"/>
      <circle cx="44" cy="70" r="4" fill="#fb7185" opacity=".4"/>
      <circle cx="58" cy="72" r="4" fill="#fda4af" opacity=".5"/>
      <circle cx="82" cy="70" r="4" fill="#fb7185" opacity=".4"/>
      <circle cx="96" cy="72" r="4" fill="#fda4af" opacity=".5"/>
      <circle cx="110" cy="70" r="4" fill="#fb7185" opacity=".4"/>
      <rect x="35" y="22" width="4" height="4" rx="1" fill="#e11d48" opacity=".8" transform="rotate(20 37 24)"/>
      <rect x="72" y="19" width="4" height="4" rx="1" fill="#3b82f6" opacity=".8" transform="rotate(-15 74 21)"/>
      <rect x="95" y="24" width="4" height="4" rx="1" fill="#16a34a" opacity=".8" transform="rotate(30 97 26)"/>
      <rect x="48" y="20" width="3" height="3" rx=".5" fill="#fbbf24" opacity=".9" transform="rotate(10 49 21)"/>
      <rect x="100" y="34" width="32" height="22" rx="3" fill="#fecdd3"/>
      <rect x="100" y="34" width="32" height="8" rx="3" fill="#be123c" opacity=".8"/>
      <rect x="104" y="36" width="20" height="3" rx="1" fill="white" opacity=".8"/>
      <rect x="106" y="45" width="16" height="3" rx="1" fill="#be123c" opacity=".5"/>
    </svg>
  ),
  real_estate: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#fffbeb"/>
      <rect x="0" y="0" width="140" height="13" fill="#fde68a"/>
      <circle cx="10" cy="6.5" r="4" fill="#92400e"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#b45309" opacity=".5"/>
      <rect x="8" y="16" width="84" height="50" rx="4" fill="#fef3c7"/>
      <rect x="8" y="16" width="84" height="25" rx="4" fill="#bfdbfe" opacity=".6"/>
      <circle cx="76" cy="24" r="7" fill="#fbbf24" opacity=".6"/>
      <path d="M30 41 L50 26 L70 41 Z" fill="#fde68a"/>
      <rect x="33" y="41" width="34" height="20" rx="1" fill="#fef3c7"/>
      <rect x="42" y="49" width="10" height="12" rx="1" fill="#fde68a"/>
      <rect x="35" y="43" width="8" height="6" rx="1" fill="#f59e0b" opacity=".5"/>
      <rect x="55" y="43" width="8" height="6" rx="1" fill="#f59e0b" opacity=".5"/>
      <circle cx="20" cy="55" r="6" fill="#16a34a" opacity=".6"/>
      <rect x="19" y="58" width="2" height="6" fill="#92400e" opacity=".4"/>
      <circle cx="80" cy="57" r="5" fill="#16a34a" opacity=".5"/>
      <rect x="10" y="54" width="30" height="10" rx="2" fill="#f59e0b"/>
      <rect x="12" y="57" width="20" height="3" rx="1" fill="white" opacity=".9"/>
      <rect x="98" y="16" width="34" height="22" rx="3" fill="#fef3c7"/>
      <rect x="98" y="16" width="34" height="13" rx="3" fill="#fde68a"/>
      <path d="M104 29 L111 22 L118 29 Z" fill="#f59e0b" opacity=".6"/>
      <rect x="101" y="32" width="22" height="2.5" rx="1" fill="#92400e" opacity=".5"/>
      <rect x="101" y="35" width="14" height="2" rx="1" fill="#b45309" opacity=".5"/>
      <rect x="98" y="42" width="34" height="22" rx="3" fill="#fef3c7"/>
      <rect x="98" y="42" width="34" height="13" rx="3" fill="#fde68a"/>
      <path d="M104 55 L111 48 L118 55 Z" fill="#f59e0b" opacity=".5"/>
      <rect x="101" y="58" width="22" height="2.5" rx="1" fill="#92400e" opacity=".5"/>
      <rect x="8" y="70" width="20" height="8" rx="4" fill="#f59e0b"/>
      <rect x="32" y="70" width="20" height="8" rx="4" fill="#fde68a"/>
      <rect x="56" y="70" width="20" height="8" rx="4" fill="#fde68a"/>
    </svg>
  ),
  travel: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#f0f9ff"/>
      <rect x="0" y="0" width="140" height="13" fill="#bae6fd"/>
      <circle cx="10" cy="6.5" r="4" fill="#0369a1"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#0284c7" opacity=".5"/>
      <rect x="0" y="13" width="140" height="40" fill="#e0f2fe"/>
      <rect x="0" y="13" width="140" height="20" fill="#bae6fd" opacity=".6"/>
      <circle cx="100" cy="22" r="9" fill="#fbbf24" opacity=".8"/>
      <ellipse cx="100" cy="22" rx="14" ry="14" fill="#fbbf24" opacity=".15"/>
      <ellipse cx="30" cy="20" rx="14" ry="5" fill="white" opacity=".7"/>
      <path d="M0 53 L20 28 L40 53 Z" fill="#0284c7" opacity=".5"/>
      <path d="M25 53 L52 20 L79 53 Z" fill="#0369a1" opacity=".7"/>
      <path d="M65 53 L88 32 L111 53 Z" fill="#0284c7" opacity=".5"/>
      <path d="M100 53 L120 38 L140 53 Z" fill="#0369a1" opacity=".4"/>
      <path d="M52 20 L46 32 L58 32 Z" fill="white" opacity=".7"/>
      <rect x="0" y="53" width="140" height="10" fill="#38bdf8" opacity=".35"/>
      <path d="M0 56 Q18 52 35 56 Q52 60 70 56 Q88 52 105 56 Q122 60 140 56" fill="none" stroke="white" strokeWidth="1" opacity=".5"/>
      <path d="M60 35 L70 30 L72 33 L63 38 Z" fill="white"/>
      <path d="M63 34 L67 27 L69 28 L65 35 Z" fill="#e0f2fe"/>
      <rect x="8" y="66" width="38" height="16" rx="3" fill="#e0f2fe"/>
      <rect x="8" y="66" width="38" height="9" rx="3" fill="#bae6fd"/>
      <rect x="12" y="78" width="22" height="2" rx="1" fill="#0369a1" opacity=".5"/>
      <rect x="52" y="66" width="38" height="16" rx="3" fill="#e0f2fe"/>
      <rect x="52" y="66" width="38" height="9" rx="3" fill="#7dd3fc" opacity=".7"/>
      <rect x="56" y="78" width="22" height="2" rx="1" fill="#0369a1" opacity=".5"/>
      <rect x="96" y="66" width="38" height="16" rx="3" fill="#e0f2fe"/>
      <rect x="96" y="66" width="38" height="9" rx="3" fill="#bae6fd"/>
      <rect x="100" y="78" width="22" height="2" rx="1" fill="#0369a1" opacity=".5"/>
    </svg>
  ),
  craft: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#faf5ff"/>
      <rect x="0" y="0" width="140" height="13" fill="#e9d5ff"/>
      <circle cx="10" cy="6.5" r="4" fill="#7c3aed"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#9333ea" opacity=".5"/>
      <rect x="28" y="14" width="68" height="52" rx="2" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="1"/>
      <circle cx="48" cy="32" r="13" fill="#c084fc" opacity=".55"/>
      <circle cx="66" cy="37" r="11" fill="#818cf8" opacity=".5"/>
      <circle cx="58" cy="22" r="9" fill="#f43f5e" opacity=".4"/>
      <path d="M32 46 Q46 34 58 42 Q70 50 82 38" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round"/>
      <path d="M36 54 Q50 46 62 52 Q74 58 84 50" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="44" cy="24" r="3" fill="#fbbf24"/>
      <circle cx="76" cy="30" r="3" fill="#34d399"/>
      <circle cx="70" cy="50" r="2.5" fill="#f43f5e"/>
      <line x1="28" y1="66" x2="18" y2="78" stroke="#9333ea" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
      <line x1="96" y1="66" x2="106" y2="78" stroke="#9333ea" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
      <line x1="62" y1="66" x2="62" y2="78" stroke="#9333ea" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
      <ellipse cx="118" cy="40" rx="10" ry="13" fill="#ede9fe" stroke="#c4b5fd" strokeWidth=".5"/>
      <circle cx="113" cy="32" r="3.5" fill="#f43f5e"/>
      <circle cx="120" cy="30" r="3.5" fill="#3b82f6"/>
      <circle cx="124" cy="37" r="3.5" fill="#22c55e"/>
      <circle cx="122" cy="45" r="3.5" fill="#fbbf24"/>
      <circle cx="114" cy="47" r="3.5" fill="#a855f7"/>
      <rect x="8" y="20" width="3" height="22" rx="1.5" fill="#7c3aed" opacity=".6"/>
      <path d="M7 20 L11 20 L10 14 Z" fill="#a855f7"/>
      <rect x="14" y="26" width="3" height="18" rx="1.5" fill="#9333ea" opacity=".5"/>
      <path d="M13 26 L17 26 L16 20 Z" fill="#f43f5e"/>
    </svg>
  ),
  business_card: (
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',display:'block'}}>
      <rect width="140" height="88" fill="#f8fafc"/>
      <rect x="0" y="0" width="140" height="13" fill="#e2e8f0"/>
      <circle cx="10" cy="6.5" r="4" fill="#475569"/>
      <rect x="20" y="4" width="22" height="4" rx="2" fill="#64748b" opacity=".5"/>
      <rect x="18" y="24" width="108" height="54" rx="5" fill="#f1f5f9" transform="rotate(3 72 51)"/>
      <rect x="16" y="20" width="108" height="54" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
      <rect x="16" y="20" width="5" height="54" rx="5" fill="#64748b" opacity=".4"/>
      <circle cx="46" cy="42" r="14" fill="#cbd5e1" opacity=".8"/>
      <circle cx="46" cy="38" r="6" fill="#94a3b8" opacity=".6"/>
      <ellipse cx="46" cy="52" rx="9" ry="6" fill="#94a3b8" opacity=".4"/>
      <rect x="68" y="26" width="44" height="7" rx="2" fill="#1e293b" opacity=".65"/>
      <rect x="68" y="36" width="32" height="4" rx="1.5" fill="#64748b" opacity=".6"/>
      <line x1="68" y1="44" x2="116" y2="44" stroke="#e2e8f0" strokeWidth="1"/>
      <rect x="68" y="47" width="4" height="4" rx="1" fill="#64748b" opacity=".4"/>
      <rect x="75" y="48" width="30" height="2.5" rx="1" fill="#475569" opacity=".3"/>
      <rect x="68" y="54" width="4" height="4" rx="1" fill="#64748b" opacity=".4"/>
      <rect x="75" y="55" width="24" height="2.5" rx="1" fill="#475569" opacity=".3"/>
      <rect x="68" y="61" width="4" height="4" rx="1" fill="#64748b" opacity=".4"/>
      <rect x="75" y="62" width="28" height="2.5" rx="1" fill="#475569" opacity=".3"/>
      <rect x="100" y="53" width="14" height="14" rx="2" fill="#e2e8f0"/>
      <rect x="102" y="55" width="4" height="4" rx=".5" fill="#94a3b8"/>
      <rect x="108" y="55" width="4" height="4" rx=".5" fill="#94a3b8"/>
      <rect x="102" y="61" width="4" height="4" rx=".5" fill="#94a3b8"/>
      <rect x="106" y="59" width="2" height="2" rx=".5" fill="#64748b" opacity=".5"/>
    </svg>
  ),
};
