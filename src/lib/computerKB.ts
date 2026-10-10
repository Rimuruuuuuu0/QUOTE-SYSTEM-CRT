// Offline computer knowledge base: explainers, comparisons, troubleshooting.
// All local, zero backend. Keep answers short and shop-practical.

export interface KBTopic {
  keys: string[]
  answer: string
}

export const OFFTOPIC = /president|election|politics|religion|bible|lottery|love|relationship|suicide|gamble/i

const T: KBTopic[] = [
  {
    keys: ['ddr4 vs ddr5', 'ddr5 vs ddr4', 'difference ddr4 ddr5', 'ddr4 or ddr5'],
    answer: 'DDR4 vs DDR5: DDR5 is faster (4800MHz+ vs 2133–3200MHz) and more power-efficient, but costs more and needs a DDR5 board (e.g. B650/B760). DDR4 boards (B550/B660) cannot take DDR5 sticks — different slot. For budget builds DDR4 16GB/3200MHz is still the value king; for new AM5/LGA1700 builds go DDR5.',
  },
  {
    keys: ['ddr3', 'ddr3 vs', 'old ram'],
    answer: 'DDR3 is two generations old (1600MHz typical). It only fits DDR3 boards — it will NOT work in DDR4/DDR5 slots. Fine for old office PCs; for any new build use DDR4 or DDR5.',
  },
  {
    keys: ['ryzen 5 5600', '5600 good', '5600 gaming'],
    answer: 'Ryzen 5 5600 (6c/12t, AM4) is the budget gaming sweet spot: pairs well with B550 + RTX 3050/4060 class GPUs. Needs a discrete GPU (no usable iGPU except the G variants). Stock cooler is enough for stock speeds.',
  },
  {
    keys: ['ryzen vs intel', 'amd or intel', 'amd vs intel'],
    answer: 'AMD AM4 (Ryzen 5000) = cheapest upgrade path, boards like B550 are affordable. Intel LGA1700 (12th/13th gen) = strong single-core, boards B660/H610. Pick ONE platform: Ryzen CPUs need AMD boards (B550/A520), Intel CPUs need Intel boards (B660/H610) — they are not interchangeable.',
  },
  {
    keys: ['psu watt', 'how many watts', 'what psu', 'power supply size', '650w enough', '550w enough'],
    answer: 'PSU rule: office/iGPU builds 450–500W; RTX 3050/4060 class 550–650W 80+ Bronze minimum; high-end GPUs 750W+. Never cheap out on the PSU — a bad one can kill the whole PC. 80+ Bronze or better from a known brand.',
  },
  {
    keys: ['no boot', 'wont boot', "won't turn on", 'no power', 'dead pc'],
    answer: 'No-power checklist: 1) wall socket + AVR/UPS on? 2) PSU rear switch ON? 3) 24-pin + 8-pin CPU power seated? 4) Try one RAM stick, reseat it. 5) Disconnect GPU, try onboard video. If fans spin but no display — RAM/GPU/CPU seating issue. Bring it in and we diagnose free with any repair.',
  },
  {
    keys: ['no display', 'black screen', 'monitor no signal'],
    answer: 'No display: 1) Monitor input set to HDMI/DP correctly? 2) Cable plugged into the GPU (not the motherboard) when a GPU is installed? 3) Reseat RAM + GPU. 4) Clear CMOS. Still black — test with another cable/monitor before assuming a dead part.',
  },
  {
    keys: ['overheat', 'too hot', 'high temp', 'thermal', 'shuts down gaming', 'auto shutdown'],
    answer: 'Overheating: check fans spinning, dust-clogged heatsink, dried thermal paste (replace yearly in dusty shops), and case airflow (intake front, exhaust rear). CPU idle should be 35–55°C, under load below 85–90°C. We do cleaning + thermal replace as a service.',
  },
  {
    keys: ['blue screen', 'bsod'],
    answer: 'Blue screens are usually RAM, storage, or driver faults. Note the stop code, run a RAM test (memtest), check SSD health (CrystalDiskInfo), update GPU/chipset drivers. Random BSODs after a RAM upgrade = incompatible or faulty stick.',
  },
  {
    keys: ['slow pc', 'laggy', 'speed up', 'upgrade hdd', 'ssd upgrade worth'],
    answer: 'Biggest speedup for old PCs: HDD → SSD (bigger difference than more RAM in most cases), then 8GB→16GB RAM, then clean Windows reinstall. An SSD + fresh Windows makes a 5-year-old PC feel new for office/browsing.',
  },
  {
    keys: ['reformat', 'reinstall windows', 'fresh windows', 'windows install'],
    answer: 'Reformat = full Windows reinstall: back up files first (we always ask), install Windows 10/11, drivers (chipset, GPU, LAN), then updates + antivirus. Takes ~1–2 hours in-shop including drivers. Your license key stays valid if linked to your Microsoft account.',
  },
  {
    keys: ['rtx 3050', 'rtx 4060', '3050 vs 4060', '4060 worth', 'gpu for 1080p'],
    answer: 'RTX 3050 6GB = entry 1080p gaming (esports + medium settings). RTX 4060 8GB = comfortable 1080p high/ultra with DLSS, ~60–80% faster, needs 550W+ PSU. For 1080p 75Hz monitors the 3050 suffices; for 144Hz or heavier titles get the 4060.',
  },
  {
    keys: ['ssd vs hdd', 'nvme vs sata', 'nvme worth'],
    answer: 'NVMe SSDs are 5–10x faster than SATA SSDs on paper, but for gaming/office the felt difference is small — any SSD beats any HDD massively. NVMe needs an M.2 slot; check your board (B550 and newer all have one). 500GB minimum for Windows + apps.',
  },
  {
    keys: ['monitor hz', '75hz vs 144hz', 'what monitor', 'ips vs va'],
    answer: '75Hz = fine for office/casual. 144Hz+ = visibly smoother for gaming, needs a GPU that can push those frames. IPS = best colors/viewing angles; VA = better contrast, can smear in fast games. 23.8" 1080p is the value sweet spot.',
  },
  {
    keys: ['wifi slow', 'no internet', 'lan vs wifi', 'no wifi'],
    answer: 'Desktop has no WiFi by default — needs a WiFi dongle/card or LAN cable (LAN is faster and more stable for gaming). No internet: check router lights, restart router + PC, reseat LAN cable, reinstall LAN driver.',
  },
  {
    keys: ['compatible', 'will it fit', 'will it work with', 'bottleneck'],
    answer: 'Compatibility in one line: CPU socket must match board (Ryzen↔AMD board, Intel↔Intel board), RAM gen must match board (DDR4 board = DDR4 only), GPU needs PSU headroom, case must fit board size (ATX board needs ATX case). Tell me the exact parts and I will check them against your catalog.',
  },
  {
    keys: ['warranty', 'guarantee', 'return'],
    answer: 'Warranty follows manufacturer terms per part (usually 1 year shop warranty assistance + distributor/manufacturer warranty). Keep your quotation/invoice — it is your proof of purchase. Prices in quotations are subject to change without notice.',
  },
  {
    keys: ['how long build', 'assemble time', 'build time'],
    answer: 'Standard assembly + testing takes a few hours in-shop once all parts are in stock; we stress-test (CPU/GPU/RAM) before release. Add Windows install + drivers and it is usually same-day or next-day pickup.',
  },
  {
    keys: ['office pc', 'office build', 'browsing pc', 'student pc'],
    answer: 'Office/student sweet spot: Ryzen 3 / i3 class CPU, B-board, 8–16GB RAM, 256–500GB SSD, 450–500W PSU. No GPU needed — onboard graphics handle docs, browsing, online class, light editing. Aim ~₱20–30k brand new.',
  },
]

