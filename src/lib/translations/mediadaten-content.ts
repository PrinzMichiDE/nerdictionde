/**
 * Complete translations for the Mediadaten page in 15 languages
 */

export interface MediadatenTranslations {
  // Metadata
  meta: {
    title: string;
    description: string;
  };
  // Header
  header: {
    title: string;
    subtitle: string;
    backToHome: string;
  };
  // Notice
  notice: {
    title: string;
    description: string;
    futureNote: string;
    cooperationLink: string;
  };
  // Update notice
  updateNotice: {
    monthlyUpdate: string;
    lastUpdated: string;
  };
  // Key metrics
  keyMetrics: {
    title: string;
    subtitle: string;
    monthlyVisitors: string;
    pageViews: string;
    sessionDuration: string;
    bounceRate: string;
    activeUsers: string;
    perMonth: string;
    average: string;
    lowBounceRate: string;
  };
  // Detailed metrics
  detailedMetrics: {
    title: string;
    subtitle: string;
    pagesPerVisit: string;
    newVisitors: string;
    returningVisitors: string;
    reviewReadTime: string;
    firstTimeVisitors: string;
    loyalReadership: string;
  };
  // Device & Geography
  deviceGeography: {
    title: string;
    subtitle: string;
    mobileTraffic: string;
    desktopTraffic: string;
    topCountry: string;
    smartphoneTablet: string;
    pcLaptop: string;
    mainOriginCountry: string;
    primaryAudience: string;
  };
  // Target audience
  targetAudience: {
    title: string;
    subtitle: string;
    demographics: string;
    demographicsDesc: string;
    interests: string;
    interestsDesc: string;
    age: string;
    genderDistribution: string;
    male: string;
    female: string;
  };
  // Advertising formats
  advertising: {
    title: string;
    subtitle: string;
    display: string;
    displayDesc: string;
    sponsoredContent: string;
    sponsoredContentDesc: string;
    newsletter: string;
    newsletterDesc: string;
    video: string;
    videoDesc: string;
    socialMedia: string;
    socialMediaDesc: string;
    events: string;
    eventsDesc: string;
    currentlyNotAvailable: string;
    responsiveFormats: string;
    productPlacements: string;
    dedicatedEmails: string;
    productAnnouncements: string;
    eventPromotion: string;
    preRollVideos: string;
    midRollPlacements: string;
    podcastSponsoring: string;
    videoIntegration: string;
    socialMediaPosts: string;
    storyPlacements: string;
    influencerCooperations: string;
    communityEngagement: string;
    eventSponsoring: string;
    productLaunches: string;
    exclusiveCooperations: string;
    brandPartnerships: string;
  };
  // Content & Editorial
  content: {
    title: string;
    subtitle: string;
    strengths: string;
    professionalReviews: string;
    professionalReviewsDesc: string;
    currentTrends: string;
    currentTrendsDesc: string;
    engagedCommunity: string;
    engagedCommunityDesc: string;
    dataDrivenInsights: string;
    dataDrivenInsightsDesc: string;
  };
  // Contact
  contact: {
    title: string;
    subtitle: string;
    cooperationContact: string;
    cooperationContactDesc: string;
    email: string;
    forGames: string;
    topics: string;
    topicsList: string;
    note: string;
    noteText: string;
    cooperationPage: string;
  };
  // Technical specs
  technical: {
    title: string;
    adMaterialRequirements: string;
    bannerFormats: string;
    videoFormats: string;
    maxFileSize: string;
    animations: string;
    preferredFormats: string;
    resolution: string;
    codec: string;
  };
  // Disclaimer
  disclaimer: {
    text: string;
    lastUpdated: string;
  };
}

