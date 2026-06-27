/* ═══════════════════════════════════════════════════════════════
   Ocean Fast Ferries · Baggage Pro V300 — Data Module
   ═══════════════════════════════════════════════════════════════ */

const DB_KEY = 'off_baggage_v15';
const DB_VERSION = 15;

const DEFAULT_DB = {
  slabs: {
    cebu_tagbilaran:         { normal:[15,25,30],   fragile:[30,45,65] },
    tagbilaran_cebu:         { normal:[15,25,30],   fragile:[30,45,65] },
    tagbilaran_dumaguete:    { normal:[25,30,35],   fragile:[40,55,75] },
    dumaguete_tagbilaran:    { normal:[25,30,35],   fragile:[40,55,75] },
    siquijor_dumaguete:      { normal:[20,27.5,32.5], fragile:[35,50,70] },
    dumaguete_siquijor:      { normal:[20,27.5,32.5], fragile:[35,50,70] },
    siquijor_tagbilaran:    { normal:[20,27.5,32.5], fragile:[35,50,70] },
    tagbilaran_siquijor:    { normal:[20,27.5,32.5], fragile:[35,50,70] },
    cebu_getafe:             { normal:[10,20,25],   fragile:[25,40,60] },
    getafe_cebu:             { normal:[10,20,25],   fragile:[25,40,60] },
    cebu_ormoc:              { normal:[20,27.5,32.5], fragile:[35,50,70] },
    ormoc_cebu:              { normal:[20,27.5,32.5], fragile:[35,50,70] },
    cebu_palompon:           { normal:[20,27.5,32.5], fragile:[35,50,70] },
    palompon_cebu:           { normal:[20,27.5,32.5], fragile:[35,50,70] },
    cebu_maasin:             { normal:[20,27.5,32.5], fragile:[35,50,70] },
    maasin_cebu:             { normal:[20,27.5,32.5], fragile:[35,50,70] },
    maasin_surigao:          { normal:[30,35,40],   fragile:[50,65,85] },
    surigao_maasin:          { normal:[30,35,40],   fragile:[50,65,85] },
    bacolod_iloilo:          { normal:[10,20,25],   fragile:[25,40,60] },
    iloilo_bacolod:          { normal:[10,20,25],   fragile:[25,40,60] },
    calapan_batangas:        { normal:[10,20,25],   fragile:[25,40,60] },
    batangas_calapan:        { normal:[10,20,25],   fragile:[25,40,60] },
    cebu_dumaguete:          { normal:[25,30,35],   fragile:[40,55,75] },
    cebu_surigao:            { normal:[30,35,40],   fragile:[50,65,85] },
    cebu_siquijor:           { normal:[20,27.5,32.5], fragile:[35,50,70] }
  },
  freeAllowance: { tourist:10, business:20 },
  paxFares: {
    cebu_tagbilaran:         {'TC/OA':920,  'BC':1450, 'ST':736,  'MI':460},
    tagbilaran_cebu:         {'TC/OA':920,  'BC':1450, 'ST':736,  'MI':460},
    tagbilaran_siquijor:     {'TC/OA':950,  'BC':1450, 'ST':760,  'MI':475},
    siquijor_tagbilaran:     {'TC/OA':950,  'BC':1450, 'ST':760,  'MI':475},
    tagbilaran_dumaguete:    {'TC/OA':1080, 'BC':1680, 'ST':864,  'MI':540},
    dumaguete_tagbilaran:    {'TC/OA':1080, 'BC':1680, 'ST':864,  'MI':540},
    dumaguete_siquijor:      {'TC/OA':420,  'BC':700,  'ST':336,  'MI':210},
    siquijor_dumaguete:      {'TC/OA':420,  'BC':700,  'ST':336,  'MI':210},
    iloilo_bacolod:          {'TC/OA':700,  'BC':1000, 'ST':570,  'MI':350},
    bacolod_iloilo:          {'TC/OA':700,  'BC':1000, 'ST':570,  'MI':350},
    cebu_getafe:             {'TC/OA':540,  'BC':960,  'ST':432,  'MI':270},
    getafe_cebu:             {'TC/OA':540,  'BC':960,  'ST':432,  'MI':270},
    cebu_ormoc:              {'TC/OA':1320, 'BC':1920, 'ST':1056, 'MI':660},
    ormoc_cebu:              {'TC/OA':1320, 'BC':1920, 'ST':1056, 'MI':660},
    cebu_palompon:           {'TC/OA':1320, 'BC':1920, 'ST':1056, 'MI':660},
    palompon_cebu:           {'TC/OA':1320, 'BC':1920, 'ST':1056, 'MI':660},
    cebu_maasin:             {'TC/OA':1320, 'BC':1920, 'ST':1056, 'MI':660},
    maasin_cebu:             {'TC/OA':1320, 'BC':1920, 'ST':1056, 'MI':660},
    maasin_surigao:          {'TC/OA':960,  'BC':1450, 'ST':768,  'MI':480},
    surigao_maasin:          {'TC/OA':960,  'BC':1450, 'ST':768,  'MI':480},
    calapan_batangas:        {'TC/OA':600,  'BC':850,  'ST':480,  'MI':300},
    batangas_calapan:        {'TC/OA':600,  'BC':850,  'ST':480,  'MI':300},
    cebu_dumaguete:          {'TC/OA':2000, 'BC':3130, 'ST':1600, 'MI':1000},
    cebu_surigao:            {'TC/OA':2280, 'BC':3370, 'ST':1824, 'MI':1140},
    cebu_siquijor:           {'TC/OA':1870, 'BC':2900, 'ST':1496, 'MI':935}
  },
  schedules: {
    cebu_tagbilaran: { title:'Cebu to Tagbilaran', travel:'2h', trips:[
      {dep:'5:10AM',vessel:'OJ 388',arr:'7:10AM',remarks:'Connects to Siquijor/Dumaguete'},
      {dep:'6:00AM',vessel:'OJ 988',arr:'8:00AM',remarks:''},
      {dep:'7:00AM',vessel:'OJ 588',arr:'9:00AM',remarks:''},
      {dep:'8:20AM',vessel:'OJ 788',arr:'10:20AM',remarks:'Connects to Dumaguete'},
      {dep:'9:20AM',vessel:'OJ 688',arr:'11:20AM',remarks:''},
      {dep:'10:40AM',vessel:'OJ 988',arr:'12:40PM',remarks:''},
      {dep:'11:40AM',vessel:'OJ 588',arr:'1:40PM',remarks:''},
      {dep:'12:20PM',vessel:'OJ 88',arr:'2:20PM',remarks:'Special Siquijor connection'},
      {dep:'1:00PM',vessel:'OJ 288',arr:'3:00PM',remarks:'Connects to Siquijor'},
      {dep:'2:00PM',vessel:'OJ 688',arr:'4:00PM',remarks:''},
      {dep:'3:20PM',vessel:'OJ 988',arr:'5:20PM',remarks:''},
      {dep:'4:20PM',vessel:'OJ 588',arr:'6:20PM',remarks:''},
      {dep:'5:40PM',vessel:'OJ 788',arr:'7:40PM',remarks:''},
      {dep:'6:40PM',vessel:'OJ 688',arr:'8:40PM',remarks:''}
    ]},
    tagbilaran_cebu: { title:'Tagbilaran to Cebu', travel:'2h', trips:[
      {dep:'6:00am',vessel:'OJ 988',arr:'8:00am',remarks:''},
      {dep:'7:05am',vessel:'OJ 588',arr:'9:05am',remarks:''},
      {dep:'8:20am',vessel:'OJ 788',arr:'10:20am',remarks:''},
      {dep:'9:20am',vessel:'OJ 688',arr:'11:20am',remarks:''},
      {dep:'10:40am',vessel:'OJ 988',arr:'12:40pm',remarks:''},
      {dep:'11:40am',vessel:'OJ 588',arr:'1:40pm',remarks:''},
      {dep:'1:00pm',vessel:'OJ 288',arr:'3:00pm',remarks:''},
      {dep:'2:00pm',vessel:'OJ 688',arr:'4:00pm',remarks:''},
      {dep:'3:20pm',vessel:'OJ 988',arr:'5:20pm',remarks:''},
      {dep:'4:20pm',vessel:'OJ 588',arr:'6:20pm',remarks:''},
      {dep:'5:00pm',vessel:'OJ 588',arr:'7:00pm',remarks:''},
      {dep:'5:40pm',vessel:'OJ 788',arr:'7:40pm',remarks:''},
      {dep:'6:30pm',vessel:'OJ 688',arr:'8:30pm',remarks:''}
    ]},
    tagbilaran_dumaguete: { title:'Tagbilaran to Dumaguete', travel:'2h', trips:[
      {dep:'10:40am',vessel:'OJ 388',arr:'12:40pm',remarks:''}
    ]},
    dumaguete_tagbilaran: { title:'Dumaguete to Tagbilaran', travel:'2h', trips:[
      {dep:'1:00pm',vessel:'OJ 388',arr:'3:00pm',remarks:''}
    ]},
    siquijor_dumaguete: { title:'Siquijor to Dumaguete', travel:'40m', trips:[
      {dep:'6:00am',vessel:'OJ 388',arr:'6:40am',remarks:''},
      {dep:'10:00am',vessel:'OJ 988',arr:'10:40am',remarks:''},
      {dep:'12:00pm',vessel:'OJ 588',arr:'12:40pm',remarks:''},
      {dep:'6:00pm',vessel:'OJ 788',arr:'6:40pm',remarks:''}
    ]},
    dumaguete_siquijor: { title:'Dumaguete to Siquijor', travel:'40m', trips:[
      {dep:'7:20am',vessel:'OJ 388',arr:'8:00am',remarks:''},
      {dep:'11:00am',vessel:'OJ 988',arr:'11:40am',remarks:''},
      {dep:'1:00pm',vessel:'OJ 588',arr:'1:40pm',remarks:''},
      {dep:'7:10pm',vessel:'OJ 788',arr:'7:50pm',remarks:''}
    ]},
    siquijor_tagbilaran: { title:'Siquijor to Tagbilaran', travel:'2h', trips:[
      {dep:'8:20am',vessel:'OJ 388',arr:'10:20am',remarks:''},
      {dep:'2:30pm',vessel:'OJ 988',arr:'4:30pm',remarks:''}
    ]},
    tagbilaran_siquijor: { title:'Tagbilaran to Siquijor', travel:'2h', trips:[
      {dep:'7:30am',vessel:'OJ 388',arr:'9:30am',remarks:''},
      {dep:'3:20pm',vessel:'OJ 988',arr:'5:20pm',remarks:''}
    ]},
    cebu_getafe: { title:'Cebu to Getafe', travel:'1h', trips:[
      {dep:'6:30AM',vessel:'OJ 10',arr:'7:30AM',remarks:''},
      {dep:'10:00AM',vessel:'OJ 10',arr:'11:00AM',remarks:''},
      {dep:'1:30PM',vessel:'OJ 10',arr:'2:30PM',remarks:''},
      {dep:'5:00PM',vessel:'OJ 10',arr:'6:00PM',remarks:''},
      {dep:'6:45PM',vessel:'OJ 02',arr:'7:45PM',remarks:''}
    ]},
    getafe_cebu: { title:'Getafe to Cebu', travel:'1h 15m', trips:[
      {dep:'6:30am',vessel:'OJ 10',arr:'7:45am',remarks:''},
      {dep:'8:15am',vessel:'OJ 10',arr:'9:30am',remarks:''},
      {dep:'11:45am',vessel:'OJ 10',arr:'1:00pm',remarks:''},
      {dep:'3:15pm',vessel:'OJ 10',arr:'4:30pm',remarks:''},
      {dep:'6:45pm',vessel:'OJ 02',arr:'8:00pm',remarks:''}
    ]},
    cebu_ormoc: { title:'Cebu to Ormoc', travel:'3h', trips:[
      {dep:'6:00AM',vessel:'OJ 8',arr:'9:00AM',remarks:''},
      {dep:'9:30AM',vessel:'OJ 168/OJ 188',arr:'12:30PM',remarks:''},
      {dep:'1:00PM',vessel:'OJ 8',arr:'4:00PM',remarks:''},
      {dep:'4:30PM',vessel:'OJ 168/OJ 188',arr:'7:30PM',remarks:''}
    ]},
    ormoc_cebu: { title:'Ormoc to Cebu', travel:'3h', trips:[
      {dep:'6:00am',vessel:'OJ 8',arr:'9:00am',remarks:''},
      {dep:'9:30am',vessel:'OJ 168/OJ 188',arr:'12:30pm',remarks:''},
      {dep:'1:00pm',vessel:'OJ 8',arr:'4:00pm',remarks:''},
      {dep:'4:30pm',vessel:'OJ 168/OJ 188',arr:'7:30pm',remarks:''}
    ]},
    cebu_palompon: { title:'Cebu to Palompon', travel:'3h', trips:[
      {dep:'10:00AM',vessel:'OJ 02',arr:'1:00PM',remarks:'Kalanggaman connection'},
      {dep:'1:30PM',vessel:'OJ 02',arr:'4:30PM',remarks:'Afternoon service'}
    ]},
    palompon_cebu: { title:'Palompon to Cebu', travel:'3h', trips:[
      {dep:'1:30pm',vessel:'OJ 02',arr:'4:30pm',remarks:''}
    ]},
    cebu_maasin: { title:'Cebu to Maasin', travel:'3h', trips:[
      {dep:'7:00am',vessel:'OJ 03',arr:'10:00am',remarks:''}
    ]},
    maasin_cebu: { title:'Maasin to Cebu', travel:'3h', trips:[
      {dep:'3:30pm',vessel:'OJ 03',arr:'6:30pm',remarks:''}
    ]},
    maasin_surigao: { title:'Maasin to Surigao', travel:'2h', trips:[
      {dep:'10:30am',vessel:'OJ 388',arr:'12:30pm',remarks:''}
    ]},
    surigao_maasin: { title:'Surigao to Maasin', travel:'2h', trips:[
      {dep:'1:00pm',vessel:'OJ 388',arr:'3:00pm',remarks:''}
    ]},
    bacolod_iloilo: { title:'Bacolod to Iloilo', travel:'1h', trips:[
      {dep:'5:45am',vessel:'OJ 388',arr:'6:45am',remarks:''},
      {dep:'8:50am',vessel:'OJ 988',arr:'9:50am',remarks:''},
      {dep:'1:00pm',vessel:'OJ 588',arr:'2:00pm',remarks:''},
      {dep:'4:00pm',vessel:'OJ 788',arr:'5:00pm',remarks:''}
    ]},
    iloilo_bacolod: { title:'Iloilo to Bacolod', travel:'1h', trips:[
      {dep:'7:20am',vessel:'OJ 388',arr:'8:20am',remarks:''},
      {dep:'11:00am',vessel:'OJ 988',arr:'12:00pm',remarks:''},
      {dep:'2:30pm',vessel:'OJ 588',arr:'3:30pm',remarks:''},
      {dep:'5:30pm',vessel:'OJ 788',arr:'6:30pm',remarks:''}
    ]},
    calapan_batangas: { title:'Calapan to Batangas', travel:'1h 10m', trips:[
      {dep:'5:50am',vessel:'OJ 388',arr:'7:00am',remarks:''},
      {dep:'9:20am',vessel:'OJ 988',arr:'10:30am',remarks:''},
      {dep:'12:40pm',vessel:'OJ 588',arr:'1:50pm',remarks:''},
      {dep:'4:00pm',vessel:'OJ 788',arr:'5:10pm',remarks:''}
    ]},
    batangas_calapan: { title:'Batangas to Calapan', travel:'1h 10m', trips:[
      {dep:'7:40am',vessel:'OJ 388',arr:'8:50am',remarks:''},
      {dep:'11:00am',vessel:'OJ 988',arr:'12:10pm',remarks:''},
      {dep:'2:20pm',vessel:'OJ 588',arr:'3:30pm',remarks:''},
      {dep:'5:40pm',vessel:'OJ 788',arr:'6:50pm',remarks:''}
    ]},
    cebu_dumaguete: { title:'Cebu to Dumaguete', travel:'4h 20m', trips:[
      {dep:'5:10AM',vessel:'OJ 388',arr:'9:30AM',remarks:'Via Tagbilaran'},
      {dep:'1:00PM',vessel:'OJ 288',arr:'5:20PM',remarks:'Via Tagbilaran'}
    ]},
    cebu_surigao: { title:'Cebu to Surigao', travel:'5h 30m', trips:[
      {dep:'7:00AM',vessel:'OJ 03',arr:'12:30PM',remarks:'Via Maasin'}
    ]},
    cebu_siquijor: { title:'Cebu to Siquijor', travel:'4h 20m', trips:[
      {dep:'6:00AM',vessel:'OJ 388 (via Tagb)',arr:'10:20AM',remarks:'Through Tagbilaran'},
      {dep:'1:00PM',vessel:'OJ 288 (via Tagb)',arr:'5:20PM',remarks:'Afternoon service'}
    ]}
  },
  stats: { transactions:0, revenue:0, totalKg:0, topRoute:'', routeCounts:{} },
  comps: [],
  creds: { cashier:{u:'cashier',p:'cashier'}, supervisor:{u:'demo',p:'demo'} },
  darkMode: false,
  aiSettings: { apiKey:'', useAI:true, model:'auto', timeoutMs:20000, lastStatus:'Not tested yet', lastModel:'', availableModels:[] }
};

