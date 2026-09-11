/**
 * Sastra AI Complete Internationalization (i18n) Dictionary
 * Supports 4 languages:
 * - km: ភាសាខ្មែរ (Khmer - Sovereign Default)
 * - en: English
 * - fr: Français (French)
 * - zh: 中文 (Simplified Chinese)
 */

export type Locale = "km" | "en" | "fr" | "zh";

export interface TranslationSchema {
  common: {
    appName: string;
    tagline: string;
    wisdomQuote: string;
    wisdomSub: string;
    loading: string;
    save: string;
    cancel: string;
    close: string;
    delete: string;
    clear: string;
    send: string;
    search: string;
    copy: string;
    copied: string;
    share: string;
    download: string;
    guest: string;
    admin: string;
    member: string;
  };
  nav: {
    home: string;
    history: string;
    bookmarks: string;
    documents: string;
    settings: string;
    newChat: string;
    collapseSidebar: string;
    expandSidebar: string;
    suggestedTopics: string;
    noPastConversations: string;
    clearAll: string;
  };
  topics: {
    angkor: { title: string; sub: string; prompt: string };
    language: { title: string; sub: string; prompt: string };
    history: { title: string; sub: string; prompt: string };
    tech: { title: string; sub: string; prompt: string };
    economy: { title: string; sub: string; prompt: string };
  };
  topbar: {
    directory: string;
    docs: string;
    notifications: string;
    account: string;
    profile: string;
    settingsAndModels: string;
    adminConsole: string;
    signOut: string;
    signIn: string;
    allSystemsNormal: string;
    docsReferenced: string;
  };
  input: {
    placeholder: string;
    shortcuts: string;
    shortcutsHelp: string;
    attachImages: string;
    voiceInput: string;
    stopListening: string;
    sendMessage: string;
    stopGenerating: string;
    clearInput: string;
    slashTitle: string;
  };
  modes: {
    chat: { name: string; desc: string };
    translate: { name: string; desc: string };
    search: { name: string; desc: string };
    code: { name: string; desc: string };
    image: { name: string; desc: string };
  };
  welcome: {
    greeting: string;
    headlineStart: string;
    headlineHighlight: string;
    subtitle: string;
    quickPromptsLabel: string;
    cards: {
      angkor: { badge: string; title: string; subtitle: string; desc: string; prompt: string };
      language: { badge: string; title: string; subtitle: string; desc: string; prompt: string };
      history: { badge: string; title: string; subtitle: string; desc: string; prompt: string };
      tech: { badge: string; title: string; subtitle: string; desc: string; prompt: string };
      economy: { badge: string; title: string; subtitle: string; desc: string; prompt: string };
    };
    pills: {
      popular: { label: string; prompt: string };
      angkor: { label: string; prompt: string };
      laws: { label: string; prompt: string };
      policies: { label: string; prompt: string };
      startup: { label: string; prompt: string };
      python: { label: string; prompt: string };
    };
  };
  settings: {
    title: string;
    tabs: {
      profile: string;
      appearance: string;
      models: string;
      shortcuts: string;
      logs: string;
    };
    languageLabel: string;
    languageDesc: string;
    themeLabel: string;
    fontLabel: string;
    modelLabel: string;
    close: string;
  };
  directory: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allSectors: string;
    noResults: string;
    viewDetails: string;
    close: string;
  };
  documentsModal: {
    title: string;
    subtitle: string;
    noDocs: string;
    upload: string;
    selectForChat: string;
  };
  bookmarksModal: {
    title: string;
    subtitle: string;
    noPins: string;
  };
}

