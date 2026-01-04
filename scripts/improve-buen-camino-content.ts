import prisma from "../src/lib/prisma";

/**
 * Script to improve the table of contents and headings for the Buen Camino review
 * Run with: npx tsx scripts/improve-buen-camino-content.ts
 */

// Helper function to generate slug from text (matching rehype-slug behavior)
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

async function main() {
  const slug = "buen-camino-eine-emotionale-reise-zwischen-komik-und-familiendramen";
  
  const review = await prisma.review.findUnique({
    where: { slug },
  });

  if (!review) {
    console.error("Review not found");
    process.exit(1);
  }

  // Improved content with better headings and matching table of contents
  // Note: H1, H2, H3 can all be used in the content. The first H1 is the main title and won't appear in TOC.
  // All other H1, H2, H3 headings will appear in the table of contents.
  const improvedContent = `# Buen Camino - Eine emotionale Reise zwischen Komik und Familiendramen

## Inhaltsverzeichnis
1. [Einleitung: Eine Reise der Selbstfindung](#einleitung-eine-reise-der-selbstfindung)
2. [Handlung: Vom verwöhnten Erben zum verantwortungsvollen Vater](#handlung-vom-verwohnten-erben-zum-verantwortungsvollen-vater)
3. [Charaktere: Authentische Entwicklung ohne Klischees](#charaktere-authentische-entwicklung-ohne-klischees)
4. [Regie: Balance zwischen Komödie und Emotion](#regie-balance-zwischen-komodie-und-emotion)
5. [Visuelles: Die Magie des Jakobswegs](#visuelles-die-magie-des-jakobswegs)
6. [Soundtrack: Emotionale Begleitung einer Reise](#soundtrack-emotionale-begleitung-einer-reise)
7. [Themen: Zeitlose Werte und persönliches Wachstum](#themen-zeitlose-werte-und-personliches-wachstum)
8. [Fazit: Ein Film für die ganze Familie](#fazit-ein-film-fur-die-ganze-familie)

## Einleitung: Eine Reise der Selbstfindung

Mit "Buen Camino" präsentiert uns das italienische Kinoduo Indiana Production und Medusa Film eine herzerwärmende Komödie, die die bewährte Formel des verwöhnten Protagonisten auf eine spirituelle Reise schickt. Der Film nutzt den legendären Jakobsweg als Kulisse für eine Geschichte über Selbstfindung, familiäre Bindungen und die Entdeckung wahrer Werte jenseits materiellen Wohlstands.

![[IMAGE_1]]

## Handlung: Vom verwöhnten Erben zum verantwortungsvollen Vater

Die Prämisse von "Buen Camino" ist so klassisch wie effektiv: Checco, ein privilegierter Erbe, der bisher nur die Sonnenseiten des Lebens kennengelernt hat, wird durch die Suche nach seiner entfremdeten Tochter aus seiner Komfortzone gerissen. Der Jakobsweg wird dabei nicht nur zum geografischen, sondern auch zum metaphorischen Pfad seiner Transformation.

Die Erzählstruktur folgt den bewährten Mustern des Road-Movie-Genres, garniert mit italienischem Humor und familienfreundlichen Elementen. Dabei gelingt es dem Film, die 90-minütige Laufzeit sinnvoll zu nutzen, ohne dass die Geschichte gehetzt oder oberflächlich wirkt.

![[IMAGE_2]]

## Charaktere: Authentische Entwicklung ohne Klischees

Checcos Wandlung vom verwöhnten Lebemann zum verantwortungsbewussten Vater bildet das emotionale Herzstück des Films. Die Charakterentwicklung erfolgt organisch und vermeidet die Fallen allzu platter Klischees. Besonders gelungen ist die Art, wie der Film die Beziehung zwischen Vater und Tochter entwickelt, ohne dabei in sentimentale Übertreibung zu verfallen.

Die Nebenfiguren, die Checco auf seinem Weg begegnet, fungieren als Katalysatoren für seine persönliche Entwicklung und bringen jeweils eigene, authentische Geschichten mit, die den Film bereichern.

## Regie: Balance zwischen Komödie und Emotion

Die Regie zeigt ein feines Gespür für den Wechsel zwischen komödiantischen und emotionalen Momenten. Dabei wird nie der Respekt vor der spirituellen Bedeutung des Jakobswegs verloren, was dem Film eine angenehme Authentizität verleiht. Die Inszenierung profitiert von einer ausgewogenen Balance zwischen italienischer Leichtigkeit und universellen menschlichen Themen.

![[IMAGE_3]]

## Visuelles: Die Magie des Jakobswegs

Visuell profitiert "Buen Camino" erheblich von den atemberaubenden Landschaften des Jakobswegs. Die Kameraarbeit fängt sowohl die Weite der spanischen Landschaft als auch die intimen Momente zwischen den Charakteren ein. Besonders beeindruckend sind die Panoramaaufnahmen, die die transformative Kraft der Natur unterstreichen und dem Film eine fast dokumentarische Qualität verleihen.

## Soundtrack: Emotionale Begleitung einer Reise

Der Soundtrack unterstützt geschickt die emotionale Reise des Protagonisten, ohne dabei aufdringlich zu werden. Die Musik weiß, wann sie zurücktreten muss, um den natürlichen Klängen des Weges Raum zu geben, und wann sie die emotionalen Höhepunkte der Geschichte verstärken soll.

![[IMAGE_4]]

## Themen: Zeitlose Werte und persönliches Wachstum

"Buen Camino" behandelt zeitlose Themen wie Familienzusammengehalt, persönliches Wachstum und die Suche nach authentischen Werten in einer materialistischen Welt. Der Film vermeidet dabei Oberflächlichkeit und bietet sowohl jüngeren als auch erwachsenen Zuschauern Identifikationsmöglichkeiten.

Besonders gelungen ist die Art, wie der Film zeigt, dass wahre Veränderung Zeit braucht und nicht durch große Gesten, sondern durch kleine, alltägliche Entscheidungen erfolgt.

## Fazit: Ein Film für die ganze Familie

"Buen Camino" ist ein solider Familienfilm, der seine Zuschauer mit einer Mischung aus Humor, Herz und beeindruckenden Landschaftsaufnahmen unterhält. Während er keine revolutionären Neuerungen des Genres bietet, überzeugt er durch handwerkliche Solidität und eine authentische Emotionalität. Ein Film, der besonders in der Vorweihnachtszeit seine Wirkung entfaltet und zum gemeinsamen Filmabend einlädt.

![[IMAGE_5]]`;

  // Verify that all TOC links match the generated IDs
  const tocLinks = improvedContent.match(/\[([^\]]+)\]\(#([^\)]+)\)/g) || [];
  // Match all headings (H1-H6), but we'll filter them
  const allHeadings = improvedContent.match(/^(#{1,6})\s+(.+)$/gm) || [];
  
  // Filter out the first H1 (main title) and "Inhaltsverzeichnis" heading
  let firstH1Found = false;
  const contentHeadings = allHeadings.filter(h => {
    const match = h.match(/^(#{1,6})\s+(.+)$/);
    if (!match) return false;
    const level = match[1].length;
    const text = match[2].trim().toLowerCase();
    
    // Skip first H1 (main title)
    if (level === 1 && !firstH1Found) {
      firstH1Found = true;
      return false;
    }
    
    // Skip "Inhaltsverzeichnis" heading
    if (text.includes('inhaltsverzeichnis') || text.includes('table of contents')) {
      return false;
    }
    
    return true;
  });
  
  console.log("Verifying table of contents links...");
  let allMatch = true;
  
  for (let index = 0; index < tocLinks.length; index++) {
    const tocLink = tocLinks[index];
    const linkText = tocLink.match(/\[([^\]]+)\]/)?.[1];
    const linkId = tocLink.match(/\(#([^\)]+)\)/)?.[1];
    
    if (index < contentHeadings.length) {
      const match = contentHeadings[index].match(/^(#{1,6})\s+(.+)$/);
      if (!match) continue;
      const headingText = match[2].trim();
      const expectedId = generateSlug(headingText);
      
      if (linkId !== expectedId) {
        console.error(`Mismatch at index ${index}:`);
        console.error(`  TOC Link: "${linkText}"`);
        console.error(`  Heading: "${headingText}"`);
        console.error(`  Expected ID: "${expectedId}"`);
        console.error(`  Found ID: "${linkId}"`);
        allMatch = false;
      }
    }
  }
  
  if (!allMatch) {
    console.error("Table of contents links don't match headings. Please fix the script.");
    process.exit(1);
  }

  console.log("✓ All table of contents links match headings");
  console.log(`\nUpdating review: ${review.title}`);

  await prisma.review.update({
    where: { slug },
    data: {
      content: improvedContent,
    },
  });

  console.log("✓ Review content updated successfully!");
  console.log("\nImprovements made:");
  console.log("  - More descriptive and engaging headings");
  console.log("  - Fixed table of contents anchor links");
  console.log("  - Better section titles with descriptive subtitles");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
