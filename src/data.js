// ─── Appliances ────────────────────────────────────────────────────────────
export const APPLIANCES = [
  { id: "bulb_led",        name: "LED Bulb",         icon: "💡",  watts: 10,   defaultHours: 6   },
  { id: "fan_ceiling",     name: "Ceiling Fan",       icon: "🌀",  watts: 75,   defaultHours: 10  },
  { id: "fan_standing",    name: "Standing Fan",      icon: "🌬️",  watts: 55,   defaultHours: 8   },
  { id: "tv_32",           name: 'TV (32")',           icon: "📺",  watts: 60,   defaultHours: 5   },
  { id: "tv_43",           name: 'TV (43")',           icon: "📺",  watts: 90,   defaultHours: 5   },
  { id: "fridge",          name: "Refrigerator",      icon: "🧊",  watts: 150,  defaultHours: 10  },
  { id: "freezer",         name: "Deep Freezer",      icon: "❄️",  watts: 200,  defaultHours: 10  },
  { id: "laptop",          name: "Laptop",            icon: "💻",  watts: 65,   defaultHours: 6   },
  { id: "phone_charge",    name: "Phone Charger",     icon: "📱",  watts: 15,   defaultHours: 3   },
  { id: "decoder",         name: "Decoder / DSTV",    icon: "📡",  watts: 25,   defaultHours: 6   },
  { id: "router",          name: "WiFi Router",       icon: "📶",  watts: 10,   defaultHours: 24  },
  { id: "ac_1hp",          name: "AC (1HP)",          icon: "🌡️",  watts: 900,  defaultHours: 6   },
  { id: "ac_1_5hp",        name: "AC (1.5HP)",        icon: "🌡️",  watts: 1300, defaultHours: 6   },
  { id: "washing_machine", name: "Washing Machine",   icon: "🫧",  watts: 500,  defaultHours: 1   },
  { id: "iron",            name: "Electric Iron",     icon: "🔧",  watts: 1000, defaultHours: 1   },
  { id: "water_pump",      name: "Water Pump",        icon: "💧",  watts: 750,  defaultHours: 1   },
  { id: "microwave",       name: "Microwave",         icon: "🍲",  watts: 1000, defaultHours: 0.5 },
  { id: "blender",         name: "Blender",           icon: "🥤",  watts: 400,  defaultHours: 0.5 },
  { id: "fridge_small",    name: "Fridge (165–250L)", icon: "🧊",  watts: 120,  defaultHours: 10  },
  { id: "fridge_large",    name: "Fridge (350–450L)", icon: "🧊",  watts: 220,  defaultHours: 10  },
  { id: "ac_2hp",          name: "AC (2HP)",          icon: "🌡️",  watts: 1800, defaultHours: 6   },
  { id: "tube_light",      name: "Tube Light",        icon: "💡",  watts: 18,   defaultHours: 6   },
  { id: "music_system",    name: "Music System",      icon: "🔊",  watts: 80,   defaultHours: 4   },
  { id: "desktop",         name: "Desktop Computer",  icon: "🖥️",  watts: 250,  defaultHours: 6   },
  { id: "gaming_console",  name: "Gaming Console",    icon: "🎮",  watts: 160,  defaultHours: 3   },
  { id: "toaster",         name: "Toaster",           icon: "🍞",  watts: 900,  defaultHours: 0.5 },
  { id: "water_heater",    name: "Water Heater",      icon: "🚿",  watts: 2000, defaultHours: 1   },
  { id: "home_theatre",    name: "Home Theatre",      icon: "🔈",  watts: 150,  defaultHours: 4   },
];

// ─── Battery Types ─────────────────────────────────────────────────────────
export const BATTERY_TYPES = [
  {
    id: "flooded", name: "Flooded Lead-Acid", short: "FLA", icon: "🔋",
    dod: 0.5, efficiency: 0.85, lifespan: "3–5 years", cycles: "300–500 cycles",
    color: "#f59e0b",
    pros: ["Widely available in Nigeria","Easy to find replacements","Simple technology"],
    cons: ["Requires regular water top-up","Releases hydrogen gas — needs ventilation","Heaviest option","Shallowest depth of discharge"],
    bestFor: "Maintenance-friendly sites where regular battery checks are manageable",
    educationNote: "The 'depth of discharge' (DoD) of 50% means you should only use half the rated capacity. A 200Ah battery only gives you 100Ah of usable energy — anything more shortens its life dramatically.",
  },
  {
    id: "agm", name: "AGM Battery", short: "AGM", icon: "⚡",
    dod: 0.5, efficiency: 0.9, lifespan: "4–7 years", cycles: "500–700 cycles",
    color: "#3b82f6",
    pros: ["Sealed — no maintenance","Spill-proof, can be mounted anywhere","Handles high current well","Lower self-discharge"],
    cons: ["Sensitive to overcharging","50% DoD same as flooded","Requires correct charge settings"],
    bestFor: "Homes wanting maintenance-free lead-acid batteries",
    educationNote: "AGM stands for Absorbent Glass Mat — the electrolyte is absorbed into fibreglass mats instead of being liquid. This makes it sealed and spill-proof, ideal for indoor or enclosed installations.",
  },
  {
    id: "gel", name: "Gel Battery", short: "GEL", icon: "🟡",
    dod: 0.5, efficiency: 0.88, lifespan: "5–8 years", cycles: "500–800 cycles",
    color: "#8b5cf6",
    pros: ["Handles heat better than AGM","Sealed and maintenance-free","Good for deep cycling","Long shelf life"],
    cons: ["Slower charging required","Damaged by fast charging","Requires a compatible charger"],
    bestFor: "Hot climates or remote setups where charging control is reliable",
    educationNote: "Gel batteries use silica to turn the electrolyte into a gel-like substance. They perform particularly well in high temperatures — important in Nigeria's climate — but they must be charged slowly with a compatible charger.",
  },
  {
    id: "lithium", name: "Lithium Iron Phosphate", short: "LiFePO₄", icon: "🚀",
    dod: 0.9, efficiency: 0.97, lifespan: "10–15 years", cycles: "2000–5000 cycles",
    color: "#10b981",
    pros: ["90% usable capacity","Lightest weight","No maintenance ever","Charges very fast","Built-in Battery Management System (BMS)"],
    cons: ["Requires compatible lithium charger/inverter","Less available locally","Needs correct BMS setup"],
    bestFor: "Long service life, low maintenance, and high usable capacity",
    educationNote: "LiFePO₄ is the safest lithium chemistry — it won't catch fire like older lithium types. Its 90% DoD means a 200Ah battery gives you 180Ah usable, so fewer modules may be needed for the same usable energy.",
  },
];

