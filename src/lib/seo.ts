export function generateReviewSchema(review: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": review.category === "game" ? "VideoGame" : "Product",
      "name": review.title,
      "image": review.images?.[0],
    },
    "author": {
      "@type": "Organization",
      "name": "Nerdiction",
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.score,
      "bestRating": 100,
      "worstRating": 0,
    },
    "datePublished": review.createdAt instanceof Date ? review.createdAt.toISOString() : undefined,
    "reviewBody": review.content,
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}

