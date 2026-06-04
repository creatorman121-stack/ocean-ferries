'use strict';

/* OceanJet PortDesk V91 data registry.
   Source of truth merged from uploaded latestcode(1).html DEFAULT_DB.
   This preserves the original baggage slabs, passenger fare records, and schedule rows
   instead of using placeholder per-kg rates. */

const MAIN_CEBU_ROUTES = [
  "cebu_maasin",
  "cebu_surigao",
  "cebu_tagbilaran",
  "cebu_dumaguete",
  "cebu_siquijor",
  "cebu_ormoc",
  "cebu_getafe",
  "cebu_palompon"
];
const ROUTES = {
  "cebu_tagbilaran": {
    "label": "Cebu → Tagbilaran",
    "short": "Tagbilaran",
    "travel": "2h",
    "fare": {
      "TC/OA": 1000,
      "BC": 1560,
      "ST": 800,
      "MI": 500
    },
    "slab": {
      "normal": [
        15,
        25,
        30
      ],
      "fragile": [
        30,
        45,
        65
      ]
    },
    "trips": [
      [
        "5:10AM",
        "OJ 388",
        "7:10AM",
        "Connects to Siquijor/Dumaguete"
      ],
      [
        "6:00AM",
        "OJ 988",
        "8:00AM",
        ""
      ],
      [
        "7:00AM",
        "OJ 588",
        "9:00AM",
        ""
      ],
      [
        "8:20AM",
        "OJ 788",
        "10:20AM",
        "Connects to Dumaguete"
      ],
      [
        "9:20AM",
        "OJ 688",
        "11:20AM",
        ""
      ],
      [
        "10:40AM",
        "OJ 988",
        "12:40PM",
        ""
      ],
      [
        "11:40AM",
        "OJ 588",
        "1:40PM",
        ""
      ],
      [
        "12:20PM",
        "OJ 88",
        "2:20PM",
        "Special Siquijor connection"
      ],
      [
        "1:00PM",
        "OJ 288",
        "3:00PM",
        "Connects to Siquijor"
      ],
      [
        "2:00PM",
        "OJ 688",
        "4:00PM",
        ""
      ],
      [
        "3:20PM",
        "OJ 988",
        "5:20PM",
        ""
      ],
      [
        "4:20PM",
        "OJ 588",
        "6:20PM",
        ""
      ],
      [
        "5:40PM",
        "OJ 788",
        "7:40PM",
        ""
      ],
      [
        "6:40PM",
        "OJ 688",
        "8:40PM",
        ""
      ]
    ]
  },
  "tagbilaran_cebu": {
    "label": "Tagbilaran → Cebu",
    "short": "Cebu",
    "travel": "2h",
    "fare": {
      "TC/OA": 1000,
      "BC": 1560,
      "ST": 800,
      "MI": 500
    },
    "slab": {
      "normal": [
        15,
        25,
        30
      ],
      "fragile": [
        30,
        45,
        65
      ]
    },
    "trips": [
      [
        "6:00am",
        "OJ 988",
        "8:00am",
        ""
      ],
      [
        "7:05am",
        "OJ 588",
        "9:05am",
        ""
      ],
      [
        "8:20am",
        "OJ 788",
        "10:20am",
        ""
      ],
      [
        "9:20am",
        "OJ 688",
        "11:20am",
        ""
      ],
      [
        "10:40am",
        "OJ 988",
        "12:40pm",
        ""
      ],
      [
        "11:40am",
        "OJ 588",
        "1:40pm",
        ""
      ],
      [
        "1:00pm",
        "OJ 288",
        "3:00pm",
        ""
      ],
      [
        "2:00pm",
        "OJ 688",
        "4:00pm",
        ""
      ],
      [
        "3:20pm",
        "OJ 988",
        "5:20pm",
        ""
      ],
      [
        "4:20pm",
        "OJ 588",
        "6:20pm",
        ""
      ],
      [
        "5:00pm",
        "OJ 588",
        "7:00pm",
        ""
      ],
      [
        "5:40pm",
        "OJ 788",
        "7:40pm",
        ""
      ],
      [
        "6:30pm",
        "OJ 688",
        "8:30pm",
        ""
      ]
    ]
  },
  "tagbilaran_dumaguete": {
    "label": "Tagbilaran → Dumaguete",
    "short": "Dumaguete",
    "travel": "2h",
    "fare": {
      "TC/OA": 1170,
      "BC": 1820,
      "ST": 936,
      "MI": 585
    },
    "slab": {
      "normal": [
        25,
        30,
        35
      ],
      "fragile": [
        40,
        55,
        75
      ]
    },
    "trips": [
      [
        "10:40am",
        "OJ 388",
        "12:40pm",
        ""
      ]
    ]
  },
  "dumaguete_tagbilaran": {
    "label": "Dumaguete → Tagbilaran",
    "short": "Tagbilaran",
    "travel": "2h",
    "fare": {
      "TC/OA": 1170,
      "BC": 1820,
      "ST": 936,
      "MI": 585
    },
    "slab": {
      "normal": [
        25,
        30,
        35
      ],
      "fragile": [
        40,
        55,
        75
      ]
    },
    "trips": [
      [
        "1:00pm",
        "OJ 388",
        "3:00pm",
        ""
      ]
    ]
  },
  "siquijor_dumaguete": {
    "label": "Siquijor → Dumaguete",
    "short": "Dumaguete",
    "travel": "40m",
    "fare": {
      "TC/OA": 455,
      "BC": 754,
      "ST": 364,
      "MI": 227.5
    },
    "slab": {
      "normal": [
        20,
        27.5,
        32.5
      ],
      "fragile": [
        35,
        50,
        70
      ]
    },
    "trips": [
      [
        "6:00am",
        "OJ 388",
        "6:40am",
        ""
      ],
      [
        "10:00am",
        "OJ 988",
        "10:40am",
        ""
      ],
      [
        "12:00pm",
        "OJ 588",
        "12:40pm",
        ""
      ],
      [
        "6:00pm",
        "OJ 788",
        "6:40pm",
        ""
      ]
    ]
  },
  "dumaguete_siquijor": {
    "label": "Dumaguete → Siquijor",
    "short": "Siquijor",
    "travel": "40m",
    "fare": {
      "TC/OA": 455,
      "BC": 754,
      "ST": 364,
      "MI": 227.5
    },
    "slab": {
      "normal": [
        20,
        27.5,
        32.5
      ],
      "fragile": [
        35,
        50,
        70
      ]
    },
    "trips": [
      [
        "7:20am",
        "OJ 388",
        "8:00am",
        ""
      ],
      [
        "11:00am",
        "OJ 988",
        "11:40am",
        ""
      ],
      [
        "1:00pm",
        "OJ 588",
        "1:40pm",
        ""
      ],
      [
        "7:10pm",
        "OJ 788",
        "7:50pm",
        ""
      ]
    ]
  },
  "siquijor_tagbilaran": {
    "label": "Siquijor → Tagbilaran",
    "short": "Tagbilaran",
    "travel": "2h",
    "fare": {
      "TC/OA": 1000,
      "BC": 1560,
      "ST": 800,
      "MI": 500
    },
    "slab": {
      "normal": [
        20,
        27.5,
        32.5
      ],
      "fragile": [
        35,
        50,
        70
      ]
    },
    "trips": [
      [
        "8:20am",
        "OJ 388",
        "10:20am",
        ""
      ],
      [
        "2:30pm",
        "OJ 988",
        "4:30pm",
        ""
      ]
    ]
  },
  "tagbilaran_siquijor": {
    "label": "Tagbilaran → Siquijor",
    "short": "Siquijor",
    "travel": "2h",
    "fare": {
      "TC/OA": 1000,
      "BC": 1560,
      "ST": 800,
      "MI": 500
    },
    "slab": {
      "normal": [
        20,
        27.5,
        32.5
      ],
      "fragile": [
        35,
        50,
        70
      ]
    },
    "trips": [
      [
        "7:30am",
        "OJ 388",
        "9:30am",
        ""
      ],
      [
        "3:20pm",
        "OJ 988",
        "5:20pm",
        ""
      ]
    ]
  },
  "cebu_getafe": {
    "label": "Cebu → Getafe",
    "short": "Getafe",
    "travel": "1h",
    "fare": {
      "TC/OA": 585,
      "BC": 1040,
      "ST": 468,
      "MI": 292.5
    },
    "slab": {
      "normal": [
        10,
        20,
        25
      ],
      "fragile": [
        25,
        40,
        60
      ]
    },
    "trips": [
      [
        "6:30AM",
        "OJ 10",
        "7:30AM",
        ""
      ],
      [
        "10:00AM",
        "OJ 10",
        "11:00AM",
        ""
      ],
      [
        "1:30PM",
        "OJ 10",
        "2:30PM",
        ""
      ],
      [
        "5:00PM",
        "OJ 10",
        "6:00PM",
        ""
      ],
      [
        "6:45PM",
        "OJ 02",
        "7:45PM",
        ""
      ]
    ]
  },
  "getafe_cebu": {
    "label": "Getafe → Cebu",
    "short": "Cebu",
    "travel": "1h 15m",
    "fare": {
      "TC/OA": 585,
      "BC": 1040,
      "ST": 468,
      "MI": 292.5
    },
    "slab": {
      "normal": [
        10,
        20,
        25
      ],
      "fragile": [
        25,
        40,
        60
      ]
    },
    "trips": [
      [
        "6:30am",
        "OJ 10",
        "7:45am",
        ""
      ],
      [
        "8:15am",
        "OJ 10",
        "9:30am",
        ""
      ],
      [
        "11:45am",
        "OJ 10",
        "1:00pm",
        ""
      ],
      [
        "3:15pm",
        "OJ 10",
        "4:30pm",
        ""
      ],
      [
        "6:45pm",
        "OJ 02",
        "8:00pm",
        ""
      ]
    ]
  },
  "cebu_ormoc": {
    "label": "Cebu → Ormoc",
    "short": "Ormoc",
    "travel": "3h",
    "fare": {
      "TC/OA": 1430,
      "BC": 1950,
      "ST": 1144,
      "MI": 715
    },
    "slab": {
      "normal": [
        20,
        27.5,
        32.5
      ],
      "fragile": [
        35,
        50,
        70
      ]
    },
    "trips": [
      [
        "6:00AM",
        "OJ 8",
        "9:00AM",
        ""
      ],
      [
        "9:30AM",
        "OJ 168/OJ 188",
        "12:30PM",
        ""
      ],
      [
        "1:00PM",
        "OJ 8",
        "4:00PM",
        ""
      ],
      [
        "4:30PM",
        "OJ 168/OJ 188",
        "7:30PM",
        ""
      ]
    ]
  },
  "ormoc_cebu": {
    "label": "Ormoc → Cebu",
    "short": "Cebu",
    "travel": "3h",
    "fare": {
      "TC/OA": 1430,
      "BC": 1950,
      "ST": 1144,
      "MI": 715
    },
    "slab": {
      "normal": [
        20,
        27.5,
        32.5
      ],
      "fragile": [
        35,
        50,
        70
      ]
    },
    "trips": [
      [
        "6:00am",
        "OJ 8",
        "9:00am",
        ""
      ],
      [
        "9:30am",
        "OJ 168/OJ 188",
        "12:30pm",
        ""
      ],
      [
        "1:00pm",
        "OJ 8",
        "4:00pm",
        ""
      ],
      [
        "4:30pm",
        "OJ 168/OJ 188",
        "7:30pm",
        ""
      ]
    ]
  },
  "cebu_palompon": {
    "label": "Cebu → Palompon",
    "short": "Palompon",
    "travel": "3h",
    "fare": {
      "TC/OA": 1430,
      "BC": 1950,
      "ST": 1144,
      "MI": 715
    },
    "slab": {
      "normal": [
        20,
        27.5,
        32.5
      ],
      "fragile": [
        35,
        50,
        70
      ]
    },
    "trips": [
      [
        "10:00AM",
        "OJ 02",
        "1:00PM",
        "Kalanggaman connection"
      ],
      [
        "1:30PM",
        "OJ 02",
        "4:30PM",
        "Afternoon service"
      ]
    ]
  },
  "palompon_cebu": {
    "label": "Palompon → Cebu",
    "short": "Cebu",
    "travel": "3h",
    "fare": {
      "TC/OA": 1430,
      "BC": 1950,
      "ST": 1144,
      "MI": 715
    },
    "slab": {
      "normal": [
        20,
        27.5,
        32.5
      ],
      "fragile": [
        35,
        50,
        70
      ]
    },
    "trips": [
      [
        "1:30pm",
        "OJ 02",
        "4:30pm",
        ""
      ]
    ]
  },
  "cebu_maasin": {
    "label": "Cebu → Maasin",
    "short": "Maasin",
    "travel": "3h",
    "fare": {
      "TC/OA": 1430,
      "BC": 1950,
      "ST": 1144,
      "MI": 715
    },
    "slab": {
      "normal": [
        20,
        27.5,
        32.5
      ],
      "fragile": [
        35,
        50,
        70
      ]
    },
    "trips": [
      [
        "7:00am",
        "OJ 03",
        "10:00am",
        ""
      ]
    ]
  },
  "maasin_cebu": {
    "label": "Maasin → Cebu",
    "short": "Cebu",
    "travel": "3h",
    "fare": {
      "TC/OA": 1430,
      "BC": 1950,
      "ST": 1144,
      "MI": 715
    },
    "slab": {
      "normal": [
        20,
        27.5,
        32.5
      ],
      "fragile": [
        35,
        50,
        70
      ]
    },
    "trips": [
      [
        "3:30pm",
        "OJ 03",
        "6:30pm",
        ""
      ]
    ]
  },
  "maasin_surigao": {
    "label": "Maasin → Surigao",
    "short": "Surigao",
    "travel": "2h",
    "fare": {
      "TC/OA": 1040,
      "BC": 1560,
      "ST": 832,
      "MI": 520
    },
    "slab": {
      "normal": [
        30,
        35,
        40
      ],
      "fragile": [
        50,
        65,
        85
      ]
    },
    "trips": [
      [
        "10:30am",
        "OJ 388",
        "12:30pm",
        ""
      ]
    ]
  },
  "surigao_maasin": {
    "label": "Surigao → Maasin",
    "short": "Maasin",
    "travel": "2h",
    "fare": {
      "TC/OA": 1040,
      "BC": 1560,
      "ST": 832,
      "MI": 520
    },
    "slab": {
      "normal": [
        30,
        35,
        40
      ],
      "fragile": [
        50,
        65,
        85
      ]
    },
    "trips": [
      [
        "1:00pm",
        "OJ 388",
        "3:00pm",
        ""
      ]
    ]
  },
  "bacolod_iloilo": {
    "label": "Bacolod → Iloilo",
    "short": "Iloilo",
    "travel": "1h",
    "fare": {
      "TC/OA": 700,
      "BC": 1000,
      "ST": 570,
      "MI": 350
    },
    "slab": {
      "normal": [
        10,
        20,
        25
      ],
      "fragile": [
        25,
        40,
        60
      ]
    },
    "trips": [
      [
        "5:45am",
        "OJ 388",
        "6:45am",
        ""
      ],
      [
        "8:50am",
        "OJ 988",
        "9:50am",
        ""
      ],
      [
        "1:00pm",
        "OJ 588",
        "2:00pm",
        ""
      ],
      [
        "4:00pm",
        "OJ 788",
        "5:00pm",
        ""
      ]
    ]
  },
  "iloilo_bacolod": {
    "label": "Iloilo → Bacolod",
    "short": "Bacolod",
    "travel": "1h",
    "fare": {
      "TC/OA": 700,
      "BC": 1000,
      "ST": 570,
      "MI": 350
    },
    "slab": {
      "normal": [
        10,
        20,
        25
      ],
      "fragile": [
        25,
        40,
        60
      ]
    },
    "trips": [
      [
        "7:20am",
        "OJ 388",
        "8:20am",
        ""
      ],
      [
        "11:00am",
        "OJ 988",
        "12:00pm",
        ""
      ],
      [
        "2:30pm",
        "OJ 588",
        "3:30pm",
        ""
      ],
      [
        "5:30pm",
        "OJ 788",
        "6:30pm",
        ""
      ]
    ]
  },
  "calapan_batangas": {
    "label": "Calapan → Batangas",
    "short": "Batangas",
    "travel": "1h 10m",
    "fare": {
      "TC/OA": 600,
      "BC": 850,
      "ST": 480,
      "MI": 300
    },
    "slab": {
      "normal": [
        10,
        20,
        25
      ],
      "fragile": [
        25,
        40,
        60
      ]
    },
    "trips": [
      [
        "5:50am",
        "OJ 388",
        "7:00am",
        ""
      ],
      [
        "9:20am",
        "OJ 988",
        "10:30am",
        ""
      ],
      [
        "12:40pm",
        "OJ 588",
        "1:50pm",
        ""
      ],
      [
        "4:00pm",
        "OJ 788",
        "5:10pm",
        ""
      ]
    ]
  },
  "batangas_calapan": {
    "label": "Batangas → Calapan",
    "short": "Calapan",
    "travel": "1h 10m",
    "fare": {
      "TC/OA": 600,
      "BC": 850,
      "ST": 480,
      "MI": 300
    },
    "slab": {
      "normal": [
        10,
        20,
        25
      ],
      "fragile": [
        25,
        40,
        60
      ]
    },
    "trips": [
      [
        "7:40am",
        "OJ 388",
        "8:50am",
        ""
      ],
      [
        "11:00am",
        "OJ 988",
        "12:10pm",
        ""
      ],
      [
        "2:20pm",
        "OJ 588",
        "3:30pm",
        ""
      ],
      [
        "5:40pm",
        "OJ 788",
        "6:50pm",
        ""
      ]
    ]
  },
  "cebu_dumaguete": {
    "label": "Cebu → Dumaguete",
    "short": "Dumaguete",
    "travel": "4h 20m",
    "fare": {
      "TC/OA": 1170,
      "BC": 1820,
      "ST": 936,
      "MI": 585
    },
    "slab": {
      "normal": [
        25,
        30,
        35
      ],
      "fragile": [
        40,
        55,
        75
      ]
    },
    "trips": [
      [
        "5:10AM",
        "OJ 388",
        "9:30AM",
        "Via Tagbilaran"
      ],
      [
        "1:00PM",
        "OJ 288",
        "5:20PM",
        "Via Tagbilaran"
      ]
    ]
  },
  "cebu_surigao": {
    "label": "Cebu → Surigao",
    "short": "Surigao",
    "travel": "5h 30m",
    "fare": {
      "TC/OA": 1040,
      "BC": 1560,
      "ST": 832,
      "MI": 520
    },
    "slab": {
      "normal": [
        30,
        35,
        40
      ],
      "fragile": [
        50,
        65,
        85
      ]
    },
    "trips": [
      [
        "7:00AM",
        "OJ 03",
        "12:30PM",
        "Via Maasin"
      ]
    ]
  },
  "cebu_siquijor": {
    "label": "Cebu → Siquijor",
    "short": "Siquijor",
    "travel": "4h 20m",
    "fare": {
      "TC/OA": 1000,
      "BC": 1560,
      "ST": 800,
      "MI": 500
    },
    "slab": {
      "normal": [
        20,
        27.5,
        32.5
      ],
      "fragile": [
        35,
        50,
        70
      ]
    },
    "trips": [
      [
        "6:00AM",
        "OJ 388 (via Tagb)",
        "10:20AM",
        "Through Tagbilaran"
      ],
      [
        "1:00PM",
        "OJ 288 (via Tagb)",
        "5:20PM",
        "Afternoon service"
      ]
    ]
  }
};
const DEFAULT_STATUSES = ['Scheduled','Boarding','Departing Soon','Departed','Closed','Delayed','Cancelled'];
const ROLE_NAVS = {
  passenger: [
    ['dashboard','🏠','Home'], ['board','🛳️','Vessel Board'], ['calculator','🧮','Baggage Estimate'], ['claim','📝','Claim Intake'], ['track','🔎','Track Claim'], ['trips','🕐','Schedules']
  ],
  cashier: [
    ['dashboard','🏠','Dashboard'], ['board','🛳️','Vessel Board'], ['calculator','🧮','Baggage Counter'], ['receipt','🧾','Receipts'], ['trips','🕐','Schedules'], ['reports','📊','Cashier Reports']
  ],
  admin: [
    ['dashboard','🏠','Command Center'], ['board','🛳️','Vessel Board'], ['calculator','🧮','Baggage QA'], ['claim','📝','Claim Intake'], ['damage','📸','Evidence Studio'], ['queue','✅','Review Queue'], ['trips','🕐','Schedule Control'], ['sync','☁️','Google Sync'], ['reports','📊','Reports'], ['system','⚙️','System Tools']
  ]
};

const DEFAULT_DATA = {
  settings: {
    cashier: {u:'cashier', p:'cashier'},
    admin: {u:'admin', p:'admin'},
    syncUrl: '',
    routeFilter: 'all'
  },
  transactions: [],
  claims: [],
  cases: [],
  audit: [],
  scheduleOverrides: {},
  manualStatus: {},
  receipts: [],
  syncOutbox: []
};
