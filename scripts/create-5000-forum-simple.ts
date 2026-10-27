import "dotenv/config";
import prisma from "@/lib/prisma";

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomDateInPast(daysBack: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - randomInt(1, daysBack) * 24 * 60 * 60 * 1000);
  past.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59), randomInt(0, 999));
  return past;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim() + "-" + randomInt(1000, 9999);
}

const usernames = [
  "GamerJörg92", "PixelQueen", "CineMax", "SerienFan2000", "xX_DarkPhoenix_Xx",
  "NerdLight", "CouchPotato42", "RetroKing", "Konsolenkind", "PCMasterRace88",
  "FilmNerdBerlin", "RageQuitter", "LootGoblin", "NoobSlayer69", "CtrlAltElite",
  "BackseatGamer", "StorymodeMain", "HardcoreCasual", "SpoilerAlert", "MidnightMarauder",
  "ByteBrawler", "DungeonDad", "JRPGVet", "CoD_Chris", "AnimeOtaku23",
  "TaktikTobi", "BingeWatcher", "NetflixNinja", "VHS_Viking", "OldschoolOlli"
];

const gamingTitles = [
  "Ist Elden Ring wirklich so gut wie alle sagen?",
  "Welche Spiele habt ihr dieses Jahr komplett durchgespielt?",
  "GTA 6 - zu viel Hype oder berechtigt?",
  "Hat noch jemand Probleme mit dem neuen Patch?",
  "Warum wird Andor so gehyped aber kaum jemand redet drüber?",
  "PS5 oder Xbox Series X - was lohnt sich 2026?",
  "Habt ihr noch Bock auf Live Service Games?",
  "Welches Spiel hat euch am meisten gefrustet?",
  "Nostalgie: Welches Spiel würdet ihr heute nochmal zocken?",
  "Warum sind Soulslike so verdammt süchtig?",
];

const movieTitles = [
  "Welcher Film hat euch zuletzt richtig umgehauen?",
  "Superheldenfilme - immer noch gut oder tot?",
  "Welche Geheimtipps habt ihr so?",
  "Horrorfilme die ihr empfehlen könnt?",
  "Klassiker die man gesehen haben muss?",
];

const seriesTitles = [
  "Welche Serie habt ihr dieses Jahr verschlungen?",
  "Breaking Bad vs Better Call Saul - welches gewinnt?",
  "Streaming zu teuer geworden?",
  "Welche Serie habt ihr abgebrochen und warum?",
  "Miniserien vs lange Serien - was bevorzugt ihr?",
];

const gamingContents = [
  "Hab Elden Ring jetzt seit 80 Stunden und bin immer noch nicht durch. Irgendwie schaffe ich es nie, direkt zum nächsten Boss zu gehen ohne erst 3 Stunden erkunden.",
  "Nach dem letzten Patch läuft das bei mir deutlich besser. Vorher hatte ich ständige Drops, jetzt geht's einigermaßen. Hat bei euch auch was geändert?",
  "Kann mich nicht entscheiden. Auf der einen Seite will ich alles erleben, auf der anderen hab ich keine Zeit mehr für 100h Spiele wie früher.",
  "Bin gestern erstmal an Margit gescheitert und war kurz davor aufzuhören. Heute morgen hab ich's dann doch geschafft und war überglücklich. Kennt das jemand?",
  "Frage mich echt, ob der ganze Hype gerechtfertigt ist oder ob wir einfach nur kollektiv drauf reinfallen.",
];

const comments = [
  "genau das denk ich auch",
  "bei mir wars ähnlich, hab ewig gebraucht",
  "nee, find das ganz anders",
  "same hier",
  "hab das damals durchgezockt, kann dir nur zustimmen",
  "ja total, das nervt mich auch",
  "weiß nicht, ich fand's eigentlich ganz gut",
  "trifft den Nagel auf den Kopf",
  "+1",
  "kann ich nur bestätigen",
  "geht mir genauso",
  "bin anderer Meinung, aber versteh deinen Punkt",
];

async function main() {
  console.log("🚀 Creating 5000 forum posts directly...");
  
  const categories = ["gaming", "movies", "series"] as const;
  const totalPosts = 5000;
  const postsPerCategory = Math.floor(totalPosts / categories.length);
  
  let totalThreads = 0;
  let totalComments = 0;
  
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const threadCount = postsPerCategory + (i === 0 ? totalPosts % categories.length : 0);
    
    console.log(`\n📝 Creating ${threadCount} threads for ${cat}...`);
    
    for (let t = 0; t < threadCount; t++) {
      try {
        let titles: string[], contents: string[];
        if (cat === "gaming") {
          titles = gamingTitles;
          contents = gamingContents;
        } else if (cat === "movies") {
          titles = movieTitles;
          contents = gamingContents; // reuse
        } else {
          titles = seriesTitles;
          contents = gamingContents;
        }
        
        const title = titles[randomInt(0, titles.length - 1)] + " " + randomInt(1, 999);
        const content = contents[randomInt(0, contents.length - 1)] + " " + 
          "Manchmal fragt man sich schon wie viel Zeit man da reinsteckt. " +
          (randomInt(0,1) ? "Findet ihr das noch normal?" : "Ist das gesund?");
        const excerpt = content.substring(0, 120) + "...";
        const author = usernames[randomInt(0, usernames.length - 1)];
        
        const createdAt = randomDateInPast(randomInt(7, 180));
        const slug = slugify(title);
        
        const thread = await prisma.forumThread.create({
          data: {
            title: title.replace(" " + title.split(" ").pop(), ""), // clean up
            slug,
            category: cat,
            content,
            excerpt,
            author,
            viewCount: randomInt(10, 2000),
            score: randomInt(-2, 20),
            createdAt,
            lastActivityAt: createdAt,
          },
        });
        totalThreads++;
        
        // Add random replies
        const replyCount = randomInt(2, 30);
        const commentData = [];
        for (let c = 0; c < replyCount; c++) {
          const commentTime = new Date(createdAt.getTime() + randomInt(1, 72) * 60 * 60 * 1000);
          commentData.push({
            threadId: thread.id,
            text: comments[randomInt(0, comments.length - 1)] + (randomInt(0,3) === 0 ? " echt so" : ""),
            author: usernames[randomInt(0, usernames.length - 1)],
            isAiGenerated: true,
            status: "approved",
            createdAt: commentTime,
            score: randomInt(-1, 15),
          });
        }
        await prisma.forumComment.createMany({ data: commentData });
        totalComments += replyCount;
        
        await prisma.forumThread.update({
          where: { id: thread.id },
          data: { 
            commentCount: replyCount,
            lastActivityAt: commentData[commentData.length - 1].createdAt,
          },
        });
        
        if ((t + 1) % 100 === 0) {
          console.log(`  ${t + 1}/${threadCount} erstellt...`);
        }
      } catch (e) {
        // Skip errors
      }
    }
  }
  
  console.log(`\n✨ Fertig! ${totalThreads} Posts, ${totalComments} Antworten erstellt`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
