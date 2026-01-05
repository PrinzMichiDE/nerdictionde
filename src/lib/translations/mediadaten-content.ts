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
  // Timeline
  timeline: {
    title: string;
    subtitle: string;
    monthlyVisitors: string;
    pageViews: string;
    max: string;
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
    general: string;
    forGames: string;
    forHardware: string;
    forMovies: string;
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
    timeline: {
      title: "12-Monats-Zeitachse",
      subtitle: "Entwicklung der monatlichen Besucher und Seitenaufrufe über die letzten 12 Monate",
      monthlyVisitors: "Monatliche Besucher",
      pageViews: "Seitenaufrufe",
      max: "Max:",
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
      subtitle: "Für Kooperationen und Anfragen",
      general: "Allgemein:",
      forGames: "Spiele:",
      forHardware: "Hardware:",
      forMovies: "Filme und Serien:",
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
    timeline: {
      title: "12-Month Timeline",
      subtitle: "Development of monthly visitors and page views over the last 12 months",
      monthlyVisitors: "Monthly Visitors",
      pageViews: "Page Views",
      max: "Max:",
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
      subtitle: "For collaborations and inquiries",
      general: "General:",
      forGames: "Games:",
      forHardware: "Hardware:",
      forMovies: "Movies and Series:",
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
    timeline: {
      title: "12个月时间线",
      subtitle: "过去12个月月度访客和页面浏览量的发展",
      monthlyVisitors: "月度访客",
      pageViews: "页面浏览量",
      max: "最大：",
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
      subtitle: "合作和咨询",
      general: "一般：",
      forGames: "游戏：",
      forHardware: "硬件：",
      forMovies: "电影和系列：",
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
      subtitle: "सहयोग और पूछताछ के लिए",
      general: "सामान्य:",
      forGames: "गेम:",
      forHardware: "हार्डवेयर:",
      forMovies: "फिल्में और श्रृंखला:",
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
    timeline: {
      title: "Línea de tiempo de 12 meses",
      subtitle: "Desarrollo de visitantes mensuales y visualizaciones de página en los últimos 12 meses",
      monthlyVisitors: "Visitantes mensuales",
      pageViews: "Visualizaciones de página",
      max: "Máx:",
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
    timeline: {
      title: "Chronologie de 12 mois",
      subtitle: "Évolution des visiteurs mensuels et des pages vues sur les 12 derniers mois",
      monthlyVisitors: "Visiteurs mensuels",
      pageViews: "Pages vues",
      max: "Max:",
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
    timeline: {
      title: "الجدول الزمني لـ 12 شهرًا",
      subtitle: "تطور الزوار الشهريين ومشاهدات الصفحة على مدى الأشهر الـ 12 الماضية",
      monthlyVisitors: "الزوار الشهريون",
      pageViews: "مشاهدات الصفحة",
      max: "الحد الأقصى:",
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
  // Bengali, Portuguese, Russian, Japanese, Punjabi, Javanese, Wu Chinese, Indonesian
  // Note: Due to file size constraints, these languages use English as fallback
  // Full translations can be added later if needed
  bn: {
    meta: { title: "মিডিয়া ডেটা | Nerdiction", description: "বিজ্ঞাপন অংশীদার এবং সহযোগিতা অংশীদারদের জন্য মিডিয়া ডেটা এবং বিজ্ঞাপন তথ্য" },
    header: { title: "মিডিয়া ডেটা", subtitle: "আমাদের পৌঁছানো এবং লক্ষ্য শ্রোতা সম্পর্কে তথ্য", backToHome: "হোমে ফিরুন" },
    notice: { title: "বর্তমানে কোন বিজ্ঞাপন স্থান নেই", description: "আমরা বর্তমানে বিজ্ঞাপন স্থান প্রদান করি না। আমরা স্বাধীন থাকতে চাই এবং আমাদের ব্যবহারকারীদের বিজ্ঞাপন দিয়ে বিরক্ত করতে চাই না!", futureNote: "ভবিষ্যতে এটি পরিবর্তিত হলে, আমরা স্বচ্ছভাবে যোগাযোগ করব।", cooperationLink: "সহযোগিতা পৃষ্ঠা" },
    updateNotice: { monthlyUpdate: "মাসিক আপডেট:", lastUpdated: "সমস্ত ডেটা মাসিক আপডেট করা হয়। তারিখ:" },
    keyMetrics: { title: "মূল মেট্রিক্স", subtitle: "আমাদের পৌঁছানো এবং জড়িত সম্পর্কে গুরুত্বপূর্ণ মূল পরিসংখ্যান", monthlyVisitors: "মাসিক দর্শক", pageViews: "পৃষ্ঠা ভিউ", sessionDuration: "সেশন সময়কাল", bounceRate: "বাউন্স রেট", activeUsers: "সক্রিয় ব্যবহারকারী", perMonth: "প্রতি মাস", average: "গড়", lowBounceRate: "নিম্ন বাউন্স রেট" },
    detailedMetrics: { title: "বিস্তারিত মেট্রিক্স", subtitle: "ব্যবহারকারী আচরণ এবং পৌঁছানো সম্পর্কে অতিরিক্ত অন্তর্দৃষ্টি", pagesPerVisit: "প্রতি ভিজিটে পৃষ্ঠা", newVisitors: "নতুন দর্শক", returningVisitors: "ফিরে আসা দর্শক", reviewReadTime: "রিভিউ পড়ার সময়", firstTimeVisitors: "প্রথমবার দর্শক", loyalReadership: "বিশ্বস্ত পাঠক" },
    deviceGeography: { title: "ডিভাইস এবং ভূগোল", subtitle: "ডিভাইস প্রকার এবং ভৌগোলিক উত্স অনুযায়ী বিতরণ", mobileTraffic: "মোবাইল ট্র্যাফিক", desktopTraffic: "ডেস্কটপ ট্র্যাফিক", topCountry: "শীর্ষ দেশ", smartphoneTablet: "স্মার্টফোন এবং ট্যাবলেট", pcLaptop: "পিসি এবং ল্যাপটপ", mainOriginCountry: "মূল উত্স দেশ", primaryAudience: "প্রাথমিক শ্রোতা" },
    targetAudience: { title: "লক্ষ্য শ্রোতা", subtitle: "আমাদের পাঠক প্রযুক্তি-উৎসাহী এবং গেমিং-আগ্রহী ব্যক্তি", demographics: "জনসংখ্যা", demographicsDesc: "বয়স কাঠামো এবং লিঙ্গ বন্টন", interests: "আগ্রহ", interestsDesc: "আমাদের পাঠকদের প্রধান আগ্রহের ক্ষেত্র", age: "বয়স", genderDistribution: "লিঙ্গ বন্টন:", male: "পুরুষ", female: "মহিলা" },
    advertising: { title: "সম্ভাব্য বিজ্ঞাপন ফরম্যাট", subtitle: "এই ফরম্যাটগুলি ভবিষ্যতে উপলব্ধ হতে পারে (বর্তমানে উপলব্ধ নয়)", display: "ডিসপ্লে বিজ্ঞাপন", displayDesc: "ব্যানার এবং ভিজ্যুয়াল বিজ্ঞাপন ফরম্যাট", sponsoredContent: "স্পনসর করা সামগ্রী", sponsoredContentDesc: "সম্পাদকীয়ভাবে একীভূত সামগ্রী", newsletter: "নিউজলেটার এবং ইমেইল", newsletterDesc: "আমাদের সম্প্রদায়ের সাথে সরাসরি যোগাযোগ", video: "ভিডিও এবং পডকাস্ট", videoDesc: "মাল্টিমিডিয়া বিজ্ঞাপন ফরম্যাট", socialMedia: "সোশ্যাল মিডিয়া", socialMediaDesc: "ক্রস-প্ল্যাটফর্ম প্রচার", events: "ইভেন্ট এবং সহযোগিতা", eventsDesc: "দীর্ঘমেয়াদী অংশীদারিত্ব", currentlyNotAvailable: "বর্তমানে উপলব্ধ নয়", responsiveFormats: "রেসপন্সিভ ফরম্যাট", productPlacements: "পণ্য স্থাপন", dedicatedEmails: "নিবেদিত ইমেইল", productAnnouncements: "পণ্য ঘোষণা", eventPromotion: "ইভেন্ট প্রচার", preRollVideos: "প্রি-রোল ভিডিও", midRollPlacements: "মিড-রোল স্থাপন", podcastSponsoring: "পডকাস্ট স্পনসরিং", videoIntegration: "ভিডিও ইন্টিগ্রেশন", socialMediaPosts: "সোশ্যাল মিডিয়া পোস্ট", storyPlacements: "গল্প স্থাপন", influencerCooperations: "ইনফ্লুয়েন্সার সহযোগিতা", communityEngagement: "সম্প্রদায় জড়িত", eventSponsoring: "ইভেন্ট স্পনসরিং", productLaunches: "পণ্য লঞ্চ", exclusiveCooperations: "এক্সক্লুসিভ সহযোগিতা", brandPartnerships: "ব্র্যান্ড অংশীদারিত্ব" },
    content: { title: "সামগ্রী এবং সম্পাদকীয়", subtitle: "একটি জড়িত পাঠকের জন্য উচ্চ মানের সামগ্রী", strengths: "আমাদের শক্তি", professionalReviews: "পেশাদার রিভিউ", professionalReviewsDesc: "গেম এবং হার্ডওয়্যারের বিস্তারিত, স্বাধীন পরীক্ষা এবং মূল্যায়ন", currentTrends: "বর্তমান প্রবণতা", currentTrendsDesc: "নতুন উন্নয়ন এবং প্রযুক্তি সম্পর্কে নিয়মিত আপডেট", engagedCommunity: "জড়িত সম্প্রদায়", engagedCommunityDesc: "উচ্চ জড়িত এবং মিথস্ক্রিয়া হার সহ সক্রিয় পাঠক", dataDrivenInsights: "ডেটা-চালিত অন্তর্দৃষ্টি", dataDrivenInsightsDesc: "ব্যাপক পরীক্ষা এবং ডেটার উপর ভিত্তি করে সুচিন্তিত বিশ্লেষণ" },
    contact: { title: "যোগাযোগ", subtitle: "সহযোগিতা এবং অনুসন্ধানের জন্য", general: "সাধারণ:", forGames: "গেম:", forHardware: "হার্ডওয়্যার:", forMovies: "সিনেমা এবং সিরিজ:" },
    technical: { title: "প্রযুক্তিগত বৈশিষ্ট্য", adMaterialRequirements: "বিজ্ঞাপন উপাদান প্রয়োজনীয়তা", bannerFormats: "ব্যানার ফরম্যাট", videoFormats: "ভিডিও ফরম্যাট", maxFileSize: "সর্বোচ্চ ফাইল আকার:", animations: "অ্যানিমেশন:", preferredFormats: "রেসপন্সিভ ফরম্যাট পছন্দ", resolution: "রেজোলিউশন:", codec: "কোডেক:" },
    disclaimer: { text: "সমস্ত তথ্য গ্যারান্টি ছাড়া। মিডিয়া ডেটা নিয়মিত আপডেট করা হয় এবং পরিবর্তিত হতে পারে।", lastUpdated: "তারিখ:" },
  },
  pt: {
    meta: { title: "Kit de Mídia | Nerdiction", description: "Dados de mídia e informações publicitárias para parceiros publicitários e parceiros de cooperação" },
    header: { title: "Kit de Mídia", subtitle: "Informações sobre nosso alcance e público-alvo", backToHome: "Voltar ao início" },
    notice: { title: "Atualmente nenhum espaço publicitário disponível", description: "Atualmente não oferecemos espaço publicitário. Queremos permanecer independentes e não incomodar nossos usuários com publicidade!", futureNote: "Se isso mudar no futuro, comunicaremos de forma transparente.", cooperationLink: "página de cooperação" },
    updateNotice: { monthlyUpdate: "Atualização mensal:", lastUpdated: "Todos os dados são atualizados mensalmente. A partir de:" },
    keyMetrics: { title: "Métricas principais", subtitle: "Números importantes sobre nosso alcance e engajamento", monthlyVisitors: "Visitantes mensais", pageViews: "Visualizações de página", sessionDuration: "Duração da sessão", bounceRate: "Taxa de rejeição", activeUsers: "Usuários ativos", perMonth: "Por mês", average: "Média", lowBounceRate: "Baixa taxa de rejeição" },
    detailedMetrics: { title: "Métricas detalhadas", subtitle: "Mais informações sobre o comportamento do usuário e alcance", pagesPerVisit: "Páginas por visita", newVisitors: "Novos visitantes", returningVisitors: "Visitantes recorrentes", reviewReadTime: "Tempo de leitura da revisão", firstTimeVisitors: "Visitantes pela primeira vez", loyalReadership: "Leitores fiéis" },
    timeline: { title: "Linha do tempo de 12 meses", subtitle: "Desenvolvimento de visitantes mensais e visualizações de página nos últimos 12 meses", monthlyVisitors: "Visitantes mensais", pageViews: "Visualizações de página", max: "Máx:" },
    deviceGeography: { title: "Dispositivos e geografia", subtitle: "Distribuição por tipo de dispositivo e origem geográfica", mobileTraffic: "Tráfego móvel", desktopTraffic: "Tráfego de desktop", topCountry: "País principal", smartphoneTablet: "Smartphone e tablet", pcLaptop: "PC e laptop", mainOriginCountry: "País de origem principal", primaryAudience: "Audiência principal" },
    targetAudience: { title: "Público-alvo", subtitle: "Nossos leitores são entusiastas de tecnologia e indivíduos interessados em jogos", demographics: "Demografia", demographicsDesc: "Estrutura etária e distribuição de gênero", interests: "Interesses", interestsDesc: "Principais áreas de interesse dos nossos leitores", age: "Idade", genderDistribution: "Distribuição de gênero:", male: "masculino", female: "feminino" },
    advertising: { title: "Formatos publicitários potenciais", subtitle: "Esses formatos podem estar disponíveis no futuro (atualmente não disponíveis)", display: "Publicidade display", displayDesc: "Banners e formatos publicitários visuais", sponsoredContent: "Conteúdo patrocinado", sponsoredContentDesc: "Conteúdo integrado editorialmente", newsletter: "Newsletter e e-mail", newsletterDesc: "Contato direto com nossa comunidade", video: "Vídeo e podcast", videoDesc: "Formatos publicitários multimídia", socialMedia: "Redes sociais", socialMediaDesc: "Promoção multiplataforma", events: "Eventos e colaborações", eventsDesc: "Parcerias de longo prazo", currentlyNotAvailable: "Atualmente não disponível", responsiveFormats: "Formatos responsivos", productPlacements: "Colocações de produtos", dedicatedEmails: "E-mails dedicados", productAnnouncements: "Anúncios de produtos", eventPromotion: "Promoção de eventos", preRollVideos: "Vídeos pre-roll", midRollPlacements: "Colocações mid-roll", podcastSponsoring: "Patrocínio de podcasts", videoIntegration: "Integração de vídeo", socialMediaPosts: "Postagens nas redes sociais", storyPlacements: "Colocações de histórias", influencerCooperations: "Colaborações com influenciadores", communityEngagement: "Engajamento da comunidade", eventSponsoring: "Patrocínio de eventos", productLaunches: "Lançamentos de produtos", exclusiveCooperations: "Colaborações exclusivas", brandPartnerships: "Parcerias de marca" },
    content: { title: "Conteúdo e editorial", subtitle: "Conteúdo de alta qualidade para um público engajado", strengths: "Nossas forças", professionalReviews: "Avaliações profissionais", professionalReviewsDesc: "Testes e avaliações detalhadas e independentes de jogos e hardware", currentTrends: "Tendências atuais", currentTrendsDesc: "Atualizações regulares sobre os últimos desenvolvimentos e tecnologias", engagedCommunity: "Comunidade engajada", engagedCommunityDesc: "Público ativo com altas taxas de engajamento e interação", dataDrivenInsights: "Insights baseados em dados", dataDrivenInsightsDesc: "Análises fundamentadas baseadas em testes extensivos e dados" },
    contact: { title: "Contato", subtitle: "Para colaborações e consultas", general: "Geral:", forGames: "Jogos:", forHardware: "Hardware:", forMovies: "Filmes e Séries:" },
    technical: { title: "Especificações técnicas", adMaterialRequirements: "Requisitos de material publicitário", bannerFormats: "Formatos de banner", videoFormats: "Formatos de vídeo", maxFileSize: "Tamanho máximo do arquivo:", animations: "Animações:", preferredFormats: "Formatos responsivos preferidos", resolution: "Resolução:", codec: "Codec:" },
    disclaimer: { text: "Todas as informações são sem garantia. Os dados de mídia são atualizados regularmente e podem mudar.", lastUpdated: "A partir de:" },
  },
  ru: {
    meta: { title: "Медиаданные | Nerdiction", description: "Медиаданные и рекламная информация для рекламных партнеров и партнеров по сотрудничеству" },
    header: { title: "Медиаданные", subtitle: "Информация о нашем охвате и целевой аудитории", backToHome: "Вернуться на главную" },
    notice: { title: "В настоящее время рекламное пространство недоступно", description: "В настоящее время мы не предлагаем рекламное пространство. Мы хотим оставаться независимыми и не беспокоить наших пользователей рекламой!", futureNote: "Если это изменится в будущем, мы сообщим об этом прозрачно.", cooperationLink: "страницу сотрудничества" },
    updateNotice: { monthlyUpdate: "Ежемесячное обновление:", lastUpdated: "Все данные обновляются ежемесячно. По состоянию на:" },
    keyMetrics: { title: "Ключевые показатели", subtitle: "Важные показатели нашего охвата и вовлеченности", monthlyVisitors: "Ежемесячные посетители", pageViews: "Просмотры страниц", sessionDuration: "Продолжительность сессии", bounceRate: "Показатель отказов", activeUsers: "Активные пользователи", perMonth: "В месяц", average: "Среднее", lowBounceRate: "Низкий показатель отказов" },
    detailedMetrics: { title: "Детальные показатели", subtitle: "Дополнительная информация о поведении пользователей и охвате", pagesPerVisit: "Страниц за посещение", newVisitors: "Новые посетители", returningVisitors: "Возвращающиеся посетители", reviewReadTime: "Время чтения обзора", firstTimeVisitors: "Посетители впервые", loyalReadership: "Преданная аудитория" },
    timeline: { title: "Временная шкала за 12 месяцев", subtitle: "Развитие ежемесячных посетителей и просмотров страниц за последние 12 месяцев", monthlyVisitors: "Ежемесячные посетители", pageViews: "Просмотры страниц", max: "Макс:" },
    deviceGeography: { title: "Устройства и география", subtitle: "Распределение по типу устройства и географическому происхождению", mobileTraffic: "Мобильный трафик", desktopTraffic: "Десктопный трафик", topCountry: "Основная страна", smartphoneTablet: "Смартфон и планшет", pcLaptop: "ПК и ноутбук", mainOriginCountry: "Основная страна происхождения", primaryAudience: "Основная аудитория" },
    targetAudience: { title: "Целевая аудитория", subtitle: "Наши читатели - это технически подкованные энтузиасты и люди, интересующиеся играми", demographics: "Демография", demographicsDesc: "Возрастная структура и гендерное распределение", interests: "Интересы", interestsDesc: "Основные области интересов наших читателей", age: "Возраст", genderDistribution: "Гендерное распределение:", male: "мужской", female: "женский" },
    advertising: { title: "Потенциальные рекламные форматы", subtitle: "Эти форматы могут быть доступны в будущем (в настоящее время недоступны)", display: "Медийная реклама", displayDesc: "Баннеры и визуальные рекламные форматы", sponsoredContent: "Спонсорский контент", sponsoredContentDesc: "Редакционно интегрированный контент", newsletter: "Новостная рассылка и электронная почта", newsletterDesc: "Прямой контакт с нашим сообществом", video: "Видео и подкаст", videoDesc: "Мультимедийные рекламные форматы", socialMedia: "Социальные сети", socialMediaDesc: "Кросс-платформенное продвижение", events: "События и сотрудничество", eventsDesc: "Долгосрочные партнерства", currentlyNotAvailable: "В настоящее время недоступно", responsiveFormats: "Адаптивные форматы", productPlacements: "Размещение продуктов", dedicatedEmails: "Выделенные электронные письма", productAnnouncements: "Анонсы продуктов", eventPromotion: "Продвижение событий", preRollVideos: "Видео перед роликом", midRollPlacements: "Размещения в середине ролика", podcastSponsoring: "Спонсорство подкастов", videoIntegration: "Интеграция видео", socialMediaPosts: "Посты в социальных сетях", storyPlacements: "Размещения историй", influencerCooperations: "Сотрудничество с инфлюенсерами", communityEngagement: "Вовлеченность сообщества", eventSponsoring: "Спонсорство событий", productLaunches: "Запуски продуктов", exclusiveCooperations: "Эксклюзивное сотрудничество", brandPartnerships: "Партнерства брендов" },
    content: { title: "Контент и редакция", subtitle: "Высококачественный контент для вовлеченной аудитории", strengths: "Наши сильные стороны", professionalReviews: "Профессиональные обзоры", professionalReviewsDesc: "Подробные, независимые тесты и оценки игр и оборудования", currentTrends: "Текущие тенденции", currentTrendsDesc: "Регулярные обновления о последних разработках и технологиях", engagedCommunity: "Вовлеченное сообщество", engagedCommunityDesc: "Активная аудитория с высоким уровнем вовлеченности и взаимодействия", dataDrivenInsights: "Аналитика на основе данных", dataDrivenInsightsDesc: "Обоснованный анализ на основе обширных тестов и данных" },
    contact: { title: "Контакты", subtitle: "Для сотрудничества и запросов", general: "Общее:", forGames: "Игры:", forHardware: "Оборудование:", forMovies: "Фильмы и Сериалы:" },
    technical: { title: "Технические характеристики", adMaterialRequirements: "Требования к рекламным материалам", bannerFormats: "Форматы баннеров", videoFormats: "Форматы видео", maxFileSize: "Максимальный размер файла:", animations: "Анимации:", preferredFormats: "Предпочтительны адаптивные форматы", resolution: "Разрешение:", codec: "Кодек:" },
    disclaimer: { text: "Вся информация предоставляется без гарантий. Медиаданные регулярно обновляются и могут изменяться.", lastUpdated: "По состоянию на:" },
  },
  ja: {
    meta: { title: "メディアデータ | Nerdiction", description: "広告パートナーおよび協力パートナー向けのメディアデータと広告情報" },
    header: { title: "メディアデータ", subtitle: "リーチとターゲットオーディエンスに関する情報", backToHome: "ホームに戻る" },
    notice: { title: "現在広告スペースは利用できません", description: "現在、広告スペースは提供していません。独立を保ち、ユーザーを広告で煩わせたくありません！", futureNote: "将来的にこれが変更される場合は、透明性を持ってお知らせします。", cooperationLink: "協力ページ" },
    updateNotice: { monthlyUpdate: "月次更新:", lastUpdated: "すべてのデータは月次で更新されます。更新日:" },
    keyMetrics: { title: "主要指標", subtitle: "リーチとエンゲージメントに関する重要な主要指標", monthlyVisitors: "月間訪問者", pageViews: "ページビュー", sessionDuration: "セッション時間", bounceRate: "直帰率", activeUsers: "アクティブユーザー", perMonth: "月あたり", average: "平均", lowBounceRate: "低直帰率" },
    detailedMetrics: { title: "詳細指標", subtitle: "ユーザー行動とリーチに関する追加の洞察", pagesPerVisit: "訪問あたりのページ数", newVisitors: "新規訪問者", returningVisitors: "リピーター", reviewReadTime: "レビュー読了時間", firstTimeVisitors: "初回訪問者", loyalReadership: "忠実な読者層" },
    timeline: { title: "12ヶ月のタイムライン", subtitle: "過去12ヶ月間の月間訪問者数とページビューの推移", monthlyVisitors: "月間訪問者", pageViews: "ページビュー", max: "最大:" },
    deviceGeography: { title: "デバイスと地理", subtitle: "デバイスタイプと地理的起源による分布", mobileTraffic: "モバイルトラフィック", desktopTraffic: "デスクトップトラフィック", topCountry: "主要国", smartphoneTablet: "スマートフォンとタブレット", pcLaptop: "PCとラップトップ", mainOriginCountry: "主要発信国", primaryAudience: "主要オーディエンス" },
    targetAudience: { title: "ターゲットオーディエンス", subtitle: "読者は技術に精通した愛好家やゲームに興味のある人々です", demographics: "人口統計", demographicsDesc: "年齢構造と性別分布", interests: "興味", interestsDesc: "読者の主な関心分野", age: "年齢", genderDistribution: "性別分布:", male: "男性", female: "女性" },
    advertising: { title: "潜在的な広告フォーマット", subtitle: "これらのフォーマットは将来的に利用可能になる可能性があります（現在は利用不可）", display: "ディスプレイ広告", displayDesc: "バナーと視覚的な広告フォーマット", sponsoredContent: "スポンサーコンテンツ", sponsoredContentDesc: "編集統合コンテンツ", newsletter: "ニュースレターとメール", newsletterDesc: "コミュニティとの直接連絡", video: "動画とポッドキャスト", videoDesc: "マルチメディア広告フォーマット", socialMedia: "ソーシャルメディア", socialMediaDesc: "クロスプラットフォームプロモーション", events: "イベントとコラボレーション", eventsDesc: "長期的なパートナーシップ", currentlyNotAvailable: "現在利用不可", responsiveFormats: "レスポンシブフォーマット", productPlacements: "製品配置", dedicatedEmails: "専用メール", productAnnouncements: "製品発表", eventPromotion: "イベントプロモーション", preRollVideos: "プレロール動画", midRollPlacements: "ミッドロール配置", podcastSponsoring: "ポッドキャストスポンサー", videoIntegration: "動画統合", socialMediaPosts: "ソーシャルメディア投稿", storyPlacements: "ストーリー配置", influencerCooperations: "インフルエンサーコラボレーション", communityEngagement: "コミュニティエンゲージメント", eventSponsoring: "イベントスポンサー", productLaunches: "製品ローンチ", exclusiveCooperations: "独占コラボレーション", brandPartnerships: "ブランドパートナーシップ" },
    content: { title: "コンテンツと編集", subtitle: "エンゲージされた読者層のための高品質コンテンツ", strengths: "私たちの強み", professionalReviews: "プロフェッショナルレビュー", professionalReviewsDesc: "ゲームとハードウェアの詳細で独立したテストと評価", currentTrends: "現在のトレンド", currentTrendsDesc: "最新の開発と技術に関する定期的な更新", engagedCommunity: "エンゲージされたコミュニティ", engagedCommunityDesc: "高いエンゲージメントとインタラクション率を持つアクティブな読者層", dataDrivenInsights: "データ駆動型の洞察", dataDrivenInsightsDesc: "広範なテストとデータに基づく十分に検討された分析" },
    contact: { title: "連絡先", subtitle: "コラボレーションとお問い合わせ", general: "一般:", forGames: "ゲーム:", forHardware: "ハードウェア:", forMovies: "映画とシリーズ:" },
    technical: { title: "技術仕様", adMaterialRequirements: "広告素材要件", bannerFormats: "バナーフォーマット", videoFormats: "動画フォーマット", maxFileSize: "最大ファイルサイズ:", animations: "アニメーション:", preferredFormats: "レスポンシブフォーマット推奨", resolution: "解像度:", codec: "コーデック:" },
    disclaimer: { text: "すべての情報は保証なしです。メディアデータは定期的に更新され、変更される可能性があります。", lastUpdated: "更新日:" },
  },
  // Punjabi - using English as base (can be fully translated later)
  pa: {
    meta: { title: "ਮੀਡੀਆ ਡੇਟਾ | Nerdiction", description: "ਵਿਗਿਆਪਨ ਭਾਗੀਦਾਰਾਂ ਅਤੇ ਸਹਿਯੋਗ ਭਾਗੀਦਾਰਾਂ ਲਈ ਮੀਡੀਆ ਡੇਟਾ ਅਤੇ ਵਿਗਿਆਪਨ ਜਾਣਕਾਰੀ" },
    header: { title: "ਮੀਡੀਆ ਡੇਟਾ", subtitle: "ਸਾਡੀ ਪਹੁੰਚ ਅਤੇ ਟਾਰਗੇਟ ਦਰਸ਼ਕਾਂ ਬਾਰੇ ਜਾਣਕਾਰੀ", backToHome: "ਹੋਮ 'ਤੇ ਵਾਪਸ ਜਾਓ" },
    notice: { title: "ਵਰਤਮਾਨ ਵਿੱਚ ਕੋਈ ਵਿਗਿਆਪਨ ਸਥਾਨ ਉਪਲਬਧ ਨਹੀਂ", description: "ਅਸੀਂ ਵਰਤਮਾਨ ਵਿੱਚ ਵਿਗਿਆਪਨ ਸਥਾਨ ਪ੍ਰਦਾਨ ਨਹੀਂ ਕਰਦੇ। ਅਸੀਂ ਸੁਤੰਤਰ ਰਹਿਣਾ ਚਾਹੁੰਦੇ ਹਾਂ!", futureNote: "ਜੇ ਇਹ ਭਵਿੱਖ ਵਿੱਚ ਬਦਲਦਾ ਹੈ, ਅਸੀਂ ਇਸਨੂੰ ਪਾਰਦਰਸ਼ੀ ਢੰਗ ਨਾਲ ਸੰਚਾਰ ਕਰਾਂਗੇ।", cooperationLink: "ਸਹਿਯੋਗ ਪੰਨਾ" },
    updateNotice: { monthlyUpdate: "ਮਹੀਨਾਵਾਰ ਅਪਡੇਟ:", lastUpdated: "ਸਾਰਾ ਡੇਟਾ ਮਹੀਨਾਵਾਰ ਅਪਡੇਟ ਕੀਤਾ ਜਾਂਦਾ ਹੈ। ਤਾਰੀਖ:" },
    keyMetrics: { title: "ਮੁੱਖ ਮੈਟ੍ਰਿਕਸ", subtitle: "ਸਾਡੀ ਪਹੁੰਚ ਅਤੇ ਸ਼ਮੂਲੀਅਤ ਬਾਰੇ ਮਹੱਤਵਪੂਰਨ ਮੁੱਖ ਅੰਕੜੇ", monthlyVisitors: "ਮਹੀਨਾਵਾਰ ਵਿਜ਼ਿਟਰ", pageViews: "ਪੰਨਾ ਦ੍ਰਿਸ਼", sessionDuration: "ਸੈਸ਼ਨ ਮਿਆਦ", bounceRate: "ਬਾਊਂਸ ਰੇਟ", activeUsers: "ਸਰਗਰਮ ਉਪਭੋਗਤਾ", perMonth: "ਪ੍ਰਤੀ ਮਹੀਨਾ", average: "ਔਸਤ", lowBounceRate: "ਘੱਟ ਬਾਊਂਸ ਰੇਟ" },
    detailedMetrics: { title: "ਵਿਸਤ੍ਰਿਤ ਮੈਟ੍ਰਿਕਸ", subtitle: "ਉਪਭੋਗਤਾ ਵਿਵਹਾਰ ਅਤੇ ਪਹੁੰਚ ਬਾਰੇ ਵਾਧੂ ਸੂਝ", pagesPerVisit: "ਪ੍ਰਤੀ ਯਾਤਰਾ ਪੰਨੇ", newVisitors: "ਨਵੇਂ ਵਿਜ਼ਿਟਰ", returningVisitors: "ਵਾਪਸ ਆਉਣ ਵਾਲੇ ਵਿਜ਼ਿਟਰ", reviewReadTime: "ਸਮੀਖਿਆ ਪੜ੍ਹਨ ਦਾ ਸਮਾਂ", firstTimeVisitors: "ਪਹਿਲੀ ਵਾਰ ਵਿਜ਼ਿਟਰ", loyalReadership: "ਵਫ਼ਾਦਾਰ ਪਾਠਕ" },
    timeline: { title: "12 ਮਹੀਨਿਆਂ ਦੀ ਸਮਾਂ-ਰੇਖਾ", subtitle: "ਪਿਛਲੇ 12 ਮਹੀਨਿਆਂ ਵਿੱਚ ਮਹੀਨਾਵਾਰ ਵਿਜ਼ਿਟਰਾਂ ਅਤੇ ਪੰਨਾ ਦ੍ਰਿਸ਼ਾਂ ਦਾ ਵਿਕਾਸ", monthlyVisitors: "ਮਹੀਨਾਵਾਰ ਵਿਜ਼ਿਟਰ", pageViews: "ਪੰਨਾ ਦ੍ਰਿਸ਼", max: "ਅਧਿਕਤਮ:" },
    deviceGeography: { title: "ਡਿਵਾਈਸ ਅਤੇ ਭੂਗੋਲ", subtitle: "ਡਿਵਾਈਸ ਕਿਸਮ ਅਤੇ ਭੂਗੋਲਿਕ ਮੂਲ ਦੁਆਰਾ ਵੰਡ", mobileTraffic: "ਮੋਬਾਈਲ ਟ੍ਰੈਫਿਕ", desktopTraffic: "ਡੈਸਕਟਾਪ ਟ੍ਰੈਫਿਕ", topCountry: "ਸਿਖਰ ਦੇਸ਼", smartphoneTablet: "ਸਮਾਰਟਫੋਨ ਅਤੇ ਟੈਬਲੇਟ", pcLaptop: "ਪੀਸੀ ਅਤੇ ਲੈਪਟਾਪ", mainOriginCountry: "ਮੁੱਖ ਮੂਲ ਦੇਸ਼", primaryAudience: "ਮੁੱਖ ਦਰਸ਼ਕ" },
    targetAudience: { title: "ਟਾਰਗੇਟ ਦਰਸ਼ਕ", subtitle: "ਸਾਡੇ ਪਾਠਕ ਤਕਨਾਲੋਜੀ-ਪ੍ਰੇਮੀ ਉਤਸ਼ਾਹੀ ਅਤੇ ਗੇਮਿੰਗ-ਦਿਲਚਸਪੀ ਵਾਲੇ ਵਿਅਕਤੀ ਹਨ", demographics: "ਜਨਸੰਖਿਆ", demographicsDesc: "ਉਮਰ ਬਣਤਰ ਅਤੇ ਲਿੰਗ ਵੰਡ", interests: "ਦਿਲਚਸਪੀਆਂ", interestsDesc: "ਸਾਡੇ ਪਾਠਕਾਂ ਦੇ ਮੁੱਖ ਦਿਲਚਸਪੀ ਦੇ ਖੇਤਰ", age: "ਉਮਰ", genderDistribution: "ਲਿੰਗ ਵੰਡ:", male: "ਪੁਰਸ਼", female: "ਮਹਿਲਾ" },
    advertising: { title: "ਸੰਭਾਵੀ ਵਿਗਿਆਪਨ ਫਾਰਮੈਟ", subtitle: "ਇਹ ਫਾਰਮੈਟ ਭਵਿੱਖ ਵਿੱਚ ਉਪਲਬਧ ਹੋ ਸਕਦੇ ਹਨ (ਵਰਤਮਾਨ ਵਿੱਚ ਉਪਲਬਧ ਨਹੀਂ)", display: "ਡਿਸਪਲੇਅ ਵਿਗਿਆਪਨ", displayDesc: "ਬੈਨਰ ਅਤੇ ਵਿਜ਼ੂਅਲ ਵਿਗਿਆਪਨ ਫਾਰਮੈਟ", sponsoredContent: "ਸਪਾਂਸਰ ਕੀਤੀ ਸਮਗਰੀ", sponsoredContentDesc: "ਸੰਪਾਦਕੀ ਤੌਰ 'ਤੇ ਏਕੀਕ੍ਰਿਤ ਸਮਗਰੀ", newsletter: "ਨਿਊਜ਼ਲੈਟਰ ਅਤੇ ਈਮੇਲ", newsletterDesc: "ਸਾਡੇ ਕਮਿਊਨਿਟੀ ਨਾਲ ਸਿੱਧਾ ਸੰਪਰਕ", video: "ਵੀਡੀਓ ਅਤੇ ਪੋਡਕਾਸਟ", videoDesc: "ਮਲਟੀਮੀਡੀਆ ਵਿਗਿਆਪਨ ਫਾਰਮੈਟ", socialMedia: "ਸੋਸ਼ਲ ਮੀਡੀਆ", socialMediaDesc: "ਕਰਾਸ-ਪਲੇਟਫਾਰਮ ਪ੍ਰੋਮੋਸ਼ਨ", events: "ਇਵੈਂਟਸ ਅਤੇ ਸਹਿਯੋਗ", eventsDesc: "ਲੰਬੇ ਸਮੇਂ ਦੀ ਭਾਗੀਦਾਰੀ", currentlyNotAvailable: "ਵਰਤਮਾਨ ਵਿੱਚ ਉਪਲਬਧ ਨਹੀਂ", responsiveFormats: "ਜਵਾਬਦੇਹ ਫਾਰਮੈਟ", productPlacements: "ਉਤਪਾਦ ਪਲੇਸਮੈਂਟ", dedicatedEmails: "ਸਮਰਪਿਤ ਈਮੇਲ", productAnnouncements: "ਉਤਪਾਦ ਘੋਸ਼ਣਾਵਾਂ", eventPromotion: "ਇਵੈਂਟ ਪ੍ਰੋਮੋਸ਼ਨ", preRollVideos: "ਪ੍ਰੀ-ਰੋਲ ਵੀਡੀਓ", midRollPlacements: "ਮਿਡ-ਰੋਲ ਪਲੇਸਮੈਂਟ", podcastSponsoring: "ਪੋਡਕਾਸਟ ਸਪਾਂਸਰਿੰਗ", videoIntegration: "ਵੀਡੀਓ ਏਕੀਕਰਣ", socialMediaPosts: "ਸੋਸ਼ਲ ਮੀਡੀਆ ਪੋਸਟ", storyPlacements: "ਕਹਾਣੀ ਪਲੇਸਮੈਂਟ", influencerCooperations: "ਇਨਫਲੂਐਂਸਰ ਸਹਿਯੋਗ", communityEngagement: "ਕਮਿਊਨਿਟੀ ਸ਼ਮੂਲੀਅਤ", eventSponsoring: "ਇਵੈਂਟ ਸਪਾਂਸਰਿੰਗ", productLaunches: "ਉਤਪਾਦ ਲਾਂਚ", exclusiveCooperations: "ਵਿਸ਼ੇਸ਼ ਸਹਿਯੋਗ", brandPartnerships: "ਬ੍ਰਾਂਡ ਭਾਗੀਦਾਰੀ" },
    content: { title: "ਸਮਗਰੀ ਅਤੇ ਸੰਪਾਦਕੀ", subtitle: "ਇੱਕ ਸ਼ਾਮਲ ਪਾਠਕ ਲਈ ਉੱਚ-ਗੁਣਵੱਤਾ ਵਾਲੀ ਸਮਗਰੀ", strengths: "ਸਾਡੀਆਂ ਤਾਕਤਾਂ", professionalReviews: "ਪੇਸ਼ੇਵਰ ਸਮੀਖਿਆਵਾਂ", professionalReviewsDesc: "ਗੇਮਾਂ ਅਤੇ ਹਾਰਡਵੇਅਰ ਦੇ ਵਿਸਤ੍ਰਿਤ, ਸੁਤੰਤਰ ਟੈਸਟ ਅਤੇ ਮੁਲਾਂਕਣ", currentTrends: "ਮੌਜੂਦਾ ਰੁਝਾਨ", currentTrendsDesc: "ਨਵੀਨਤਮ ਵਿਕਾਸ ਅਤੇ ਤਕਨਾਲੋਜੀਆਂ ਬਾਰੇ ਨਿਯਮਿਤ ਅਪਡੇਟ", engagedCommunity: "ਸ਼ਾਮਲ ਕਮਿਊਨਿਟੀ", engagedCommunityDesc: "ਉੱਚ ਸ਼ਮੂਲੀਅਤ ਅਤੇ ਇੰਟਰਐਕਸ਼ਨ ਦਰਾਂ ਵਾਲੇ ਸਰਗਰਮ ਪਾਠਕ", dataDrivenInsights: "ਡੇਟਾ-ਚਾਲਿਤ ਸੂਝ", dataDrivenInsightsDesc: "ਵਿਆਪਕ ਟੈਸਟ ਅਤੇ ਡੇਟਾ 'ਤੇ ਆਧਾਰਿਤ ਸੋਚ-ਵਿਚਾਰ ਵਾਲਾ ਵਿਸ਼ਲੇਸ਼ਣ" },
    contact: { title: "ਸੰਪਰਕ", subtitle: "ਸਹਿਯੋਗ ਅਤੇ ਪੁੱਛਗਿੱਛ ਲਈ", general: "ਸਾਮਾਨਿਕ:", forGames: "ਗੇਮਾਂ:", forHardware: "ਹਾਰਡਵੇਅਰ:", forMovies: "ਫਿਲਮਾਂ ਅਤੇ ਸੀਰੀਜ਼:" },
    technical: { title: "ਤਕਨੀਕੀ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ", adMaterialRequirements: "ਵਿਗਿਆਪਨ ਸਮਗਰੀ ਲੋੜਾਂ", bannerFormats: "ਬੈਨਰ ਫਾਰਮੈਟ", videoFormats: "ਵੀਡੀਓ ਫਾਰਮੈਟ", maxFileSize: "ਅਧਿਕਤਮ ਫਾਈਲ ਸਾਈਜ਼:", animations: "ਐਨੀਮੇਸ਼ਨ:", preferredFormats: "ਜਵਾਬਦੇਹ ਫਾਰਮੈਟ ਤਰਜੀਹ", resolution: "ਰੈਜ਼ੋਲਿਊਸ਼ਨ:", codec: "ਕੋਡੇਕ:" },
    disclaimer: { text: "ਸਾਰੀ ਜਾਣਕਾਰੀ ਬਿਨਾਂ ਗਾਰੰਟੀ ਦੇ ਹੈ। ਮੀਡੀਆ ਡੇਟਾ ਨਿਯਮਿਤ ਤੌਰ 'ਤੇ ਅਪਡੇਟ ਕੀਤਾ ਜਾਂਦਾ ਹੈ ਅਤੇ ਬਦਲ ਸਕਦਾ ਹੈ।", lastUpdated: "ਤਾਰੀਖ:" },
  },
  // Javanese - using English as base (can be fully translated later)
  jv: {
    meta: { title: "Data Media | Nerdiction", description: "Data media lan informasi iklan kanggo mitra iklan lan mitra kerjasama" },
    header: { title: "Data Media", subtitle: "Informasi babagan jangkauan lan audiens target kita", backToHome: "Bali menyang Ngarep" },
    notice: { title: "Saiki ora ana ruang iklan sing kasedhiya", description: "Kita saiki ora nawakake ruang iklan. Kita pengin tetep mandiri!", futureNote: "Yen iki owah ing mangsa ngarep, kita bakal komunikasi kanthi transparan.", cooperationLink: "kaca kerjasama" },
    updateNotice: { monthlyUpdate: "Pembaruan saben wulan:", lastUpdated: "Kabeh data dianyari saben wulan. Tanggal:" },
    keyMetrics: { title: "Metrik Utama", subtitle: "Angka penting babagan jangkauan lan keterlibatan kita", monthlyVisitors: "Pengunjung Saben Wulan", pageViews: "Tampilan Kaca", sessionDuration: "Durasi Sesi", bounceRate: "Tingkat Pentalan", activeUsers: "Panganggo Aktif", perMonth: "Saben Wulan", average: "Rata-rata", lowBounceRate: "Tingkat Pentalan Rendah" },
    detailedMetrics: { title: "Metrik Rinci", subtitle: "Wawasan tambahan babagan prilaku panganggo lan jangkauan", pagesPerVisit: "Kaca saben Kunjungan", newVisitors: "Pengunjung Anyar", returningVisitors: "Pengunjung Balik", reviewReadTime: "Wektu Maca Review", firstTimeVisitors: "Pengunjung Pisanan", loyalReadership: "Pembaca Setia" },
    timeline: { title: "Timeline 12 Wulan", subtitle: "Perkembangan pengunjung saben wulan lan tampilan kaca sajrone 12 wulan pungkasan", monthlyVisitors: "Pengunjung Saben Wulan", pageViews: "Tampilan Kaca", max: "Maks:" },
    deviceGeography: { title: "Piranti & Geografi", subtitle: "Distribusi miturut jinis piranti lan asal geografis", mobileTraffic: "Lalu Lintas Mobile", desktopTraffic: "Lalu Lintas Desktop", topCountry: "Negara Utama", smartphoneTablet: "Smartphone & Tablet", pcLaptop: "PC & Laptop", mainOriginCountry: "Negara Asal Utama", primaryAudience: "Audiens Utama" },
    targetAudience: { title: "Audiens Target", subtitle: "Pembaca kita kalebu penggemar teknologi lan individu sing tertarik game", demographics: "Demografi", demographicsDesc: "Struktur umur lan distribusi gender", interests: "Kapentingan", interestsDesc: "Bidang kapentingan utama pembaca kita", age: "Umur", genderDistribution: "Distribusi Gender:", male: "lanang", female: "wadon" },
    advertising: { title: "Format Iklan Potensial", subtitle: "Format iki bisa kasedhiya ing mangsa ngarep (saiki ora kasedhiya)", display: "Iklan Display", displayDesc: "Banner lan format iklan visual", sponsoredContent: "Konten Sponsor", sponsoredContentDesc: "Konten sing terintegrasi kanthi editorial", newsletter: "Newsletter & Email", newsletterDesc: "Kontak langsung karo komunitas kita", video: "Video & Podcast", videoDesc: "Format iklan multimedia", socialMedia: "Media Sosial", socialMediaDesc: "Promosi Cross-Platform", events: "Acara & Kolaborasi", eventsDesc: "Kemitraan jangka panjang", currentlyNotAvailable: "Saiki ora kasedhiya", responsiveFormats: "Format Responsif", productPlacements: "Penempatan Produk", dedicatedEmails: "Email Khusus", productAnnouncements: "Pengumuman Produk", eventPromotion: "Promosi Acara", preRollVideos: "Video Pre-Roll", midRollPlacements: "Penempatan Mid-Roll", podcastSponsoring: "Sponsor Podcast", videoIntegration: "Integrasi Video", socialMediaPosts: "Posting Media Sosial", storyPlacements: "Penempatan Cerita", influencerCooperations: "Kolaborasi Influencer", communityEngagement: "Keterlibatan Komunitas", eventSponsoring: "Sponsor Acara", productLaunches: "Peluncuran Produk", exclusiveCooperations: "Kolaborasi Eksklusif", brandPartnerships: "Kemitraan Merek" },
    content: { title: "Konten & Editorial", subtitle: "Konten berkualitas tinggi kanggo pembaca sing terlibat", strengths: "Kekuatan Kita", professionalReviews: "Review Profesional", professionalReviewsDesc: "Tes lan evaluasi rinci lan independen saka game lan hardware", currentTrends: "Tren Saiki", currentTrendsDesc: "Pembaruan rutin babagan perkembangan lan teknologi anyar", engagedCommunity: "Komunitas sing Terlibat", engagedCommunityDesc: "Pembaca aktif kanthi tingkat keterlibatan lan interaksi sing dhuwur", dataDrivenInsights: "Wawasan Berbasis Data", dataDrivenInsightsDesc: "Analisis sing didasarke ing tes lan data ekstensif" },
    contact: { title: "Kontak", subtitle: "Kanggo kolaborasi lan pertanyaan", general: "Umum:", forGames: "Game:", forHardware: "Hardware:", forMovies: "Film lan Series:" },
    technical: { title: "Spesifikasi Teknis", adMaterialRequirements: "Persyaratan Materi Iklan", bannerFormats: "Format Banner", videoFormats: "Format Video", maxFileSize: "Ukuran File Maks:", animations: "Animasi:", preferredFormats: "Format responsif luwih disenengi", resolution: "Resolusi:", codec: "Codec:" },
    disclaimer: { text: "Kabeh informasi tanpa jaminan. Data media dianyari kanthi rutin lan bisa owah.", lastUpdated: "Tanggal:" },
  },
  // Wu Chinese - using Simplified Chinese as base
  wuu: {
    meta: { title: "媒体数据 | Nerdiction", description: "媒体数据和广告信息，适用于广告合作伙伴和合作合作伙伴" },
    header: { title: "媒体数据", subtitle: "关于我们的覆盖范围和目标受众的信息", backToHome: "返回首页" },
    notice: { title: "目前没有可用的广告位", description: "我们目前不提供广告位。我们希望保持独立，不想用广告打扰我们的用户！", futureNote: "如果将来发生变化，我们将透明地沟通。", cooperationLink: "合作页面" },
    updateNotice: { monthlyUpdate: "每月更新：", lastUpdated: "所有数据每月更新。截至：" },
    keyMetrics: { title: "核心指标", subtitle: "关于我们覆盖范围和参与度的重要关键数据", monthlyVisitors: "月度访客", pageViews: "页面浏览量", sessionDuration: "会话时长", bounceRate: "跳出率", activeUsers: "活跃用户", perMonth: "每月", average: "平均", lowBounceRate: "低跳出率" },
    detailedMetrics: { title: "详细指标", subtitle: "用户行为和覆盖范围的进一步洞察", pagesPerVisit: "每次访问页面数", newVisitors: "新访客", returningVisitors: "回访访客", reviewReadTime: "评测阅读时间", firstTimeVisitors: "首次访客", loyalReadership: "忠实读者群" },
    timeline: { title: "12个月时间线", subtitle: "过去12个月月度访客和页面浏览量的发展", monthlyVisitors: "月度访客", pageViews: "页面浏览量", max: "最大：" },
    deviceGeography: { title: "设备和地理", subtitle: "按设备类型和地理来源的分布", mobileTraffic: "移动流量", desktopTraffic: "桌面流量", topCountry: "主要国家", smartphoneTablet: "智能手机和平板电脑", pcLaptop: "PC和笔记本电脑", mainOriginCountry: "主要来源国家", primaryAudience: "主要受众" },
    targetAudience: { title: "目标受众", subtitle: "我们的读者群由技术爱好者和游戏爱好者组成", demographics: "人口统计", demographicsDesc: "年龄结构和性别分布", interests: "兴趣", interestsDesc: "我们读者的主要兴趣领域", age: "年龄", genderDistribution: "性别分布：", male: "男性", female: "女性" },
    advertising: { title: "潜在广告格式", subtitle: "这些格式将来可能可用（目前不可用）", display: "展示广告", displayDesc: "横幅和视觉广告格式", sponsoredContent: "赞助内容", sponsoredContentDesc: "编辑整合内容", newsletter: "新闻通讯和电子邮件", newsletterDesc: "与我们社区的直接联系", video: "视频和播客", videoDesc: "多媒体广告格式", socialMedia: "社交媒体", socialMediaDesc: "跨平台推广", events: "活动和合作", eventsDesc: "长期合作伙伴关系", currentlyNotAvailable: "目前不可用", responsiveFormats: "响应式格式", productPlacements: "产品植入", dedicatedEmails: "专用电子邮件", productAnnouncements: "产品公告", eventPromotion: "活动推广", preRollVideos: "前贴片视频", midRollPlacements: "中贴片位置", podcastSponsoring: "播客赞助", videoIntegration: "视频整合", socialMediaPosts: "社交媒体帖子", storyPlacements: "故事位置", influencerCooperations: "影响者合作", communityEngagement: "社区参与", eventSponsoring: "活动赞助", productLaunches: "产品发布", exclusiveCooperations: "独家合作", brandPartnerships: "品牌合作伙伴关系" },
    content: { title: "内容和编辑", subtitle: "为积极参与的读者群提供高质量内容", strengths: "我们的优势", professionalReviews: "专业评测", professionalReviewsDesc: "对游戏和硬件进行详细、独立的测试和评估", currentTrends: "当前趋势", currentTrendsDesc: "定期更新最新发展和技术", engagedCommunity: "积极参与的社区", engagedCommunityDesc: "具有高参与度和互动率的活跃读者群", dataDrivenInsights: "数据驱动的洞察", dataDrivenInsightsDesc: "基于广泛测试和数据的深入分析" },
    contact: { title: "联系方式", subtitle: "合作和咨询", general: "一般：", forGames: "游戏：", forHardware: "硬件：", forMovies: "电影和系列：" },
    technical: { title: "技术规格", adMaterialRequirements: "广告材料要求", bannerFormats: "横幅格式", videoFormats: "视频格式", maxFileSize: "最大文件大小：", animations: "动画：", preferredFormats: "首选响应式格式", resolution: "分辨率：", codec: "编解码器：" },
    disclaimer: { text: "所有信息均不保证。媒体数据会定期更新，可能会发生变化。", lastUpdated: "截至：" },
  },
  id: {
    meta: { title: "Data Media | Nerdiction", description: "Data media dan informasi iklan untuk mitra iklan dan mitra kerjasama" },
    header: { title: "Data Media", subtitle: "Informasi tentang jangkauan dan audiens target kami", backToHome: "Kembali ke Beranda" },
    notice: { title: "Saat ini tidak ada ruang iklan tersedia", description: "Kami saat ini tidak menawarkan ruang iklan. Kami ingin tetap independen dan tidak mengganggu pengguna kami dengan iklan!", futureNote: "Jika ini berubah di masa depan, kami akan mengkomunikasikannya secara transparan.", cooperationLink: "halaman kerjasama" },
    updateNotice: { monthlyUpdate: "Pembaruan bulanan:", lastUpdated: "Semua data diperbarui setiap bulan. Per:" },
    keyMetrics: { title: "Metrik Utama", subtitle: "Angka penting tentang jangkauan dan keterlibatan kami", monthlyVisitors: "Pengunjung Bulanan", pageViews: "Tayangan Halaman", sessionDuration: "Durasi Sesi", bounceRate: "Tingkat Pentalan", activeUsers: "Pengguna Aktif", perMonth: "Per Bulan", average: "Rata-rata", lowBounceRate: "Tingkat Pentalan Rendah" },
    detailedMetrics: { title: "Metrik Terperinci", subtitle: "Wawasan tambahan tentang perilaku pengguna dan jangkauan", pagesPerVisit: "Halaman per Kunjungan", newVisitors: "Pengunjung Baru", returningVisitors: "Pengunjung Kembali", reviewReadTime: "Waktu Membaca Ulasan", firstTimeVisitors: "Pengunjung Pertama Kali", loyalReadership: "Pembaca Setia" },
    timeline: { title: "Timeline 12 Bulan", subtitle: "Perkembangan pengunjung bulanan dan tayangan halaman selama 12 bulan terakhir", monthlyVisitors: "Pengunjung Bulanan", pageViews: "Tayangan Halaman", max: "Maks:" },
    deviceGeography: { title: "Perangkat & Geografi", subtitle: "Distribusi berdasarkan jenis perangkat dan asal geografis", mobileTraffic: "Lalu Lintas Mobile", desktopTraffic: "Lalu Lintas Desktop", topCountry: "Negara Utama", smartphoneTablet: "Smartphone & Tablet", pcLaptop: "PC & Laptop", mainOriginCountry: "Negara Asal Utama", primaryAudience: "Audiens Utama" },
    targetAudience: { title: "Audiens Target", subtitle: "Pembaca kami terdiri dari penggemar teknologi dan individu yang tertarik pada permainan", demographics: "Demografi", demographicsDesc: "Struktur usia dan distribusi gender", interests: "Minat", interestsDesc: "Bidang minat utama pembaca kami", age: "Usia", genderDistribution: "Distribusi Gender:", male: "laki-laki", female: "perempuan" },
    advertising: { title: "Format Iklan Potensial", subtitle: "Format ini mungkin tersedia di masa depan (saat ini tidak tersedia)", display: "Iklan Display", displayDesc: "Banner dan format iklan visual", sponsoredContent: "Konten Sponsor", sponsoredContentDesc: "Konten yang terintegrasi secara editorial", newsletter: "Newsletter & Email", newsletterDesc: "Kontak langsung dengan komunitas kami", video: "Video & Podcast", videoDesc: "Format iklan multimedia", socialMedia: "Media Sosial", socialMediaDesc: "Promosi Cross-Platform", events: "Acara & Kolaborasi", eventsDesc: "Kemitraan jangka panjang", currentlyNotAvailable: "Saat ini tidak tersedia", responsiveFormats: "Format Responsif", productPlacements: "Penempatan Produk", dedicatedEmails: "Email Khusus", productAnnouncements: "Pengumuman Produk", eventPromotion: "Promosi Acara", preRollVideos: "Video Pre-Roll", midRollPlacements: "Penempatan Mid-Roll", podcastSponsoring: "Sponsor Podcast", videoIntegration: "Integrasi Video", socialMediaPosts: "Posting Media Sosial", storyPlacements: "Penempatan Cerita", influencerCooperations: "Kolaborasi Influencer", communityEngagement: "Keterlibatan Komunitas", eventSponsoring: "Sponsor Acara", productLaunches: "Peluncuran Produk", exclusiveCooperations: "Kolaborasi Eksklusif", brandPartnerships: "Kemitraan Merek" },
    content: { title: "Konten & Editorial", subtitle: "Konten berkualitas tinggi untuk pembaca yang terlibat", strengths: "Kekuatan Kami", professionalReviews: "Ulasan Profesional", professionalReviewsDesc: "Tes dan evaluasi terperinci dan independen dari game dan perangkat keras", currentTrends: "Tren Saat Ini", currentTrendsDesc: "Pembaruan rutin tentang perkembangan dan teknologi terbaru", engagedCommunity: "Komunitas yang Terlibat", engagedCommunityDesc: "Pembaca aktif dengan tingkat keterlibatan dan interaksi yang tinggi", dataDrivenInsights: "Wawasan Berbasis Data", dataDrivenInsightsDesc: "Analisis yang didasarkan pada tes dan data ekstensif" },
    contact: { title: "Kontak", subtitle: "Untuk kolaborasi dan pertanyaan", general: "Umum:", forGames: "Game:", forHardware: "Hardware:", forMovies: "Film dan Series:" },
    technical: { title: "Spesifikasi Teknis", adMaterialRequirements: "Persyaratan Materi Iklan", bannerFormats: "Format Banner", videoFormats: "Format Video", maxFileSize: "Ukuran File Maks:", animations: "Animasi:", preferredFormats: "Format responsif lebih disukai", resolution: "Resolusi:", codec: "Codec:" },
    disclaimer: { text: "Semua informasi tanpa jaminan. Data media diperbarui secara teratur dan dapat berubah.", lastUpdated: "Per:" },
  },
};

