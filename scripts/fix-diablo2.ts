import prisma from "../src/lib/prisma";

async function main() {
  const slug = "diablo-4-mw31rtsf";
  const review = await prisma.review.findUnique({ where: { slug: slug } });
  if (!review) {
    console.log("not found");
    return;
  }

  const content = `# Diablo 4

## Inhaltsverzeichnis

- [Einleitung](#einleitung)
- [Story & Kampagne](#story-kampagne)
- [Gameplay & Klassen](#gameplay-klassen)
- [Open World & Endgame](#open-world-endgame)
- [Grafik & Technik](#grafik-technik)
- [Sound & Atmosphäre](#sound-atmosphaere)
- [Progression & Loot](#progression-loot)
- [Multiplayer](#multiplayer)
- [Vor- und Nachteile](#vor-und-nachteile)
- [Fazit](#fazit)

## Einleitung {#einleitung}

Diablo 4 kehrt zur dunklen, blutigen Essenz der Reihe zurück und liefert ein actionreiches Hack'n'Slay mit einer riesigen offenen Welt. Der neueste Teil der ikonischen Serie setzt dabei stärker denn je auf Atmosphäre, Brutalität und eine ausgedehnte Endgame-Schleife.

## Story & Kampagne {#story-kampagne}

Die Kampagne von Diablo 4 ist die bisher reifste der Serie. Lilith, die Tochter Mephistos, kehrt nach Sanctuary zurück und entfesselt eine neue Welle des Schreckens. Die Erzählung ist düster, erwachsen und verleiht der Handlung mehr Gewicht als in den vorherigen Teilen. Charaktere wirken glaubwürdiger und die Inszenierung ist sehenswert.

## Gameplay & Klassen {#gameplay-klassen}

Diablo 4 bietet zum Launch fünf Klassen mit jeweils eigenem Spielstil. Jede Klasse fühlt sich unterschiedlich an und bietet zahlreiche Build-Möglichkeiten durch Skills, Talente und Aspekte. Das Kampfsystem ist knackig, befriedigend und fühlt sich schwerfällig genug, um Gewicht zu verleihen, ohne träge zu wirken.

## Open World & Endgame {#open-world-endgame}

Sanctuary ist riesig und voller Dungeons, Events, Altäre von Lilith und versteckter Geheimnisse. Das Endgame bildet den Kern des Spiels: Nightmare-Dungeons, Helltide-Events, Weltbosse und später Whispers of the Dead sorgen für langanhaltenden Spielspaß. Die Content-Schleife ist süchtig machend.

## Grafik & Technik {#grafik-technik}

Diablo 4 sieht fantastisch aus. Die düstere Gothic-Ästhetik wird hervorragend umgesetzt mit beeindruckender Beleuchtung, detaillierten Umgebungen und blutigen Effekten. Auf leistungsstarker Hardware läuft das Spiel größtenteils stabil, kleinere Performance-Schwankungen können je nach Konfiguration vorkommen.

## Sound & Atmosphäre {#sound-atmosphaere}

Der Soundtrack ist hervorragend und unterstreicht perfekt die bedrohliche Atmosphäre. Effekte, Monstergeräusche und Dialoge tragen zur Immersion bei. Diablo 4 ist eines der atmosphärischsten Spiele der Reihe.

## Progression & Loot {#progression-loot}

Das Loot-System wurde überarbeitet und ist deutlich befriedigender als in Diablo 3 zum Launch. Das Finden seltener Items bereitet Freude und das Paragon-System bietet nach Erreichen der Maximalstufe noch viele Entwicklungsmöglichkeiten. Gear-Hunting bleibt motivierend.

## Multiplayer {#multiplayer}

Diablo 4 kann solo oder im Koop mit bis zu vier Spielern gespielt werden. Der gemeinsame Spielspaß funktioniert gut, wobei die Balance für Solo und Gruppe gut gelungen ist. Öffentliche Events laden zum spontanen Mitspielen ein.

## Vor- und Nachteile {#vor-und-nachteile}

**Pros:**
- Hervorragende düstere Atmosphäre
- Befriedigendes Kampfsystem
- Umfangreiches Endgame
- Tolle Klassenvielfalt mit Build-Möglichkeiten
- Schöne Grafik und exzellenter Sound

**Cons:**
- Manche Microtransactions wirken aufdringlich
- Serverprobleme zum Launch
- Grind kann sich repetitiv anfühlen
- Balance kann zwischen Patches schwanken
- Einige Endgame-Aktivitäten wiederholen sich

## Fazit {#fazit}

Diablo 4 ist eine gelungene Rückkehr zur dunklen Wurzel der Reihe. Mit starker Atmosphäre, befriedigendem Gameplay und einem umfangreichen Endgame liefert Blizzard einen der besten Teile der Serie. Trotz kleiner Schwächen ist es eine klare Empfehlung für Fans von Hack'n'Slay-Spielen.`;

  await prisma.review.update({
    where: { id: review.id },
    data: {
      content: content,
      content_en: content,
      score: 90,
      pros: ["Hervorragende düstere Atmosphäre", "Befriedigendes Kampfsystem", "Umfangreiches Endgame", "Tolle Klassenvielfalt mit Build-Möglichkeiten", "Schöne Grafik und exzellenter Sound"],
      cons: ["Manche Microtransactions wirken aufdringlich", "Serverprobleme zum Launch", "Grind kann sich repetitiv anfühlen", "Balance kann zwischen Patches schwanken", "Einige Endgame-Aktivitäten wiederholen sich"],
    },
  });

  console.log("done", content.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
