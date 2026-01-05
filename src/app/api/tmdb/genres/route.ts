import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { type } = await req.json();
    const apiKey = process.env.TMDB_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "TMDB_API_KEY is not set" }, { status: 500 });
    }

    const endpoint = type === "series" ? "tv" : "movie";
    const response = await axios.get(`https://api.themoviedb.org/3/genre/${endpoint}/list`, {
      params: {
        api_key: apiKey,
        language: "de-DE",
      },
    });

    return NextResponse.json(response.data.genres || []);
  } catch (error: any) {
    console.error("TMDB Genres Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

