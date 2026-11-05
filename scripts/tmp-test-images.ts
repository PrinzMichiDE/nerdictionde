import "../src/lib/prisma";
import { searchTMDBSeries, searchTMDBMovies } from "../src/lib/tmdb";

async function main() {
  for (const q of ["The Bear", "Dark", "Shogun", "Fallout", "Severance"]) {
    try {
      const s = await searchTMDBSeries(q, 10);
      console.log("SERIES", q, JSON.stringify(s.map((x) => ({ name: x.name, orig: x.original_name, id: x.id, date: x.first_air_date }))));
    } catch (e: any) {
      console.error("FAIL", q, e.message);
    }
  }
  for (const q of ["Civil War", "Anora", "Wicked", "Dune: Part Two"]) {
    try {
      const m = await searchTMDBMovies(q, 10);
      console.log("MOVIE", q, JSON.stringify(m.map((x) => ({ title: x.title, orig: x.original_title, id: x.id, date: x.release_date }))));
    } catch (e: any) {
      console.error("FAIL", q, e.message);
    }
  }
}
main();