// ── Route Constants ──
const CEBU_BAGGAGE_ROUTES = [
  'cebu_tagbilaran','cebu_ormoc','cebu_getafe','cebu_palompon',
  'cebu_maasin','cebu_dumaguete','cebu_surigao','cebu_siquijor'
];
const CEBU_ROUTE_LABELS = {
  cebu_tagbilaran:'Tagbilaran', cebu_ormoc:'Ormoc', cebu_getafe:'Getafe',
  cebu_palompon:'Palompon', cebu_maasin:'Maasin', cebu_dumaguete:'Dumaguete',
  cebu_surigao:'Surigao', cebu_siquijor:'Siquijor'
};
const FARE_CLASSES = ['TC/OA','BC','ST','MI'];
const FARE_CLASS_LABELS = {'TC/OA':'Tourist/Open Air','BC':'Business Class','ST':'Student','MI':'Minor'};

// ── Connecting Fare Rules ──
const CONNECTING_FARE_RULES = {
  cebu_dumaguete: { via:'Tagbilaran', legs:['cebu_tagbilaran','tagbilaran_dumaguete'] },
  cebu_siquijor: { via:'Tagbilaran', legs:['cebu_tagbilaran','tagbilaran_siquijor'] },
  cebu_surigao:   { via:'Maasin',    legs:['cebu_maasin','maasin_surigao'] }
};
const KNOWN_CONNECTION_PORTS = ['tagbilaran','maasin'];

// ── Map Port Coordinates ──
const PORTS = {
  cebu:[10.2945,123.9056], tagbilaran:[9.6496,123.8547], getafe:[10.1491,124.1586],
  ormoc:[11.0064,124.6075], palompon:[11.0500,124.3840], maasin:[10.1336,124.8440],
  surigao:[9.7843,125.4888], siquijor:[9.2142,123.5150], dumaguete:[9.3068,123.3054],
  bacolod:[10.6765,122.9509], iloilo:[10.7202,122.5621], calapan:[13.4117,121.1803],
  batangas:[13.7565,121.0583]
};
const ROUTE_WAYPOINTS = {
  cebu_dumaguete:['cebu','tagbilaran','dumaguete'],
  cebu_siquijor:['cebu','tagbilaran','siquijor'],
  cebu_surigao:['cebu','maasin','surigao'],
  dumaguete_cebu:['dumaguete','tagbilaran','cebu'],
  siquijor_cebu:['siquijor','tagbilaran','cebu'],
  surigao_cebu:['surigao','maasin','cebu']
};