export const SYSTEM_VOLTAGES = [12, 24, 48];

export const PROPERTY_TYPES = [
  { id: "flat", label: "Flat / Apartment" },
  { id: "bungalow", label: "Bungalow" },
  { id: "duplex", label: "Duplex" },
  { id: "shop", label: "Shop / Office" },
];

export const INSTALLER_PREFS = [
  { id: "installer", label: "Use an installer" },
  { id: "compare", label: "Compare quotes first" },
  { id: "diy", label: "DIY / supervise closely" },
];

// ─── Load Profiles ─────────────────────────────────────────────────────────
export const LOAD_PROFILES = [
  {
    id: "starter", name: "Basic Starter", icon: "🌅",
    tag: "Smallest setup", tagColor: "#34d399",
    description: "Lights, fan, laptop & phone. Daytime use — no overnight loads.",
    appliances: [
      { id: "bulb_led",     hoursPerDay: 5  },
      { id: "fan_ceiling",  hoursPerDay: 8  },
      { id: "laptop",       hoursPerDay: 6  },
      { id: "phone_charge", hoursPerDay: 3  },
      { id: "tv_32",        hoursPerDay: 4  },
      { id: "router",       hoursPerDay: 10 },
    ],
  },
  {
    id: "typical", name: "Typical Home", icon: "🏠",
    tag: "Most popular", tagColor: "#fbbf24",
    description: "Fridge, fans, TV, decoder & laptop. Day + evening use.",
    appliances: [
      { id: "bulb_led",     hoursPerDay: 6  },
      { id: "fan_ceiling",  hoursPerDay: 12 },
      { id: "fridge",       hoursPerDay: 10 },
      { id: "tv_32",        hoursPerDay: 5  },
      { id: "decoder",      hoursPerDay: 5  },
      { id: "phone_charge", hoursPerDay: 3  },
      { id: "router",       hoursPerDay: 24 },
      { id: "laptop",       hoursPerDay: 4  },
    ],
  },
  {
    id: "family", name: "Family Home", icon: "👨‍👩‍👧‍👦",
    tag: "Heavy household", tagColor: "#f97316",
    description: "Fridge, freezer, multiple fans, big TV & overnight loads.",
    appliances: [
      { id: "bulb_led",     hoursPerDay: 8  },
      { id: "fan_ceiling",  hoursPerDay: 16 },
      { id: "fan_standing", hoursPerDay: 8  },
      { id: "fridge",       hoursPerDay: 12 },
      { id: "freezer",      hoursPerDay: 12 },
      { id: "tv_43",        hoursPerDay: 6  },
      { id: "decoder",      hoursPerDay: 6  },
      { id: "phone_charge", hoursPerDay: 4  },
      { id: "router",       hoursPerDay: 24 },
      { id: "laptop",       hoursPerDay: 3  },
    ],
  },
  {
    id: "generator", name: "Generator Replacement", icon: "⚡",
    tag: "Full replacement", tagColor: "#ef4444",
    description: "AC, washing machine + all household loads. Fully replaces a generator.",
    appliances: [
      { id: "bulb_led",        hoursPerDay: 8  },
      { id: "fan_ceiling",     hoursPerDay: 12 },
      { id: "fridge",          hoursPerDay: 12 },
      { id: "freezer",         hoursPerDay: 12 },
      { id: "tv_43",           hoursPerDay: 6  },
      { id: "decoder",         hoursPerDay: 6  },
      { id: "phone_charge",    hoursPerDay: 4  },
      { id: "router",          hoursPerDay: 24 },
      { id: "ac_1hp",          hoursPerDay: 6  },
      { id: "washing_machine", hoursPerDay: 1  },
      { id: "laptop",          hoursPerDay: 4  },
    ],
  },
];