export const TRANSLATIONS: Record<Locale, TranslationSchema> = {
  // ─────────────────────────────────────────────────────────────
  // 🇰🇭 KHMER (DEFAULT SOVEREIGN LANGUAGE)
  // ─────────────────────────────────────────────────────────────
  km: {
    common: {
      appName: "Sastra AI",
      tagline: "ជំនួយការឆ្លាតវៃរបស់អ្នក",
      wisdomQuote: "“ចេះ ឈ្នះ ងងឹត”",
      wisdomSub: "ចំណេះដឹងជាអំណាច",
      loading: "កំពុងដំណើរការ...",
      save: "រក្សាទុក",
      cancel: "បោះបង់",
      close: "បិទ",
      delete: "លុប",
      clear: "សម្អាត",
      send: "ផ្ញើសារ",
      search: "ស្វែងរក",
      copy: "ចម្លង",
      copied: "បានចម្លង!",
      share: "ចែករំលែក",
      download: "ទាញយក",
      guest: "ភ្ញៀវ",
      admin: "រាជអ្នកគ្រប់គ្រង",
      member: "សមាជិកផ្លូវការ",
    },
    nav: {
      home: "ទំព័រដើម",
      history: "ប្រវត្តិសន្ទនា",
      bookmarks: "ចំណាំទុក",
      documents: "ឯកសារយោង",
      settings: "ការកំណត់",
      newChat: "ការសន្ទនាថ្មី",
      collapseSidebar: "បង្រួមរបារចំហៀង (Ctrl+B)",
      expandSidebar: "ពង្រីករបារចំហៀង",
      suggestedTopics: "ប្រធានបទណែនាំ",
      noPastConversations: "មិនទាន់មានប្រវត្តិសន្ទនានៅឡើយទេ",
      clearAll: "លុបទាំងអស់",
    },
    topics: {
      angkor: {
        title: "អំពី អង្គរវត្ត",
        sub: "ស្ថាបត្យកម្ម និងប្រវត្តិសាស្ត្រ",
        prompt: "សូមរៀបរាប់អំពីប្រវត្តិ និងស្ថាបត្យកម្មដ៏អស្ចារ្យនៃប្រាសាទអង្គរវត្ត និងចក្រភពខ្មែរបុរាណ។",
      },
      language: {
        title: "ភាសាខ្មែរ",
        sub: "វេយ្យាករណ៍ និងពាក្យពេចន៍",
        prompt: "សូមបង្រៀនពាក្យគួរសម ឃ្លាសន្ទនាប្រចាំថ្ងៃ និងវេយ្យាករណ៍ភាសាខ្មែរ។",
      },
      history: {
        title: "ប្រវត្តិសាស្ត្រ",
        sub: "សម័យកាលសំខាន់ៗនៃកម្ពុជា",
        prompt: "សូមរៀបរាប់អំពីប្រវត្តិសាស្ត្រប្រទេសកម្ពុជាពីសម័យហ្វូណន ចេនឡា រហូតដល់បច្ចុប្បន្ន។",
      },
      tech: {
        title: "បច្ចេកវិទ្យា",
        sub: "Tech Ecosystem & AI",
        prompt: "តើប្រព័ន្ធអេកូឡូស៊ីបច្ចេកវិទ្យា Tech Startup និង AI នៅកម្ពុជាមានការវិវត្តយ៉ាងណាខ្លះ?",
      },
      economy: {
        title: "សេដ្ឋកិច្ច",
        sub: "បាគង និងសេដ្ឋកិច្ចឌីជីថល",
        prompt: "សូមបង្ហាញអំពីស្ថានភាពសេដ្ឋកិច្ច ប្រព័ន្ធធនាគារឌីជីថល បាគង (Bakong) និងការវិនិយោគនៅកម្ពុជា។",
      },
    },
    topbar: {
      directory: "បញ្ជីឈ្មោះធុរកិច្ច",
      docs: "ឯកសារ",
      notifications: "ការជូនដំណឹង",
      account: "គណនីអ្នកប្រើប្រាស់",
      profile: "ព័ត៌មានគណនី",
      settingsAndModels: "ការកំណត់ & ម៉ាស៊ីន AI",
      adminConsole: "ផ្ទាំងគ្រប់គ្រង (Admin)",
      signOut: "ចាកចេញ",
      signIn: "ចូលប្រើប្រាស់",
      allSystemsNormal: "ប្រព័ន្ធដំណើរការរលូន ១០០% ដោយគ្មានបញ្ហា។",
      docsReferenced: "ឯកសារយោងត្រូវបានជ្រើសរើស",
    },
    input: {
      placeholder: "សួរ Sastra AI ធ្វើកិច្ចការអ្វី ឬវាយ / ស្វែងរក Directory... / Ask anything...",
      shortcuts: "ចុច Enter ដើម្បីផ្ញើ · Shift + Enter ដើម្បីចុះបន្ទាត់ · វាយ / សម្រាប់ផ្លូវកាត់",
      shortcutsHelp: "↑ ↓ ជ្រើសរើស · Enter បញ្ជាក់ · Esc បិទ",
      attachImages: "ភ្ជាប់រូបភាព",
      voiceInput: "បញ្ចូលសំឡេង",
      stopListening: "បញ្ឈប់ការស្តាប់",
      sendMessage: "ផ្ញើសារ (Enter)",
      stopGenerating: "បញ្ឈប់ការបង្កើត",
      clearInput: "សម្អាតប្រអប់អក្សរ",
      slashTitle: "Directory & ផ្លូវកាត់បញ្ជា",
    },
    modes: {
      chat: {
        name: "សន្ទនាទូទៅ",
        desc: "ឆ្លើយសំណួរ ទូទៅ និងការសន្ទនា",
      },
      translate: {
        name: "បកប្រែភាសា",
        desc: "បកប្រែភាសាខ្មែរ ↔ អន្តរជាតិ",
      },
      search: {
        name: "ស្រាវជ្រាវ",
        desc: "ស្វែងរកព័ត៌មាន និង Directory",
      },
      code: {
        name: "សរសេរកូដ",
        desc: "ជំនួយការសរសេរកូដ និង Debug",
      },
      image: {
        name: "បង្កើត & កែរូបភាព",
        desc: "បង្កើតរូបភាព ឬកែប្រែរូបថត",
      },
    },
    welcome: {
      greeting: "សួស្តី",
      headlineStart: "តោះ! ចាប់ផ្តើមស្វែងរក ចំណេះដឹងពី",
      headlineHighlight: "សាស្ត្រា AI",
      subtitle: "ជំនួយការឆ្លើយសំឡេងជាតិខ្មែរ ដោយបច្ចេកវិទ្យា AI ជំនាន់ថ្មី",
      quickPromptsLabel: "សំណួរគំរូពេញនិយម",
      cards: {
        angkor: {
          badge: "បេតិកភណ្ឌ",
          title: "អង្គរវត្ត",
          subtitle: "Angkor Wat",
          desc: "ស្វែងយល់ពីប្រវត្តិសាស្ត្រ សំណង់ និងវប្បធម៌",
          prompt: "សូមរៀបរាប់ និងស្វែងយល់ពីប្រវត្តិសាស្ត្រ បច្ចេកទេសសាងសង់ស្ថាបត្យកម្ម និងតម្លៃវប្បធម៌ដ៏មហិមានៃប្រាសាទអង្គរវត្ត។",
        },
        language: {
          badge: "ភាសាខ្មែរ",
          title: "ភាសាខ្មែរ",
          subtitle: "Khmer Language",
          desc: "រៀនភាសា និងរបៀបប្រើប្រាស់ពាក្យពេចន៍សន្ទនា",
          prompt: "សូមបង្រៀនភាសាខ្មែរ និងរបៀបប្រើប្រាស់ពាក្យពេចន៍សន្ទនាឱ្យបានត្រឹមត្រូវ រួមទាំងពាក្យគួរសម និងការសន្ទនាប្រចាំថ្ងៃ។",
        },
        history: {
          badge: "ប្រវត្តិសាស្ត្រ",
          title: "ប្រវត្តិសាស្ត្រខ្មែរ",
          subtitle: "Khmer History",
          desc: "ស្វែងយល់ពីប្រវត្តិសាស្ត្រ និងអរិយធម៌",
          prompt: "សូមរៀបរាប់ និងស្វែងយល់ពីប្រវត្តិសាស្ត្រខ្មែរ និងការរីកចម្រើននៃអរិយធម៌ខ្មែរ តាមសម័យកាលសំខាន់ៗពីអតីតកាលរហូតដល់បច្ចុប្បន្ន។",
        },
        tech: {
          badge: "បច្ចេកវិទ្យា",
          title: "បច្ចេកវិទ្យា",
          subtitle: "Technology",
          desc: "សិក្សា និងស្វែងរកគំនិត បច្ចេកវិទ្យាទំនើប",
          prompt: "សូមណែនាំ និងពន្យល់ពីគំនិតបច្ចេកវិទ្យាទំនើបៗនាពេលបច្ចុប្បន្ន ដូចជា AI, Cloud Computing និងការបង្កើតកម្មវិធីឌីជីថលថ្មីៗ។",
        },
        economy: {
          badge: "សេដ្ឋកិច្ច",
          title: "សេដ្ឋកិច្ច",
          subtitle: "Economy",
          desc: "វិភាគ និងស្វែងយល់ពី សេដ្ឋកិច្ចកម្ពុជា",
          prompt: "សូមវិភាគ និងពន្យល់ពីស្ថានភាពសេដ្ឋកិច្ចកម្ពុជា វិស័យសក្តានុពលសំខាន់ៗ និងការអភិវឌ្ឍសេដ្ឋកិច្ចឌីជីថលនាពេលបច្ចុប្បន្ន។",
        },
      },
      pills: {
        popular: {
          label: "ផ្តល់សំណូមពរនិយម",
          prompt: "សូមណែនាំមុខងារ និងគន្លឹះសំខាន់ៗដែលអ្នកប្រើប្រាស់និយមសួរច្រើនជាងគេក្នុង Sastra AI។",
        },
        angkor: {
          label: "ប្រាសាទអង្គរវត្ត",
          prompt: "សូមរៀបរាប់អំពីប្រវត្តិប្រាសាទអង្គរវត្ត និងបច្ចេកទេសស្ថាបត្យកម្មដ៏អស្ចារ្យ។",
        },
        laws: {
          label: "ច្បាប់សំខាន់ៗ",
          prompt: "សូមសង្ខេបច្បាប់ស្តីពីការវិនិយោគ និងក្រមការងារនៃព្រះរាជាណាចក្រកម្ពុជា។",
        },
        policies: {
          label: "ច្បាប់ និងគោលនយោបាយ",
          prompt: "តើក្របខ័ណ្ឌគោលនយោបាយសេដ្ឋកិច្ច និងសង្គមឌីជីថលកម្ពុជា ២០២១-២០៣៥ មានទិសដៅសំខាន់អ្វីខ្លះ?",
        },
        startup: {
          label: "Startup នៅកម្ពុជា",
          prompt: "តើប្រព័ន្ធអេកូឡូស៊ី Tech Startup នៅភ្នំពេញបច្ចុប្បន្នមានឱកាស និងបញ្ហាប្រឈមអ្វីខ្លះ?",
        },
        python: {
          label: "Python & FastAPI",
          prompt: "សូមបង្ហាញកូដគំរូ FastAPI សម្រាប់បង្កើត Streaming Chatbot API ជាមួយ Python Asyncio។",
        },
      },
    },
    settings: {
      title: "ការកំណត់ប្រព័ន្ធ",
      tabs: {
        profile: "គណនី",
        appearance: "រូបរាង",
        models: "ម៉ាស៊ីន AI",
        shortcuts: "ផ្លូវកាត់",
        logs: "កំណត់ត្រា",
      },
      languageLabel: "ភាសាឆ្លើយតប និងទម្រង់ប្រព័ន្ធ",
      languageDesc: "ជ្រើសរើសភាសាសម្រាប់កម្មវិធី និងការឆ្លើយតបរបស់ AI",
      themeLabel: "ស្បែកពណ៌",
      fontLabel: "ពុម្ពអក្សរខ្មែរ",
      modelLabel: "ម៉ូដែលបញ្ញាសិប្បនិម្មិត (AI Model)",
      close: "បិទ",
    },
    directory: {
      title: "បញ្ជីឈ្មោះធុរកិច្ច & ស្ថាប័នកម្ពុជា",
      subtitle: "ស្វែងរកធុរកិច្ច ធនាគារ និងស្ថាប័នបច្ចេកវិទ្យាកម្ពុជា",
      searchPlaceholder: "ស្វែងរកឈ្មោះក្រុមហ៊ុន ស្ថាប័ន ឬវិស័យ...",
      allSectors: "គ្រប់វិស័យទាំងអស់",
      noResults: "រកមិនឃើញទិន្នន័យដែលផ្គូផ្គងទេ",
      viewDetails: "មើលព័ត៌មានលម្អិត",
      close: "បិទ",
    },
    documentsModal: {
      title: "ឯកសារយោង RAG",
      subtitle: "គ្រប់គ្រងឯកសារសម្រាប់ភ្ជាប់ជាមួយសំណួរ AI",
      noDocs: "មិនទាន់មានឯកសារនៅឡើយទេ",
      upload: "ផ្ទុកឡើងឯកសារថ្មី",
      selectForChat: "ជ្រើសរើសសម្រាប់ Chat",
    },
    bookmarksModal: {
      title: "សារដែលបានចំណាំ",
      subtitle: "សារសំខាន់ៗដែលអ្នកបានរក្សាទុក",
      noPins: "មិនទាន់មានសារចំណាំនៅឡើយទេ",
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 🇬🇧 ENGLISH
  // ─────────────────────────────────────────────────────────────
  en: {
    common: {
      appName: "Sastra AI",
      tagline: "Cambodia's Sovereign AI Assistant",
      wisdomQuote: "“Knowledge is Power”",
      wisdomSub: "Bridging ancient wisdom with modern intelligence",
      loading: "Processing...",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      delete: "Delete",
      clear: "Clear",
      send: "Send message",
      search: "Search",
      copy: "Copy",
      copied: "Copied!",
      share: "Share",
      download: "Download",
      guest: "Guest",
      admin: "Royal Administrator",
      member: "Verified Member",
    },
    nav: {
      home: "Home",
      history: "History",
      bookmarks: "Bookmarks",
      documents: "Documents",
      settings: "Settings",
      newChat: "New Chat",
      collapseSidebar: "Collapse sidebar (Ctrl+B)",
      expandSidebar: "Expand sidebar",
      suggestedTopics: "Suggested Topics",
      noPastConversations: "No past conversations yet",
      clearAll: "Clear All",
    },
    topics: {
      angkor: {
        title: "About Angkor Wat",
        sub: "Architecture & Royal Heritage",
        prompt: "Please provide a comprehensive historical and architectural overview of Angkor Wat and the ancient Khmer Empire.",
      },
      language: {
        title: "Khmer Language",
        sub: "Grammar, Phrases & Registers",
        prompt: "Please teach essential Khmer polite phrases, daily conversational sentences, and grammatical rules.",
      },
      history: {
        title: "Khmer History",
        sub: "Key Eras of Cambodia",
        prompt: "Please summarize Cambodian history across major periods from Funan and Chenla to the modern era.",
      },
      tech: {
        title: "Technology in Cambodia",
        sub: "Tech Ecosystem & AI",
        prompt: "What is the current state and growth trajectory of Cambodia's tech startups, digital economy, and AI adoption?",
      },
      economy: {
        title: "Cambodia Economy",
        sub: "Bakong & Digital Finance",
        prompt: "Explain Cambodia's economic landscape, key growth drivers, and the impact of the National Bank Bakong digital currency.",
      },
    },
    topbar: {
      directory: "Directory",
      docs: "Documents",
      notifications: "Notifications",
      account: "User Account",
      profile: "User Profile",
      settingsAndModels: "Settings & AI Models",
      adminConsole: "Admin Console",
      signOut: "Sign Out",
      signIn: "Sign In",
      allSystemsNormal: "All systems operating smoothly at 100% health.",
      docsReferenced: "Documents Referenced",
    },
    input: {
      placeholder: "Ask Sastra AI anything or type / to search Directory...",
      shortcuts: "Enter to send · Shift + Enter for new line · Type / for shortcuts",
      shortcutsHelp: "↑ ↓ navigate · Enter select · Esc close",
      attachImages: "Attach images",
      voiceInput: "Voice input",
      stopListening: "Stop listening",
      sendMessage: "Send message (Enter)",
      stopGenerating: "Stop generating",
      clearInput: "Clear input",
      slashTitle: "Directory & Slash Shortcuts",
    },
    modes: {
      chat: {
        name: "Chat",
        desc: "General questions and natural conversations",
      },
      translate: {
        name: "Translate",
        desc: "Multilingual translation between Khmer and global languages",
      },
      search: {
        name: "Search",
        desc: "Factual search across live web and Cambodian ecosystem",
      },
      code: {
        name: "Code",
        desc: "Software engineering, debugging, and code architecture",
      },
      image: {
        name: "Image & Art",
        desc: "Generate culturally rich visuals or edit photos",
      },
    },
    welcome: {
      greeting: "Hello",
      headlineStart: "Discover Knowledge with",
      headlineHighlight: "Sastra AI",
      subtitle: "Cambodia's sovereign intelligence, driven by next-generation AI",
      quickPromptsLabel: "Popular Prompts",
      cards: {
        angkor: {
          badge: "Heritage",
          title: "Angkor Wat",
          subtitle: "World Heritage",
          desc: "Explore history, architecture, and cultural heritage",
          prompt: "Please provide a comprehensive overview of the history, architectural achievements, and cultural significance of Angkor Wat.",
        },
        language: {
          badge: "Language",
          title: "Khmer Language",
          subtitle: "Linguistics & Phrases",
          desc: "Learn grammar, conversation, and polite expressions",
          prompt: "Please teach me essential Khmer phrases, grammar nuances, and polite conversational expressions.",
        },
        history: {
          badge: "History",
          title: "Khmer History",
          subtitle: "Civilization & Eras",
          desc: "Discover centuries of civilizations and pivotal eras",
          prompt: "Please describe key milestones in Cambodian history and civilization from ancient empires to the modern era.",
        },
        tech: {
          badge: "Technology",
          title: "Modern Tech",
          subtitle: "AI, Cloud & Code",
          desc: "Explore emerging tech trends and digital innovations",
          prompt: "Explain modern tech concepts such as AI, Cloud Computing, and cutting-edge software architecture in clear detail.",
        },
        economy: {
          badge: "Economy",
          title: "Economy & Markets",
          subtitle: "Growth & Trade",
          desc: "Analyze economic trends, trade, and digital transformation",
          prompt: "Analyze Cambodia's economic landscape, key growth sectors, and ongoing digital economy initiatives.",
        },
      },
      pills: {
        popular: {
          label: "Popular Inquiries",
          prompt: "Recommend the most popular questions and capabilities available in Sastra AI.",
        },
        angkor: {
          label: "Angkor Wat Temple",
          prompt: "Explain the history of Angkor Wat and its revolutionary ancient engineering techniques.",
        },
        laws: {
          label: "Investment & Labor Law",
          prompt: "Summarize the key provisions of Cambodia's Investment Law and Labor Code.",
        },
        policies: {
          label: "Digital Economy Policy",
          prompt: "What are the primary goals of Cambodia's Digital Economy and Social Policy Framework 2021-2035?",
        },
        startup: {
          label: "Tech Startups in Phnom Penh",
          prompt: "What are the opportunities and challenges facing tech startups in Phnom Penh today?",
        },
        python: {
          label: "Python & FastAPI",
          prompt: "Provide a clean FastAPI sample implementation for a streaming chatbot API using Python Asyncio.",
        },
      },
    },
    settings: {
      title: "Settings",
      tabs: {
        profile: "Profile",
        appearance: "Appearance",
        models: "AI Models",
        shortcuts: "Shortcuts",
        logs: "Logs",
      },
      languageLabel: "Response & Interface Language",
      languageDesc: "Select the language for the user interface and AI responses",
      themeLabel: "Theme",
      fontLabel: "Khmer Typography",
      modelLabel: "Artificial Intelligence Model",
      close: "Close",
    },
    directory: {
      title: "Cambodia Tech & Business Directory",
      subtitle: "Explore verified businesses, banks, and technology organizations",
      searchPlaceholder: "Search by company name, sector, or keyword...",
      allSectors: "All Sectors",
      noResults: "No matching directory records found",
      viewDetails: "View Details",
      close: "Close",
    },
    documentsModal: {
      title: "RAG Reference Documents",
      subtitle: "Manage uploaded documents for contextual AI reasoning",
      noDocs: "No documents uploaded yet",
      upload: "Upload Document",
      selectForChat: "Select for Chat",
    },
    bookmarksModal: {
      title: "Bookmarked Messages",
      subtitle: "Your saved insights and pinned turns",
      noPins: "No pinned messages yet",
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 🇫🇷 FRANÇAIS (FRENCH)
  // ─────────────────────────────────────────────────────────────
  fr: {
    common: {
      appName: "Sastra AI",
      tagline: "Assistant IA souverain du Cambodge",
      wisdomQuote: "« Le Savoir est une Force »",
      wisdomSub: "Relier la sagesse ancestrale à l'intelligence moderne",
      loading: "Traitement en cours...",
      save: "Enregistrer",
      cancel: "Annuler",
      close: "Fermer",
      delete: "Supprimer",
      clear: "Effacer",
      send: "Envoyer le message",
      search: "Rechercher",
      copy: "Copier",
      copied: "Copié !",
      share: "Partager",
      download: "Télécharger",
      guest: "Invité",
      admin: "Administrateur Royal",
      member: "Membre Vérifié",
    },
    nav: {
      home: "Accueil",
      history: "Historique",
      bookmarks: "Signets",
      documents: "Documents",
      settings: "Paramètres",
      newChat: "Nouvelle discussion",
      collapseSidebar: "Réduire la barre latérale (Ctrl+B)",
      expandSidebar: "Agrandir la barre latérale",
      suggestedTopics: "Sujets suggérés",
      noPastConversations: "Aucune discussion précédente",
      clearAll: "Tout effacer",
    },
    topics: {
      angkor: {
        title: "À propos d'Angkor Vat",
        sub: "Architecture et patrimoine royal",
        prompt: "Veuillez fournir un aperçu historique et architectural complet d'Angkor Vat et de l'ancien Empire khmer.",
      },
      language: {
        title: "Langue khmère",
        sub: "Grammaire, phrases et politesse",
        prompt: "Veuillez enseigner les formules de politesse essentielles, les expressions usuelles et les règles de grammaire khmère.",
      },
      history: {
        title: "Histoire du Cambodge",
        sub: "Grandes époques historiques",
        prompt: "Veuillez résumer l'histoire du Cambodge à travers ses grandes époques, du Fou-nan et Chenla jusqu'à l'ère contemporaine.",
      },
      tech: {
        title: "Technologie au Cambodge",
        sub: "Écosystème technologique et IA",
        prompt: "Quelle est la situation actuelle et la trajectoire de croissance des startups technologiques et de l'IA au Cambodge ?",
      },
      economy: {
        title: "Économie du Cambodge",
        sub: "Système Bakong et finance digitale",
        prompt: "Expliquez le paysage économique du Cambodge, ses moteurs de croissance et l'impact de la monnaie numérique Bakong.",
      },
    },
    topbar: {
      directory: "Annuaire",
      docs: "Documents",
      notifications: "Notifications",
      account: "Compte utilisateur",
      profile: "Profil utilisateur",
      settingsAndModels: "Paramètres et Modèles IA",
      adminConsole: "Console d'administration",
      signOut: "Se déconnecter",
      signIn: "Se connecter",
      allSystemsNormal: "Tous les systèmes fonctionnent de manière optimale à 100%.",
      docsReferenced: "Documents référencés",
    },
    input: {
      placeholder: "Demandez à Sastra AI ou tapez / pour explorer l'annuaire...",
      shortcuts: "Entrée pour envoyer · Maj + Entrée pour un saut de ligne · Tapez / pour les raccourcis",
      shortcutsHelp: "↑ ↓ naviguer · Entrée sélectionner · Échap fermer",
      attachImages: "Joindre des images",
      voiceInput: "Saisie vocale",
      stopListening: "Arrêter l'écoute",
      sendMessage: "Envoyer le message (Entrée)",
      stopGenerating: "Arrêter la génération",
      clearInput: "Effacer la saisie",
      slashTitle: "Annuaire et raccourcis de commande",
    },
    modes: {
      chat: {
        name: "Discussion",
        desc: "Questions générales et conversations naturelles",
      },
      translate: {
        name: "Traduction",
        desc: "Traduction multilingue entre le khmer et les langues du monde",
      },
      search: {
        name: "Recherche",
        desc: "Recherche factuelle sur le web et les données du Cambodge",
      },
      code: {
        name: "Code",
        desc: "Ingénierie logicielle, débogage et architectures",
      },
      image: {
        name: "Image & Art",
        desc: "Créer des illustrations culturelles ou retoucher des photos",
      },
    },
    welcome: {
      greeting: "Bonjour",
      headlineStart: "Explorez le Savoir avec",
      headlineHighlight: "Sastra AI",
      subtitle: "L'intelligence souveraine du Cambodge propulsée par l'IA de nouvelle génération",
      quickPromptsLabel: "Requêtes populaires",
      cards: {
        angkor: {
          badge: "Patrimoine",
          title: "Angkor Vat",
          subtitle: "Patrimoine Mondial",
          desc: "Découvrez l'histoire, l'architecture et le patrimoine culturel",
          prompt: "Veuillez décrire en détail l'histoire, les prouesses architecturales et la valeur culturelle du temple d'Angkor Vat.",
        },
        language: {
          badge: "Langue",
          title: "Langue Khmère",
          subtitle: "Linguistique & Dialogues",
          desc: "Apprenez le vocabulaire, la grammaire et la politesse",
          prompt: "Enseignez-moi les bases de la langue khmère, les expressions de politesse et les phrases de conversation courante.",
        },
        history: {
          badge: "Histoire",
          title: "Histoire Khmère",
          subtitle: "Civilisation & Époques",
          desc: "Explorez des siècles de civilisation et d'histoire",
          prompt: "Veuillez retracer les grandes périodes de l'histoire et de la civilisation khmère de l'antiquité à nos jours.",
        },
        tech: {
          badge: "Technologie",
          title: "Technologies",
          subtitle: "IA, Cloud & Code",
          desc: "Explorez les innovations numériques et les tendances de l'IA",
          prompt: "Expliquez les technologies modernes comme l'IA, le Cloud et le développement de logiciels innovants.",
        },
        economy: {
          badge: "Économie",
          title: "Économie & Marchés",
          subtitle: "Croissance & Commerce",
          desc: "Analysez les dynamiques économiques et la transformation numérique",
          prompt: "Analysez la situation économique du Cambodge, les secteurs clés de croissance et le développement du numérique.",
        },
      },
      pills: {
        popular: {
          label: "Requêtes populaires",
          prompt: "Recommandez les questions les plus fréquemment posées et les capacités clés de Sastra AI.",
        },
        angkor: {
          label: "Temple d'Angkor Vat",
          prompt: "Décrivez l'histoire d'Angkor Vat et ses prouesses d'ingénierie hydraulique et architecturale.",
        },
        laws: {
          label: "Droit des investissements",
          prompt: "Résumez les principales dispositions de la Loi sur les investissements et du Code du travail au Cambodge.",
        },
        policies: {
          label: "Politique d'économie numérique",
          prompt: "Quels sont les objectifs clés du Cadre de politique pour l'économie et la société numériques du Cambodge 2021-2035 ?",
        },
        startup: {
          label: "Startups à Phnom Penh",
          prompt: "Quelles sont les opportunités et les défis auxquels font face les startups technologiques à Phnom Penh aujourd'hui ?",
        },
        python: {
          label: "Python & FastAPI",
          prompt: "Donnez un exemple élégant d'API de chatbot en streaming avec FastAPI et Python Asyncio.",
        },
      },
    },
    settings: {
      title: "Paramètres",
      tabs: {
        profile: "Profil",
        appearance: "Apparence",
        models: "Modèles IA",
        shortcuts: "Raccourcis",
        logs: "Journaux",
      },
      languageLabel: "Langue de l'interface et des réponses",
      languageDesc: "Sélectionnez la langue de l'application et des réponses de l'IA",
      themeLabel: "Thème",
      fontLabel: "Typographie khmère",
      modelLabel: "Modèle d'Intelligence Artificielle",
      close: "Fermer",
    },
    directory: {
      title: "Annuaire technologique et commercial du Cambodge",
      subtitle: "Explorez les entreprises, institutions bancaires et acteurs du numérique",
      searchPlaceholder: "Rechercher par nom d'entreprise, secteur ou mot-clé...",
      allSectors: "Tous les secteurs",
      noResults: "Aucun résultat trouvé",
      viewDetails: "Voir les détails",
      close: "Fermer",
    },
    documentsModal: {
      title: "Documents de référence RAG",
      subtitle: "Gérez vos documents importés pour enrichir les réponses de l'IA",
      noDocs: "Aucun document importé pour l'instant",
      upload: "Importer un document",
      selectForChat: "Sélectionner pour la discussion",
    },
    bookmarksModal: {
      title: "Messages enregistrés",
      subtitle: "Vos réflexions et réponses favorites",
      noPins: "Aucun message épinglé pour le moment",
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 🇨🇳 中文 (SIMPLIFIED CHINESE)
  // ─────────────────────────────────────────────────────────────
  zh: {
    common: {
      appName: "Sastra AI",
      tagline: "柬埔寨主权人工智能助手",
      wisdomQuote: "“知识就是力量”",
      wisdomSub: "融合千年古老智慧与现代前沿智能",
      loading: "正在处理中...",
      save: "保存",
      cancel: "取消",
      close: "关闭",
      delete: "删除",
      clear: "清空",
      send: "发送消息",
      search: "搜索",
      copy: "复制",
      copied: "已复制！",
      share: "分享",
      download: "下载",
      guest: "访客",
      admin: "皇家管理员",
      member: "认证用户",
    },
    nav: {
      home: "首页",
      history: "历史记录",
      bookmarks: "我的书签",
      documents: "知识库文档",
      settings: "系统设置",
      newChat: "新建对话",
      collapseSidebar: "收起侧边栏 (Ctrl+B)",
      expandSidebar: "展开侧边栏",
      suggestedTopics: "推荐探索主题",
      noPastConversations: "暂无历史对话记录",
      clearAll: "清空所有记录",
    },
    topics: {
      angkor: {
        title: "关于吴哥窟",
        sub: "古代高棉帝国与建筑艺术",
        prompt: "请详细介绍吴哥窟的建造历史、宏伟的建筑工艺以及古代高棉帝国的灿烂文明。",
      },
      language: {
        title: "高棉语学习",
        sub: "日常会话、发音与语法",
        prompt: "请系统讲解柬埔寨高棉语的基础语法、日常礼貌用语及实用对话句型。",
      },
      history: {
        title: "高棉历史长河",
        sub: "柬埔寨各大历史演变时期",
        prompt: "请梳理柬埔寨从扶南、真腊、吴哥帝国直至现代各时期的重要历史进程与文明发展。",
      },
      tech: {
        title: "柬埔寨科技生态",
        sub: "科技创投与人工智能创新",
        prompt: "请介绍柬埔寨当前的科技创业生态圈、数字经济政策以及人工智能技术的发展现状。",
      },
      economy: {
        title: "柬埔寨经济与金融",
        sub: "Bakong 央行数字系统与投资",
        prompt: "请分析柬埔寨当前的宏观经济形势、主要增长支柱产业以及国家银行 Bakong 数字支付系统的应用前景。",
      },
    },
    topbar: {
      directory: "机构名录",
      docs: "参考文档",
      notifications: "系统通知",
      account: "用户账户",
      profile: "个人资料",
      settingsAndModels: "系统设置与 AI 模型",
      adminConsole: "管理后台",
      signOut: "退出登录",
      signIn: "登录系统",
      allSystemsNormal: "系统所有服务均运行平稳，健康度 100%。",
      docsReferenced: "篇参考文档已选用",
    },
    input: {
      placeholder: "向 Sastra AI 提问任何内容，或输入 / 快速检索生态名录...",
      shortcuts: "按 Enter 发送 · Shift + Enter 换行 · 输入 / 触发快捷菜单",
      shortcutsHelp: "↑ ↓ 导航 · Enter 选择 · Esc 关闭",
      attachImages: "上传图片",
      voiceInput: "语音输入",
      stopListening: "停止录音",
      sendMessage: "发送消息 (Enter)",
      stopGenerating: "停止生成",
      clearInput: "清空输入框",
      slashTitle: "名录检索与快捷指令",
    },
    modes: {
      chat: {
        name: "通用对话",
        desc: "日常交流、智能解答与多轮问答",
      },
      translate: {
        name: "精准翻译",
        desc: "柬埔寨高棉语与全球多语言互译",
      },
      search: {
        name: "深度检索",
        desc: "联网搜索真实世界资讯与柬埔寨本土数据库",
      },
      code: {
        name: "代码编写",
        desc: "专业软件工程开发、Debug 与架构设计",
      },
      image: {
        name: "图像与艺术",
        desc: "生成具有高棉文化底蕴的艺术图像或编辑照片",
      },
    },
    welcome: {
      greeting: "您好",
      headlineStart: "与 Sastra AI 一起探索",
      headlineHighlight: "高棉主权智能",
      subtitle: "融合古代神圣智慧与下一代生成式 AI 的主权智能助手",
      quickPromptsLabel: "热门快捷提问",
      cards: {
        angkor: {
          badge: "文化遗产",
          title: "吴哥窟",
          subtitle: "世界文化遗产",
          desc: "探索吴哥窟的历史、宏伟建筑与高棉文化",
          prompt: "请详细介绍吴哥窟的历史渊源、建筑艺术特点以及高棉文明的深厚文化底蕴。",
        },
        language: {
          badge: "高棉语言",
          title: "高棉语学习",
          subtitle: "日常会话与语法",
          desc: "学习高棉语日常词汇、礼貌用语及句型表达",
          prompt: "请系统讲解高棉语日常会话基础、发音要领和常用礼貌用语。",
        },
        history: {
          badge: "高棉历史",
          title: "柬埔寨历史",
          subtitle: "文明与时代演变",
          desc: "了解千年来高棉文明的辉煌历程与重大历史时期",
          prompt: "请全面梳理柬埔寨从古代高棉帝国到现代社会的重要历史进程与文化演进。",
        },
        tech: {
          badge: "前沿科技",
          title: "现代科技",
          subtitle: "人工智能与云技术",
          desc: "探讨人工智能、云计算与前沿数字技术应用",
          prompt: "请深入浅出地讲解当今前沿科技趋势，包括AI人工智能、云计算和现代软件架构。",
        },
        economy: {
          badge: "经济动态",
          title: "柬埔寨经济",
          subtitle: "产业发展与数字转型",
          desc: "分析柬埔寨经济发展态势、主要增长支柱与数字经济",
          prompt: "请深入分析柬埔寨当前经济形势、主要投资驱动力以及数字经济转型前景。",
        },
      },
      pills: {
        popular: {
          label: "热门功能推荐",
          prompt: "请推荐 Sastra AI 用户最常使用的核心功能与热门提问方向。",
        },
        angkor: {
          label: "吴哥窟的建造奇迹",
          prompt: "请讲解吴哥窟在古代水利工程与石雕建筑学上的非凡成就。",
        },
        laws: {
          label: "投资法与劳动法",
          prompt: "请简要概括柬埔寨《新投资法》及《劳动法》的核心要点与外资优惠政策。",
        },
        policies: {
          label: "数字经济发展框架",
          prompt: "柬埔寨《2021-2035年数字经济与数字社会政策框架》的主要战略目标是什么？",
        },
        startup: {
          label: "金边科技创投机会",
          prompt: "当前金边的科技创业生态（Tech Startups）面临哪些主要机遇与发展挑战？",
        },
        python: {
          label: "FastAPI 流式接口示例",
          prompt: "请提供一段使用 Python Asyncio 和 FastAPI 编写的流式（Streaming）对话接口示例代码。",
        },
      },
    },
    settings: {
      title: "系统设置",
      tabs: {
        profile: "个人信息",
        appearance: "界面外观",
        models: "AI 模型",
        shortcuts: "快捷键",
        logs: "系统日志",
      },
      languageLabel: "系统语言与 AI 回复语言",
      languageDesc: "选择整个应用界面的展示语言及 AI 的主要回复语言",
      themeLabel: "主题模式",
      fontLabel: "高棉字体样式",
      modelLabel: "人工智能大语言模型 (AI Model)",
      close: "关闭",
    },
    directory: {
      title: "柬埔寨科技与商业生态名录",
      subtitle: "检索经官方认证的柬埔寨企业、银行机构与科技创新组织",
      searchPlaceholder: "输入公司名称、行业板块或关键词搜索...",
      allSectors: "所有行业板块",
      noResults: "未找到符合条件的机构或企业",
      viewDetails: "查看机构详情",
      close: "关闭",
    },
    documentsModal: {
      title: "RAG 知识库文档",
      subtitle: "管理供 AI 检索与阅读的背景知识文档",
      noDocs: "知识库中暂无文档",
      upload: "上传新文档",
      selectForChat: "勾选参与对话问答",
    },
    bookmarksModal: {
      title: "已收藏的消息",
      subtitle: "您在对话中标记保存的重要见解与回复",
      noPins: "暂无收藏的消息",
    },
  },
};
