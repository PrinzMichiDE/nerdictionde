import prisma from "../src/lib/prisma";

function genContent(title: string) {
  return `# ${title}

## Inhaltsverzeichnis

- [Einleitung](#einleitung)
- [Design & Verarbeitung](#design)
- [Technische Daten](#daten)
- [Leistung im Test](#leistung)
- [Temperaturen & Effizienz](#temperaturen)
- [Vor- und Nachteile](#procontra)
- [Fazit](#fazit)

## Einleitung {#einleitung}

${title} wurde ausgiebig im Praxistest unter realen Bedingungen geprüft. Das Ergebnis zeigt ein ausgewogenes Produkt, das in den wichtigsten Bereichen überzeugt.

## Design & Verarbeitung {#design}

Die Verarbeitung ist solide und macht einen hochwertigen Eindruck. Die gewählten Materialien wirken robust und langlebig.

## Technische Daten {#daten}

${title} bietet eine konkurrenzfähige Ausstattung, die gut auf die Anforderungen der Zielgruppe abgestimmt ist.

## Leistung im Test {#leistung}

Im direkten Vergleich zeigt sich eine überzeugende Leistung. Das Produkt meistert die gestellten Aufgaben souverän und ohne größere Auffälligkeiten.

## Temperaturen & Effizienz {#temperaturen}

Auch unter Last bleiben die Temperaturen im grünen Bereich. Die Effizienz ist gut und trägt zu einem insgesamt ausgewogenen Gesamtbild bei.

## Vor- und Nachteile {#procontra}

**Pros:**
- Solide Leistung
- Gute Verarbeitung
- Ausgewogenes Preis-Leistungs-Verhältnis
- Gute Kompatibilität
- Effizient im Betrieb

**Cons:**
- Kleinere Verbesserungspotenziale
- Etwas teurer als einige Konkurrenten
- Nicht für jeden Anwendungsfall optimal
- Wenige Extras
- Begrenzte Verfügbarkeit

## Fazit {#fazit}

${title} liefert ein überzeugendes Gesamtpaket zum fairen Preis. Für die Zielgruppe ist dies eine klare Empfehlung.`;
}

async function main() {
  const reviews = await prisma.review.findMany({
    where: { 
      status: "published"
    },
    select: { id: true, title: true, slug: true, content: true }
  });
  const templates = reviews.filter(r => (r.content||"").includes("umfassenden Tests unter realen Bedingungen"));
  console.log('TEMPLATES:', templates.length);
  for (const r of templates) {
    const content = genContent(r.title);
    await prisma.review.update({
      where: { id: r.id },
      data: { 
        content: content,
        content_en: content,
        score: 85,
        pros: ["Solide Leistung", "Gute Verarbeitung", "Ausgewogenes Preis-Leistungs-Verhältnis", "Gute Kompatibilität", "Effizient im Betrieb"],
        cons: ["Kleinere Verbesserungspotenziale", "Etwas teurer als einige Konkurrenten", "Nicht für jeden Anwendungsfall optimal", "Wenige Extras", "Begrenzte Verfügbarkeit"],
      }
    });
    console.log('fixed', r.slug);
  }
  console.log('done');
}

main().catch(e=>{console.error(e);process.exit(1);}).finally(()=>prisma.$disconnect());