export function kbAnswer(text: string): string | null {
  const t = text.toLowerCase()
  // pair questions ("difference between X and Y") match even with filler words
  if (t.includes('ddr4') && t.includes('ddr5')) {
    return T[0].answer
  }
  if ((t.includes('3050') && t.includes('4060')) || (t.includes('ryzen') && t.includes('intel') && /vs|versus|difference|compare|better|or/.test(t))) {
    return (t.includes('3050') ? T.find((x) => x.keys.includes('rtx 3050')) : T.find((x) => x.keys.includes('ryzen vs intel')))?.answer || null
  }
  let best: KBTopic | null = null
  let bestScore = 0
  for (const topic of T) {
    let s = 0
    for (const k of topic.keys) {
      if (t.includes(k)) s = Math.max(s, k.length >= 8 ? 3 : 2)
    }
    // partial credit: 2+ short keys from same topic
    if (!s) {
      const hits = topic.keys.filter((k) => k.length < 8 && t.includes(k)).length
      if (hits >= 2) s = 2
    }
    if (s > bestScore) {
      best = topic
      bestScore = s
    }
  }
  return best && bestScore >= 2 ? best.answer : null
}

export const isComputerRelated = (text: string) =>
  /pc|computer|hardware|cpu|gpu|ram|ddr|ssd|hdd|motherboard|psu|monitor|fps|gaming|windows|driver|boot|virus|wifi|lan|printer|build|upgrade|warranty|thermal|fan|case|keyboard|mouse|ryzen|intel|rtx|gtx|radeon|nvme|atx|am4|am5|lga|overheat|reformat|install|repa|clean|troubleshoot|fix|slow| Compatible|shop|stock|price|quote/i.test(text)