export const mediadatenTranslations: Record<string, MediadatenTranslations> = {
  de: {
    meta: {
      title: "Mediadaten | Nerdiction",
      description: "Mediadaten und Werbeinformationen für Werbepartner und Kooperationspartner",
    },
    header: {
      title: "Mediadaten",
      subtitle: "Informationen zu unserer Reichweite und Zielgruppe",
      backToHome: "Zurück zur Startseite",
    },
    notice: {
      title: "Aktuell keine Werbeflächen verfügbar",
      description: "Wir bieten aktuell keine Werbeflächen an. Wir wollen unabhängig bleiben und unsere Nutzer nicht mit Werbung nerven! Unsere Inhalte werden ohne Banner, Pop-ups oder störende Werbeformate präsentiert.",
      futureNote: "Falls sich dies in Zukunft ändert, werden wir es transparent kommunizieren. Für Kooperationen im Bereich Produkttests und Reviews besuche unsere",
      cooperationLink: "Kooperationsseite",
    },
    updateNotice: {
      monthlyUpdate: "Monatliche Aktualisierung:",
      lastUpdated: "Alle Daten werden monatlich aktualisiert. Stand:",
    },
    keyMetrics: {
      title: "Kernmetriken",
      subtitle: "Wichtige Kennzahlen zu unserer Reichweite und Engagement",
      monthlyVisitors: "Monatliche Besucher",
      pageViews: "Seitenaufrufe",
      sessionDuration: "Verweildauer",
      bounceRate: "Bounce Rate",
      activeUsers: "Aktive Nutzer",
      perMonth: "Pro Monat",
      average: "Durchschnittlich",
      lowBounceRate: "Niedrige Absprungrate",
    },
    detailedMetrics: {
      title: "Detaillierte Metriken",
      subtitle: "Weitere Einblicke in das Nutzerverhalten und die Reichweite",
      pagesPerVisit: "Seiten pro Besuch",
      newVisitors: "Neue Besucher",
      returningVisitors: "Wiederkehrende Besucher",
      reviewReadTime: "Review-Lesezeit",
      firstTimeVisitors: "Erstbesucher",
      loyalReadership: "Loyale Leserschaft",
    },
    deviceGeography: {
      title: "Geräte & Geografie",
      subtitle: "Verteilung nach Gerätetyp und geografischer Herkunft",
      mobileTraffic: "Mobile Traffic",
      desktopTraffic: "Desktop Traffic",
      topCountry: "Top Land",
      smartphoneTablet: "Smartphone & Tablet",
      pcLaptop: "PC & Laptop",
      mainOriginCountry: "Hauptherkunftsland",
      primaryAudience: "Primäre Zielgruppe",
    },
    targetAudience: {
      title: "Zielgruppe",
      subtitle: "Unsere Leserschaft besteht aus technikaffinen Enthusiasten und Gaming-Interessierten",
      demographics: "Demografie",
      demographicsDesc: "Altersstruktur und Geschlechterverteilung",
      interests: "Interessen",
      interestsDesc: "Hauptinteressensgebiete unserer Leser",
      age: "Alter",
      genderDistribution: "Geschlechterverteilung:",
      male: "männlich",
      female: "weiblich",
    },
    advertising: {
      title: "Potenzielle Werbeformate",
      subtitle: "Diese Formate könnten in Zukunft verfügbar sein (aktuell nicht verfügbar)",
      display: "Display-Werbung",
      displayDesc: "Banner und visuelle Werbeformate",
      sponsoredContent: "Sponsored Content",
      sponsoredContentDesc: "Redaktionell integrierte Inhalte",
      newsletter: "Newsletter & E-Mail",
      newsletterDesc: "Direkter Kontakt zu unserer Community",
      video: "Video & Podcast",
      videoDesc: "Multimediale Werbeformate",
      socialMedia: "Social Media",
      socialMediaDesc: "Cross-Platform Promotion",
      events: "Events & Kooperationen",
      eventsDesc: "Langfristige Partnerschaften",
      currentlyNotAvailable: "Aktuell nicht verfügbar",
      responsiveFormats: "Responsive Formate",
      productPlacements: "Produktplatzierungen",
      dedicatedEmails: "Dedicated E-Mails",
      productAnnouncements: "Product Announcements",
      eventPromotion: "Event-Promotion",
      preRollVideos: "Pre-Roll Videos",
      midRollPlacements: "Mid-Roll Placements",
      podcastSponsoring: "Podcast-Sponsoring",
      videoIntegration: "Video-Integration",
      socialMediaPosts: "Social Media Posts",
      storyPlacements: "Story-Placements",
      influencerCooperations: "Influencer-Kooperationen",
      communityEngagement: "Community-Engagement",
      eventSponsoring: "Event-Sponsoring",
      productLaunches: "Produkt-Launches",
      exclusiveCooperations: "Exklusive Kooperationen",
      brandPartnerships: "Brand Partnerships",
    },
    content: {
      title: "Content & Redaktion",
      subtitle: "Hochwertige Inhalte für eine engagierte Leserschaft",
      strengths: "Unsere Stärken",
      professionalReviews: "Professionelle Reviews",
      professionalReviewsDesc: "Detaillierte, unabhängige Tests und Bewertungen von Games und Hardware",
      currentTrends: "Aktuelle Trends",
      currentTrendsDesc: "Regelmäßige Updates zu neuesten Entwicklungen und Technologien",
      engagedCommunity: "Engagierte Community",
      engagedCommunityDesc: "Aktive Leserschaft mit hohem Engagement und Interaktionsrate",
      dataDrivenInsights: "Datengetriebene Insights",
      dataDrivenInsightsDesc: "Fundierte Analysen basierend auf umfangreichen Tests und Daten",
    },
    contact: {
      title: "Kontakt",
      subtitle: "Für Kooperationen im Bereich Produkttests und Reviews",
      cooperationContact: "Kooperationskontakt",
      cooperationContactDesc: "Für Produkttests, Reviews und Kooperationen (keine Werbeanfragen)",
      email: "E-Mail:",
      forGames: "Für Spiele:",
      topics: "Themen:",
      topicsList: "Produkttests, Reviews, Kooperationen",
      note: "Hinweis:",
      noteText: "Wir bieten aktuell keine Werbeflächen an. Für Kooperationsmöglichkeiten im Bereich Produkttests besuche unsere",
      cooperationPage: "Kooperationsseite",
    },
    technical: {
      title: "Technische Spezifikationen",
      adMaterialRequirements: "Werbematerial-Anforderungen",
      bannerFormats: "Banner-Formate",
      videoFormats: "Video-Formate",
      maxFileSize: "Max. Dateigröße:",
      animations: "Animationen:",
      preferredFormats: "Responsive Formate bevorzugt",
      resolution: "Auflösung:",
      codec: "Codec:",
    },
    disclaimer: {
      text: "Alle Angaben sind ohne Gewähr. Die Mediadaten werden regelmäßig aktualisiert und können sich ändern. Für aktuelle Zahlen und individuelle Angebote kontaktieren Sie uns bitte direkt.",
      lastUpdated: "Stand:",
    },
  },
  en: {
    meta: {
      title: "Media Kit | Nerdiction",
      description: "Media data and advertising information for advertising partners and cooperation partners",
    },
    header: {
      title: "Media Kit",
      subtitle: "Information about our reach and target audience",
      backToHome: "Back to Home",
    },
    notice: {
      title: "Currently no advertising space available",
      description: "We currently do not offer advertising space. We want to remain independent and not annoy our users with advertising! Our content is presented without banners, pop-ups or disruptive advertising formats.",
      futureNote: "If this changes in the future, we will communicate it transparently. For collaborations in the field of product testing and reviews, visit our",
      cooperationLink: "cooperation page",
    },
    updateNotice: {
      monthlyUpdate: "Monthly Update:",
      lastUpdated: "All data is updated monthly. As of:",
    },
    keyMetrics: {
      title: "Key Metrics",
      subtitle: "Important key figures on our reach and engagement",
      monthlyVisitors: "Monthly Visitors",
      pageViews: "Page Views",
      sessionDuration: "Session Duration",
      bounceRate: "Bounce Rate",
      activeUsers: "Active Users",
      perMonth: "Per Month",
      average: "Average",
      lowBounceRate: "Low Bounce Rate",
    },
    detailedMetrics: {
      title: "Detailed Metrics",
      subtitle: "Further insights into user behavior and reach",
      pagesPerVisit: "Pages per Visit",
      newVisitors: "New Visitors",
      returningVisitors: "Returning Visitors",
      reviewReadTime: "Review Read Time",
      firstTimeVisitors: "First-time Visitors",
      loyalReadership: "Loyal Readership",
    },
    deviceGeography: {
      title: "Devices & Geography",
      subtitle: "Distribution by device type and geographic origin",
      mobileTraffic: "Mobile Traffic",
      desktopTraffic: "Desktop Traffic",
      topCountry: "Top Country",
      smartphoneTablet: "Smartphone & Tablet",
      pcLaptop: "PC & Laptop",
      mainOriginCountry: "Main Origin Country",
      primaryAudience: "Primary Audience",
    },
    targetAudience: {
      title: "Target Audience",
      subtitle: "Our readership consists of tech-savvy enthusiasts and gaming-interested individuals",
      demographics: "Demographics",
      demographicsDesc: "Age structure and gender distribution",
      interests: "Interests",
      interestsDesc: "Main areas of interest of our readers",
      age: "Age",
      genderDistribution: "Gender Distribution:",
      male: "male",
      female: "female",
    },
    advertising: {
      title: "Potential Advertising Formats",
      subtitle: "These formats could be available in the future (currently not available)",
      display: "Display Advertising",
      displayDesc: "Banners and visual advertising formats",
      sponsoredContent: "Sponsored Content",
      sponsoredContentDesc: "Editorially integrated content",
      newsletter: "Newsletter & Email",
      newsletterDesc: "Direct contact with our community",
      video: "Video & Podcast",
      videoDesc: "Multimedia advertising formats",
      socialMedia: "Social Media",
      socialMediaDesc: "Cross-Platform Promotion",
      events: "Events & Collaborations",
      eventsDesc: "Long-term partnerships",
      currentlyNotAvailable: "Currently not available",
      responsiveFormats: "Responsive Formats",
      productPlacements: "Product Placements",
      dedicatedEmails: "Dedicated Emails",
      productAnnouncements: "Product Announcements",
      eventPromotion: "Event Promotion",
      preRollVideos: "Pre-Roll Videos",
      midRollPlacements: "Mid-Roll Placements",
      podcastSponsoring: "Podcast Sponsoring",
      videoIntegration: "Video Integration",
      socialMediaPosts: "Social Media Posts",
      storyPlacements: "Story Placements",
      influencerCooperations: "Influencer Collaborations",
      communityEngagement: "Community Engagement",
      eventSponsoring: "Event Sponsoring",
      productLaunches: "Product Launches",
      exclusiveCooperations: "Exclusive Collaborations",
      brandPartnerships: "Brand Partnerships",
    },
    content: {
      title: "Content & Editorial",
      subtitle: "High-quality content for an engaged readership",
      strengths: "Our Strengths",
      professionalReviews: "Professional Reviews",
      professionalReviewsDesc: "Detailed, independent tests and evaluations of games and hardware",
      currentTrends: "Current Trends",
      currentTrendsDesc: "Regular updates on the latest developments and technologies",
      engagedCommunity: "Engaged Community",
      engagedCommunityDesc: "Active readership with high engagement and interaction rates",
      dataDrivenInsights: "Data-Driven Insights",
      dataDrivenInsightsDesc: "Well-founded analyses based on extensive tests and data",
    },
    contact: {
      title: "Contact",
      subtitle: "For collaborations in the field of product testing and reviews",
      cooperationContact: "Cooperation Contact",
      cooperationContactDesc: "For product tests, reviews and collaborations (no advertising inquiries)",
      email: "Email:",
      forGames: "For Games:",
      topics: "Topics:",
      topicsList: "Product tests, Reviews, Collaborations",
      note: "Note:",
      noteText: "We currently do not offer advertising space. For collaboration opportunities in the field of product testing, visit our",
      cooperationPage: "cooperation page",
    },
    technical: {
      title: "Technical Specifications",
      adMaterialRequirements: "Advertising Material Requirements",
      bannerFormats: "Banner Formats",
      videoFormats: "Video Formats",
      maxFileSize: "Max. File Size:",
      animations: "Animations:",
      preferredFormats: "Responsive formats preferred",
      resolution: "Resolution:",
      codec: "Codec:",
    },
    disclaimer: {
      text: "All information is without guarantee. The media data is regularly updated and may change. For current figures and individual offers, please contact us directly.",
      lastUpdated: "As of:",
    },
  },
  // Chinese (Simplified)
  zh: {
    meta: {
      title: "媒体数据 | Nerdiction",
      description: "媒体数据和广告信息，适用于广告合作伙伴和合作合作伙伴",
    },
    header: {
      title: "媒体数据",
      subtitle: "关于我们的覆盖范围和目标受众的信息",
      backToHome: "返回首页",
    },
    notice: {
      title: "目前没有可用的广告位",
      description: "我们目前不提供广告位。我们希望保持独立，不想用广告打扰我们的用户！我们的内容以无横幅、无弹窗或无干扰广告格式呈现。",
      futureNote: "如果将来发生变化，我们将透明地沟通。如需产品测试和评测方面的合作，请访问我们的",
      cooperationLink: "合作页面",
    },
    updateNotice: {
      monthlyUpdate: "每月更新：",
      lastUpdated: "所有数据每月更新。截至：",
    },
    keyMetrics: {
      title: "核心指标",
      subtitle: "关于我们覆盖范围和参与度的重要关键数据",
      monthlyVisitors: "月度访客",
      pageViews: "页面浏览量",
      sessionDuration: "会话时长",
      bounceRate: "跳出率",
      activeUsers: "活跃用户",
      perMonth: "每月",
      average: "平均",
      lowBounceRate: "低跳出率",
    },
    detailedMetrics: {
      title: "详细指标",
      subtitle: "用户行为和覆盖范围的进一步洞察",
      pagesPerVisit: "每次访问页面数",
      newVisitors: "新访客",
      returningVisitors: "回访访客",
      reviewReadTime: "评测阅读时间",
      firstTimeVisitors: "首次访客",
      loyalReadership: "忠实读者群",
    },
    deviceGeography: {
      title: "设备和地理",
      subtitle: "按设备类型和地理来源的分布",
      mobileTraffic: "移动流量",
      desktopTraffic: "桌面流量",
      topCountry: "主要国家",
      smartphoneTablet: "智能手机和平板电脑",
      pcLaptop: "PC和笔记本电脑",
      mainOriginCountry: "主要来源国家",
      primaryAudience: "主要受众",
    },
    targetAudience: {
      title: "目标受众",
      subtitle: "我们的读者群由技术爱好者和游戏爱好者组成",
      demographics: "人口统计",
      demographicsDesc: "年龄结构和性别分布",
      interests: "兴趣",
      interestsDesc: "我们读者的主要兴趣领域",
      age: "年龄",
      genderDistribution: "性别分布：",
      male: "男性",
      female: "女性",
    },
    advertising: {
      title: "潜在广告格式",
      subtitle: "这些格式将来可能可用（目前不可用）",
      display: "展示广告",
      displayDesc: "横幅和视觉广告格式",
      sponsoredContent: "赞助内容",
      sponsoredContentDesc: "编辑整合内容",
      newsletter: "新闻通讯和电子邮件",
      newsletterDesc: "与我们社区的直接联系",
      video: "视频和播客",
      videoDesc: "多媒体广告格式",
      socialMedia: "社交媒体",
      socialMediaDesc: "跨平台推广",
      events: "活动和合作",
      eventsDesc: "长期合作伙伴关系",
      currentlyNotAvailable: "目前不可用",
      responsiveFormats: "响应式格式",
      productPlacements: "产品植入",
      dedicatedEmails: "专用电子邮件",
      productAnnouncements: "产品公告",
      eventPromotion: "活动推广",
      preRollVideos: "前贴片视频",
      midRollPlacements: "中贴片位置",
      podcastSponsoring: "播客赞助",
      videoIntegration: "视频整合",
      socialMediaPosts: "社交媒体帖子",
      storyPlacements: "故事位置",
      influencerCooperations: "影响者合作",
      communityEngagement: "社区参与",
      eventSponsoring: "活动赞助",
      productLaunches: "产品发布",
      exclusiveCooperations: "独家合作",
      brandPartnerships: "品牌合作伙伴关系",
    },
    content: {
      title: "内容和编辑",
      subtitle: "为积极参与的读者群提供高质量内容",
      strengths: "我们的优势",
      professionalReviews: "专业评测",
      professionalReviewsDesc: "对游戏和硬件进行详细、独立的测试和评估",
      currentTrends: "当前趋势",
      currentTrendsDesc: "定期更新最新发展和技术",
      engagedCommunity: "积极参与的社区",
      engagedCommunityDesc: "具有高参与度和互动率的活跃读者群",
      dataDrivenInsights: "数据驱动的洞察",
      dataDrivenInsightsDesc: "基于广泛测试和数据的深入分析",
    },
    contact: {
      title: "联系方式",
      subtitle: "产品测试和评测方面的合作",
      cooperationContact: "合作联系",
      cooperationContactDesc: "产品测试、评测和合作（不接受广告咨询）",
      email: "电子邮件：",
      forGames: "游戏相关：",
      topics: "主题：",
      topicsList: "产品测试、评测、合作",
      note: "注意：",
      noteText: "我们目前不提供广告位。如需产品测试方面的合作机会，请访问我们的",
      cooperationPage: "合作页面",
    },
    technical: {
      title: "技术规格",
      adMaterialRequirements: "广告材料要求",
      bannerFormats: "横幅格式",
      videoFormats: "视频格式",
      maxFileSize: "最大文件大小：",
      animations: "动画：",
      preferredFormats: "首选响应式格式",
      resolution: "分辨率：",
      codec: "编解码器：",
    },
    disclaimer: {
      text: "所有信息均不保证。媒体数据会定期更新，可能会发生变化。如需最新数据和个性化报价，请直接联系我们。",
      lastUpdated: "截至：",
    },
  },
  // Hindi
  hi: {
    meta: {
      title: "मीडिया डेटा | Nerdiction",
      description: "विज्ञापन भागीदारों और सहयोग भागीदारों के लिए मीडिया डेटा और विज्ञापन जानकारी",
    },
    header: {
      title: "मीडिया डेटा",
      subtitle: "हमारी पहुंच और लक्षित दर्शकों के बारे में जानकारी",
      backToHome: "होम पर वापस जाएं",
    },
    notice: {
      title: "वर्तमान में कोई विज्ञापन स्थान उपलब्ध नहीं",
      description: "हम वर्तमान में विज्ञापन स्थान प्रदान नहीं करते हैं। हम स्वतंत्र रहना चाहते हैं और अपने उपयोगकर्ताओं को विज्ञापन से परेशान नहीं करना चाहते! हमारी सामग्री बैनर, पॉप-अप या व्यवधानकारी विज्ञापन प्रारूपों के बिना प्रस्तुत की जाती है।",
      futureNote: "यदि भविष्य में यह बदलता है, तो हम इसे पारदर्शी रूप से संवाद करेंगे। उत्पाद परीक्षण और समीक्षा के क्षेत्र में सहयोग के लिए, हमारे",
      cooperationLink: "सहयोग पृष्ठ",
    },
    updateNotice: {
      monthlyUpdate: "मासिक अपडेट:",
      lastUpdated: "सभी डेटा मासिक रूप से अपडेट किया जाता है। जैसे:",
    },
    keyMetrics: {
      title: "मुख्य मेट्रिक्स",
      subtitle: "हमारी पहुंच और जुड़ाव पर महत्वपूर्ण प्रमुख आंकड़े",
      monthlyVisitors: "मासिक आगंतुक",
      pageViews: "पृष्ठ दृश्य",
      sessionDuration: "सत्र अवधि",
      bounceRate: "बाउंस दर",
      activeUsers: "सक्रिय उपयोगकर्ता",
      perMonth: "प्रति माह",
      average: "औसत",
      lowBounceRate: "कम बाउंस दर",
    },
    detailedMetrics: {
      title: "विस्तृत मेट्रिक्स",
      subtitle: "उपयोगकर्ता व्यवहार और पहुंच में अतिरिक्त अंतर्दृष्टि",
      pagesPerVisit: "प्रति यात्रा पृष्ठ",
      newVisitors: "नए आगंतुक",
      returningVisitors: "वापस आने वाले आगंतुक",
      reviewReadTime: "समीक्षा पढ़ने का समय",
      firstTimeVisitors: "पहली बार आने वाले आगंतुक",
      loyalReadership: "वफादार पाठक वर्ग",
    },
    deviceGeography: {
      title: "उपकरण और भूगोल",
      subtitle: "उपकरण प्रकार और भौगोलिक मूल के अनुसार वितरण",
      mobileTraffic: "मोबाइल ट्रैफिक",
      desktopTraffic: "डेस्कटॉप ट्रैफिक",
      topCountry: "शीर्ष देश",
      smartphoneTablet: "स्मार्टफोन और टैबलेट",
      pcLaptop: "पीसी और लैपटॉप",
      mainOriginCountry: "मुख्य मूल देश",
      primaryAudience: "प्राथमिक दर्शक",
    },
    targetAudience: {
      title: "लक्षित दर्शक",
      subtitle: "हमारे पाठक तकनीक-प्रेमी उत्साही और गेमिंग-रुचि वाले व्यक्ति हैं",
      demographics: "जनसांख्यिकी",
      demographicsDesc: "आयु संरचना और लिंग वितरण",
      interests: "रुचियां",
      interestsDesc: "हमारे पाठकों के मुख्य रुचि क्षेत्र",
      age: "आयु",
      genderDistribution: "लिंग वितरण:",
      male: "पुरुष",
      female: "महिला",
    },
    advertising: {
      title: "संभावित विज्ञापन प्रारूप",
      subtitle: "ये प्रारूप भविष्य में उपलब्ध हो सकते हैं (वर्तमान में उपलब्ध नहीं)",
      display: "डिस्प्ले विज्ञापन",
      displayDesc: "बैनर और दृश्य विज्ञापन प्रारूप",
      sponsoredContent: "प्रायोजित सामग्री",
      sponsoredContentDesc: "संपादकीय रूप से एकीकृत सामग्री",
      newsletter: "न्यूज़लेटर और ईमेल",
      newsletterDesc: "हमारे समुदाय के साथ सीधा संपर्क",
      video: "वीडियो और पॉडकास्ट",
      videoDesc: "मल्टीमीडिया विज्ञापन प्रारूप",
      socialMedia: "सोशल मीडिया",
      socialMediaDesc: "क्रॉस-प्लेटफॉर्म प्रचार",
      events: "इवेंट्स और सहयोग",
      eventsDesc: "दीर्घकालिक साझेदारी",
      currentlyNotAvailable: "वर्तमान में उपलब्ध नहीं",
      responsiveFormats: "उत्तरदायी प्रारूप",
      productPlacements: "उत्पाद प्लेसमेंट",
      dedicatedEmails: "समर्पित ईमेल",
      productAnnouncements: "उत्पाद घोषणाएं",
      eventPromotion: "इवेंट प्रचार",
      preRollVideos: "प्री-रोल वीडियो",
      midRollPlacements: "मिड-रोल प्लेसमेंट",
      podcastSponsoring: "पॉडकास्ट प्रायोजन",
      videoIntegration: "वीडियो एकीकरण",
      socialMediaPosts: "सोशल मीडिया पोस्ट",
      storyPlacements: "कहानी प्लेसमेंट",
      influencerCooperations: "इन्फ्लुएंसर सहयोग",
      communityEngagement: "समुदाय जुड़ाव",
      eventSponsoring: "इवेंट प्रायोजन",
      productLaunches: "उत्पाद लॉन्च",
      exclusiveCooperations: "विशेष सहयोग",
      brandPartnerships: "ब्रांड साझेदारी",
    },
    content: {
      title: "सामग्री और संपादकीय",
      subtitle: "एक जुड़े हुए पाठक वर्ग के लिए उच्च गुणवत्ता वाली सामग्री",
      strengths: "हमारी ताकत",
      professionalReviews: "पेशेवर समीक्षाएं",
      professionalReviewsDesc: "गेम और हार्डवेयर के विस्तृत, स्वतंत्र परीक्षण और मूल्यांकन",
      currentTrends: "वर्तमान रुझान",
      currentTrendsDesc: "नवीनतम विकास और प्रौद्योगिकियों पर नियमित अपडेट",
      engagedCommunity: "जुड़ा हुआ समुदाय",
      engagedCommunityDesc: "उच्च जुड़ाव और बातचीत दरों के साथ सक्रिय पाठक वर्ग",
      dataDrivenInsights: "डेटा-संचालित अंतर्दृष्टि",
      dataDrivenInsightsDesc: "व्यापक परीक्षणों और डेटा के आधार पर सुविचारित विश्लेषण",
    },
    contact: {
      title: "संपर्क",
      subtitle: "उत्पाद परीक्षण और समीक्षा के क्षेत्र में सहयोग के लिए",
      cooperationContact: "सहयोग संपर्क",
      cooperationContactDesc: "उत्पाद परीक्षण, समीक्षा और सहयोग के लिए (कोई विज्ञापन पूछताछ नहीं)",
      email: "ईमेल:",
      forGames: "गेम के लिए:",
      topics: "विषय:",
      topicsList: "उत्पाद परीक्षण, समीक्षाएं, सहयोग",
      note: "नोट:",
      noteText: "हम वर्तमान में विज्ञापन स्थान प्रदान नहीं करते हैं। उत्पाद परीक्षण के क्षेत्र में सहयोग के अवसरों के लिए, हमारे",
      cooperationPage: "सहयोग पृष्ठ",
    },
    technical: {
      title: "तकनीकी विनिर्देश",
      adMaterialRequirements: "विज्ञापन सामग्री आवश्यकताएं",
      bannerFormats: "बैनर प्रारूप",
      videoFormats: "वीडियो प्रारूप",
      maxFileSize: "अधिकतम फ़ाइल आकार:",
      animations: "एनिमेशन:",
      preferredFormats: "उत्तरदायी प्रारूप पसंद किए जाते हैं",
      resolution: "रिज़ॉल्यूशन:",
      codec: "कोडेक:",
    },
    disclaimer: {
      text: "सभी जानकारी बिना गारंटी के है। मीडिया डेटा नियमित रूप से अपडेट किया जाता है और बदल सकता है। वर्तमान आंकड़ों और व्यक्तिगत प्रस्तावों के लिए, कृपया हमसे सीधे संपर्क करें।",
      lastUpdated: "जैसे:",
    },
  },
  // Spanish
  es: {
    meta: {
      title: "Kit de Medios | Nerdiction",
      description: "Datos de medios e información publicitaria para socios publicitarios y socios de cooperación",
    },
    header: {
      title: "Kit de Medios",
      subtitle: "Información sobre nuestro alcance y audiencia objetivo",
      backToHome: "Volver al inicio",
    },
    notice: {
      title: "Actualmente no hay espacio publicitario disponible",
      description: "Actualmente no ofrecemos espacio publicitario. ¡Queremos mantenernos independientes y no molestar a nuestros usuarios con publicidad! Nuestro contenido se presenta sin banners, ventanas emergentes o formatos publicitarios disruptivos.",
      futureNote: "Si esto cambia en el futuro, lo comunicaremos de manera transparente. Para colaboraciones en el campo de pruebas de productos y reseñas, visite nuestra",
      cooperationLink: "página de cooperación",
    },
    updateNotice: {
      monthlyUpdate: "Actualización mensual:",
      lastUpdated: "Todos los datos se actualizan mensualmente. A partir de:",
    },
    keyMetrics: {
      title: "Métricas clave",
      subtitle: "Cifras importantes sobre nuestro alcance y compromiso",
      monthlyVisitors: "Visitantes mensuales",
      pageViews: "Visualizaciones de página",
      sessionDuration: "Duración de la sesión",
      bounceRate: "Tasa de rebote",
      activeUsers: "Usuarios activos",
      perMonth: "Por mes",
      average: "Promedio",
      lowBounceRate: "Baja tasa de rebote",
    },
    detailedMetrics: {
      title: "Métricas detalladas",
      subtitle: "Más información sobre el comportamiento del usuario y el alcance",
      pagesPerVisit: "Páginas por visita",
      newVisitors: "Visitantes nuevos",
      returningVisitors: "Visitantes recurrentes",
      reviewReadTime: "Tiempo de lectura de reseñas",
      firstTimeVisitors: "Visitantes por primera vez",
      loyalReadership: "Lectores leales",
    },
    deviceGeography: {
      title: "Dispositivos y geografía",
      subtitle: "Distribución por tipo de dispositivo y origen geográfico",
      mobileTraffic: "Tráfico móvil",
      desktopTraffic: "Tráfico de escritorio",
      topCountry: "País principal",
      smartphoneTablet: "Smartphone y tableta",
      pcLaptop: "PC y portátil",
      mainOriginCountry: "País de origen principal",
      primaryAudience: "Audiencia principal",
    },
    targetAudience: {
      title: "Audiencia objetivo",
      subtitle: "Nuestros lectores consisten en entusiastas conocedores de tecnología e individuos interesados en juegos",
      demographics: "Demografía",
      demographicsDesc: "Estructura de edad y distribución de género",
      interests: "Intereses",
      interestsDesc: "Principales áreas de interés de nuestros lectores",
      age: "Edad",
      genderDistribution: "Distribución de género:",
      male: "masculino",
      female: "femenino",
    },
    advertising: {
      title: "Formatos publicitarios potenciales",
      subtitle: "Estos formatos podrían estar disponibles en el futuro (actualmente no disponibles)",
      display: "Publicidad display",
      displayDesc: "Banners y formatos publicitarios visuales",
      sponsoredContent: "Contenido patrocinado",
      sponsoredContentDesc: "Contenido integrado editorialmente",
      newsletter: "Boletín y correo electrónico",
      newsletterDesc: "Contacto directo con nuestra comunidad",
      video: "Video y podcast",
      videoDesc: "Formatos publicitarios multimedia",
      socialMedia: "Redes sociales",
      socialMediaDesc: "Promoción multiplataforma",
      events: "Eventos y colaboraciones",
      eventsDesc: "Asociaciones a largo plazo",
      currentlyNotAvailable: "Actualmente no disponible",
      responsiveFormats: "Formatos responsivos",
      productPlacements: "Colocaciones de productos",
      dedicatedEmails: "Correos electrónicos dedicados",
      productAnnouncements: "Anuncios de productos",
      eventPromotion: "Promoción de eventos",
      preRollVideos: "Videos pre-roll",
      midRollPlacements: "Colocaciones mid-roll",
      podcastSponsoring: "Patrocinio de podcasts",
      videoIntegration: "Integración de video",
      socialMediaPosts: "Publicaciones en redes sociales",
      storyPlacements: "Colocaciones de historias",
      influencerCooperations: "Colaboraciones con influencers",
      communityEngagement: "Compromiso comunitario",
      eventSponsoring: "Patrocinio de eventos",
      productLaunches: "Lanzamientos de productos",
      exclusiveCooperations: "Colaboraciones exclusivas",
      brandPartnerships: "Asociaciones de marca",
    },
    content: {
      title: "Contenido y editorial",
      subtitle: "Contenido de alta calidad para una audiencia comprometida",
      strengths: "Nuestras fortalezas",
      professionalReviews: "Reseñas profesionales",
      professionalReviewsDesc: "Pruebas y evaluaciones detalladas e independientes de juegos y hardware",
      currentTrends: "Tendencias actuales",
      currentTrendsDesc: "Actualizaciones regulares sobre los últimos desarrollos y tecnologías",
      engagedCommunity: "Comunidad comprometida",
      engagedCommunityDesc: "Audiencia activa con altas tasas de compromiso e interacción",
      dataDrivenInsights: "Información basada en datos",
      dataDrivenInsightsDesc: "Análisis fundamentados basados en pruebas extensivas y datos",
    },
    contact: {
      title: "Contacto",
      subtitle: "Para colaboraciones en el campo de pruebas de productos y reseñas",
      cooperationContact: "Contacto de cooperación",
      cooperationContactDesc: "Para pruebas de productos, reseñas y colaboraciones (sin consultas publicitarias)",
      email: "Correo electrónico:",
      forGames: "Para juegos:",
      topics: "Temas:",
      topicsList: "Pruebas de productos, Reseñas, Colaboraciones",
      note: "Nota:",
      noteText: "Actualmente no ofrecemos espacio publicitario. Para oportunidades de colaboración en el campo de pruebas de productos, visite nuestra",
      cooperationPage: "página de cooperación",
    },
    technical: {
      title: "Especificaciones técnicas",
      adMaterialRequirements: "Requisitos de material publicitario",
      bannerFormats: "Formatos de banner",
      videoFormats: "Formatos de video",
      maxFileSize: "Tamaño máximo de archivo:",
      animations: "Animaciones:",
      preferredFormats: "Se prefieren formatos responsivos",
      resolution: "Resolución:",
      codec: "Códec:",
    },
    disclaimer: {
      text: "Toda la información es sin garantía. Los datos de medios se actualizan regularmente y pueden cambiar. Para cifras actuales y ofertas individuales, contáctenos directamente.",
      lastUpdated: "A partir de:",
    },
  },
  // French
  fr: {
    meta: {
      title: "Kit Média | Nerdiction",
      description: "Données médias et informations publicitaires pour les partenaires publicitaires et les partenaires de coopération",
    },
    header: {
      title: "Kit Média",
      subtitle: "Informations sur notre portée et notre public cible",
      backToHome: "Retour à l'accueil",
    },
    notice: {
      title: "Actuellement aucun espace publicitaire disponible",
      description: "Nous n'offrons actuellement aucun espace publicitaire. Nous voulons rester indépendants et ne pas ennuyer nos utilisateurs avec de la publicité ! Notre contenu est présenté sans bannières, pop-ups ou formats publicitaires perturbateurs.",
      futureNote: "Si cela change à l'avenir, nous le communiquerons de manière transparente. Pour les collaborations dans le domaine des tests de produits et des critiques, visitez notre",
      cooperationLink: "page de coopération",
    },
    updateNotice: {
      monthlyUpdate: "Mise à jour mensuelle :",
      lastUpdated: "Toutes les données sont mises à jour mensuellement. Au :",
    },
    keyMetrics: {
      title: "Métriques clés",
      subtitle: "Chiffres importants sur notre portée et notre engagement",
      monthlyVisitors: "Visiteurs mensuels",
      pageViews: "Pages vues",
      sessionDuration: "Durée de session",
      bounceRate: "Taux de rebond",
      activeUsers: "Utilisateurs actifs",
      perMonth: "Par mois",
      average: "Moyenne",
      lowBounceRate: "Faible taux de rebond",
    },
    detailedMetrics: {
      title: "Métriques détaillées",
      subtitle: "Autres informations sur le comportement des utilisateurs et la portée",
      pagesPerVisit: "Pages par visite",
      newVisitors: "Nouveaux visiteurs",
      returningVisitors: "Visiteurs récurrents",
      reviewReadTime: "Temps de lecture des critiques",
      firstTimeVisitors: "Visiteurs pour la première fois",
      loyalReadership: "Lectorat fidèle",
    },
    deviceGeography: {
      title: "Appareils et géographie",
      subtitle: "Répartition par type d'appareil et origine géographique",
      mobileTraffic: "Trafic mobile",
      desktopTraffic: "Trafic desktop",
      topCountry: "Pays principal",
      smartphoneTablet: "Smartphone et tablette",
      pcLaptop: "PC et ordinateur portable",
      mainOriginCountry: "Pays d'origine principal",
      primaryAudience: "Public principal",
    },
    targetAudience: {
      title: "Public cible",
      subtitle: "Nos lecteurs sont des passionnés de technologie et des personnes intéressées par les jeux",
      demographics: "Démographie",
      demographicsDesc: "Structure d'âge et répartition par sexe",
      interests: "Intérêts",
      interestsDesc: "Principaux domaines d'intérêt de nos lecteurs",
      age: "Âge",
      genderDistribution: "Répartition par sexe :",
      male: "masculin",
      female: "féminin",
    },
    advertising: {
      title: "Formats publicitaires potentiels",
      subtitle: "Ces formats pourraient être disponibles à l'avenir (actuellement non disponibles)",
      display: "Publicité display",
      displayDesc: "Bannières et formats publicitaires visuels",
      sponsoredContent: "Contenu sponsorisé",
      sponsoredContentDesc: "Contenu intégré éditorialement",
      newsletter: "Newsletter et e-mail",
      newsletterDesc: "Contact direct avec notre communauté",
      video: "Vidéo et podcast",
      videoDesc: "Formats publicitaires multimédias",
      socialMedia: "Réseaux sociaux",
      socialMediaDesc: "Promotion cross-platform",
      events: "Événements et collaborations",
      eventsDesc: "Partenariats à long terme",
      currentlyNotAvailable: "Actuellement non disponible",
      responsiveFormats: "Formats responsives",
      productPlacements: "Placements de produits",
      dedicatedEmails: "E-mails dédiés",
      productAnnouncements: "Annonces de produits",
      eventPromotion: "Promotion d'événements",
      preRollVideos: "Vidéos pre-roll",
      midRollPlacements: "Placements mid-roll",
      podcastSponsoring: "Sponsoring de podcasts",
      videoIntegration: "Intégration vidéo",
      socialMediaPosts: "Publications sur les réseaux sociaux",
      storyPlacements: "Placements de stories",
      influencerCooperations: "Collaborations avec des influenceurs",
      communityEngagement: "Engagement communautaire",
      eventSponsoring: "Sponsoring d'événements",
      productLaunches: "Lancements de produits",
      exclusiveCooperations: "Collaborations exclusives",
      brandPartnerships: "Partenariats de marque",
    },
    content: {
      title: "Contenu et éditorial",
      subtitle: "Contenu de haute qualité pour un lectorat engagé",
      strengths: "Nos forces",
      professionalReviews: "Critiques professionnelles",
      professionalReviewsDesc: "Tests et évaluations détaillés et indépendants de jeux et de matériel",
      currentTrends: "Tendances actuelles",
      currentTrendsDesc: "Mises à jour régulières sur les derniers développements et technologies",
      engagedCommunity: "Communauté engagée",
      engagedCommunityDesc: "Lectorat actif avec des taux d'engagement et d'interaction élevés",
      dataDrivenInsights: "Informations basées sur les données",
      dataDrivenInsightsDesc: "Analyses bien fondées basées sur des tests et des données approfondis",
    },
    contact: {
      title: "Contact",
      subtitle: "Pour les collaborations dans le domaine des tests de produits et des critiques",
      cooperationContact: "Contact de coopération",
      cooperationContactDesc: "Pour les tests de produits, les critiques et les collaborations (pas de demandes publicitaires)",
      email: "E-mail :",
      forGames: "Pour les jeux :",
      topics: "Sujets :",
      topicsList: "Tests de produits, Critiques, Collaborations",
      note: "Note :",
      noteText: "Nous n'offrons actuellement aucun espace publicitaire. Pour les opportunités de collaboration dans le domaine des tests de produits, visitez notre",
      cooperationPage: "page de coopération",
    },
    technical: {
      title: "Spécifications techniques",
      adMaterialRequirements: "Exigences du matériel publicitaire",
      bannerFormats: "Formats de bannière",
      videoFormats: "Formats vidéo",
      maxFileSize: "Taille maximale du fichier :",
      animations: "Animations :",
      preferredFormats: "Formats responsives préférés",
      resolution: "Résolution :",
      codec: "Codec :",
    },
    disclaimer: {
      text: "Toutes les informations sont sans garantie. Les données médias sont régulièrement mises à jour et peuvent changer. Pour les chiffres actuels et les offres individuelles, veuillez nous contacter directement.",
      lastUpdated: "Au :",
    },
  },
  // Arabic
  ar: {
    meta: {
      title: "بيانات الوسائط | Nerdiction",
      description: "بيانات الوسائط ومعلومات الإعلانات للشركاء الإعلانيين وشركاء التعاون",
    },
    header: {
      title: "بيانات الوسائط",
      subtitle: "معلومات حول مدى وصولنا وجمهورنا المستهدف",
      backToHome: "العودة إلى الصفحة الرئيسية",
    },
    notice: {
      title: "لا توجد مساحة إعلانية متاحة حالياً",
      description: "نحن لا نقدم حالياً مساحة إعلانية. نريد أن نظل مستقلين ولا نزعج مستخدمينا بالإعلانات! يتم تقديم محتوانا بدون لافتات أو نوافذ منبثقة أو تنسيقات إعلانية مزعجة.",
      futureNote: "إذا تغير هذا في المستقبل، فسوف نتواصل بشفافية. للتعاون في مجال اختبار المنتجات والمراجعات، قم بزيارة",
      cooperationLink: "صفحة التعاون",
    },
    updateNotice: {
      monthlyUpdate: "التحديث الشهري:",
      lastUpdated: "يتم تحديث جميع البيانات شهرياً. اعتباراً من:",
    },
    keyMetrics: {
      title: "المقاييس الرئيسية",
      subtitle: "أرقام مهمة حول مدى وصولنا ومشاركتنا",
      monthlyVisitors: "الزوار الشهريون",
      pageViews: "مشاهدات الصفحة",
      sessionDuration: "مدة الجلسة",
      bounceRate: "معدل الارتداد",
      activeUsers: "المستخدمون النشطون",
      perMonth: "شهرياً",
      average: "المتوسط",
      lowBounceRate: "معدل ارتداد منخفض",
    },
    detailedMetrics: {
      title: "مقاييس مفصلة",
      subtitle: "رؤى إضافية حول سلوك المستخدم والوصول",
      pagesPerVisit: "الصفحات لكل زيارة",
      newVisitors: "زوار جدد",
      returningVisitors: "زوار متكررون",
      reviewReadTime: "وقت قراءة المراجعة",
      firstTimeVisitors: "زوار لأول مرة",
      loyalReadership: "قاعدة قراء مخلصين",
    },
    deviceGeography: {
      title: "الأجهزة والجغرافيا",
      subtitle: "التوزيع حسب نوع الجهاز والأصل الجغرافي",
      mobileTraffic: "حركة المرور عبر الهاتف المحمول",
      desktopTraffic: "حركة المرور عبر سطح المكتب",
      topCountry: "البلد الرئيسي",
      smartphoneTablet: "الهاتف الذكي والجهاز اللوحي",
      pcLaptop: "الكمبيوتر الشخصي والكمبيوتر المحمول",
      mainOriginCountry: "بلد المنشأ الرئيسي",
      primaryAudience: "الجمهور الأساسي",
    },
    targetAudience: {
      title: "الجمهور المستهدف",
      subtitle: "قراؤنا يتكونون من المتحمسين للتقنية والأفراد المهتمين بالألعاب",
      demographics: "التركيبة السكانية",
      demographicsDesc: "هيكل العمر وتوزيع الجنس",
      interests: "الاهتمامات",
      interestsDesc: "المجالات الرئيسية لاهتمام قرائنا",
      age: "العمر",
      genderDistribution: "توزيع الجنس:",
      male: "ذكر",
      female: "أنثى",
    },
    advertising: {
      title: "تنسيقات الإعلانات المحتملة",
      subtitle: "قد تكون هذه التنسيقات متاحة في المستقبل (غير متاحة حالياً)",
      display: "إعلانات العرض",
      displayDesc: "اللافتات وتنسيقات الإعلانات المرئية",
      sponsoredContent: "المحتوى المدعوم",
      sponsoredContentDesc: "محتوى متكامل تحريرياً",
      newsletter: "النشرة الإخبارية والبريد الإلكتروني",
      newsletterDesc: "اتصال مباشر مع مجتمعنا",
      video: "الفيديو والبودكاست",
      videoDesc: "تنسيقات إعلانية متعددة الوسائط",
      socialMedia: "وسائل التواصل الاجتماعي",
      socialMediaDesc: "الترويج عبر المنصات",
      events: "الأحداث والتعاون",
      eventsDesc: "شراكات طويلة الأجل",
      currentlyNotAvailable: "غير متاح حالياً",
      responsiveFormats: "تنسيقات متجاوبة",
      productPlacements: "مواضع المنتجات",
      dedicatedEmails: "رسائل بريد إلكتروني مخصصة",
      productAnnouncements: "إعلانات المنتجات",
      eventPromotion: "ترويج الأحداث",
      preRollVideos: "مقاطع فيديو ما قبل التشغيل",
      midRollPlacements: "مواضع منتصف التشغيل",
      podcastSponsoring: "رعاية البودكاست",
      videoIntegration: "تكامل الفيديو",
      socialMediaPosts: "منشورات وسائل التواصل الاجتماعي",
      storyPlacements: "مواضع القصص",
      influencerCooperations: "تعاون المؤثرين",
      communityEngagement: "مشاركة المجتمع",
      eventSponsoring: "رعاية الأحداث",
      productLaunches: "إطلاق المنتجات",
      exclusiveCooperations: "تعاون حصري",
      brandPartnerships: "شراكات العلامات التجارية",
    },
    content: {
      title: "المحتوى والتحرير",
      subtitle: "محتوى عالي الجودة لجمهور منخرط",
      strengths: "نقاط قوتنا",
      professionalReviews: "مراجعات احترافية",
      professionalReviewsDesc: "اختبارات وتقييمات مفصلة ومستقلة للألعاب والأجهزة",
      currentTrends: "الاتجاهات الحالية",
      currentTrendsDesc: "تحديثات منتظمة حول أحدث التطورات والتقنيات",
      engagedCommunity: "مجتمع منخرط",
      engagedCommunityDesc: "قاعدة قراء نشطة مع معدلات مشاركة وتفاعل عالية",
      dataDrivenInsights: "رؤى مدفوعة بالبيانات",
      dataDrivenInsightsDesc: "تحليلات مدروسة تستند إلى اختبارات وبيانات واسعة",
    },
    contact: {
      title: "جهة الاتصال",
      subtitle: "للتعاون في مجال اختبار المنتجات والمراجعات",
      cooperationContact: "جهة اتصال التعاون",
      cooperationContactDesc: "لاختبارات المنتجات والمراجعات والتعاون (لا استفسارات إعلانية)",
      email: "البريد الإلكتروني:",
      forGames: "للألعاب:",
      topics: "المواضيع:",
      topicsList: "اختبارات المنتجات، المراجعات، التعاون",
      note: "ملاحظة:",
      noteText: "نحن لا نقدم حالياً مساحة إعلانية. لفرص التعاون في مجال اختبار المنتجات، قم بزيارة",
      cooperationPage: "صفحة التعاون",
    },
    technical: {
      title: "المواصفات التقنية",
      adMaterialRequirements: "متطلبات المواد الإعلانية",
      bannerFormats: "تنسيقات اللافتات",
      videoFormats: "تنسيقات الفيديو",
      maxFileSize: "الحد الأقصى لحجم الملف:",
      animations: "الرسوم المتحركة:",
      preferredFormats: "تفضيل التنسيقات المتجاوبة",
      resolution: "الدقة:",
      codec: "الترميز:",
    },
    disclaimer: {
      text: "جميع المعلومات دون ضمان. يتم تحديث بيانات الوسائط بانتظام وقد تتغير. للأرقام الحالية والعروض الفردية، يرجى الاتصال بنا مباشرة.",
      lastUpdated: "اعتباراً من:",
    },
  },
};

