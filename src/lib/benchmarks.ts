import { getTavilyClient, type TavilySearchResponse } from "@/lib/tavily";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { PCComponent } from "@/types/pc-build";

export interface BenchmarkResult {
  component: string;
  benchmark: string;
  score: number;
  unit?: string;
  source?: string;
}

export interface FPSResult {
  game: string;
  resolution: string;
  settings: string;
  fps: number;
  source?: string;
}

/**
 * Top 15 most popular games for benchmarking (2024-2025)
 */
export const TOP_GAMES = [
  "Cyberpunk 2077",
  "Baldur's Gate 3",
  "Alan Wake 2",
  "The Last of Us Part I",
  "Hogwarts Legacy",
  "Starfield",
  "Call of Duty: Modern Warfare III",
  "Counter-Strike 2",
  "Apex Legends",
  "Fortnite",
  "Grand Theft Auto V",
  "Red Dead Redemption 2",
  "Assassin's Creed Mirage",
  "Forza Horizon 5",
  "F1 24",
];

/**
 * Search for benchmark data for a hardware component
 */
export async function searchBenchmarks(
  componentName: string,
  componentType: string
): Promise<BenchmarkResult[]> {
  try {
    const query = `${componentName} ${componentType} benchmark test results performance`;
    
    const response = await getTavilyClient().search(query, {
      search_depth: "advanced",
      include_answer: true,
      include_images: false,
      include_raw_content: false,
      max_results: 10,
      include_domains: [
        "techradar.com",
        "tomshardware.com",
        "anandtech.com",
        "pcgamer.com",
        "guru3d.com",
        "computerbase.de",
        "golem.de",
        "heise.de",
        "hardware.info",
        "techspot.com",
        "techpowerup.com",
      ],
    });

    // Extract benchmark data from search results
    const benchmarks: BenchmarkResult[] = [];
    const content = response.results.map(r => r.content).join("\n\n");
    
    // Common benchmark patterns
    const benchmarkPatterns = [
      /(?:3DMark|Time Spy|Fire Strike).*?(\d+(?:,\d+)?)\s*(?:points?|score)/gi,
      /(?:Cinebench|R23|R24).*?(\d+(?:,\d+)?)\s*(?:points?|score)/gi,
      /(?:Geekbench|Single-Core|Multi-Core).*?(\d+(?:,\d+)?)\s*(?:points?|score)/gi,
      /(?:PassMark|CPU Mark|GPU Mark).*?(\d+(?:,\d+)?)\s*(?:points?|score)/gi,
    ];

    benchmarkPatterns.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const score = parseInt(match[1].replace(/,/g, ""));
        if (score > 0) {
          benchmarks.push({
            component: componentName,
            benchmark: match[0].split(/\s+/)[0],
            score,
            source: "Tavily Search",
          });
        }
      });
    });

    return benchmarks.slice(0, 5); // Return top 5 benchmarks
  } catch (error) {
    console.error(`Error searching benchmarks for ${componentName}:`, error);
    return [];
  }
}

/**
 * Search for FPS data for a GPU/CPU combination in specific games
 */
export async function searchFPSData(
  gpuName: string,
  cpuName: string,
  games: string[] = TOP_GAMES
): Promise<FPSResult[]> {
  try {
    const fpsResults: FPSResult[] = [];
    
    // Search for FPS data for each game
    for (const game of games.slice(0, 10)) { // Limit to 10 games to avoid rate limits
      try {
        const query = `${gpuName} ${cpuName} ${game} FPS benchmark 1080p 1440p 4K performance`;
        
        const response = await getTavilyClient().search(query, {
          search_depth: "basic",
          include_answer: true,
          include_images: false,
          include_raw_content: false,
          max_results: 5,
          include_domains: [
            "techradar.com",
            "tomshardware.com",
            "pcgamer.com",
            "guru3d.com",
            "computerbase.de",
            "techspot.com",
            "techpowerup.com",
            "youtube.com", // Many benchmark videos on YouTube
          ],
        });

        const content = response.results.map(r => r.content).join("\n\n");
        
        // Extract FPS data for different resolutions
        const resolutions = [
          { name: "1080p", pattern: /1080p.*?(\d+)\s*fps/gi },
          { name: "1440p", pattern: /1440p.*?(\d+)\s*fps/gi },
          { name: "4K", pattern: /4k.*?(\d+)\s*fps/gi },
        ];

        resolutions.forEach(({ name, pattern }) => {
          const matches = [...content.matchAll(pattern)];
          if (matches.length > 0) {
            // Get average FPS or highest FPS
            const fpsValues = matches.map(m => parseInt(m[1])).filter(f => f > 0 && f < 500);
            if (fpsValues.length > 0) {
              const avgFps = Math.round(
                fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length
              );
              
              fpsResults.push({
                game,
                resolution: name,
                settings: "Ultra",
                fps: avgFps,
                source: "Tavily Search",
              });
            }
          }
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`Error searching FPS for ${game}:`, error);
      }
    }

    return fpsResults;
  } catch (error) {
    console.error(`Error searching FPS data:`, error);
    return [];
  }
}

/**
 * Estimate FPS using AI based on GPU/CPU specs and game requirements
 */
export async function estimateFPSWithAI(
  gpuName: string,
  cpuName: string,
  games: string[] = TOP_GAMES
): Promise<FPSResult[]> {
  try {
    const gpu = gpuName;
    const cpu = cpuName;
    
    const prompt = `Estimate average FPS for the following GPU/CPU combination in these games at 1080p Ultra settings:

GPU: ${gpu}
CPU: ${cpu}

Games:
${games.map((g, i) => `${i + 1}. ${g}`).join("\n")}

For each game, provide:
- Game name
- Estimated FPS (as a number)
- Brief reasoning (one sentence)

Format as JSON array:
[
  {
    "game": "Game Name",
    "fps": 120,
    "reasoning": "Brief explanation"
  }
]

Only return valid JSON, no markdown formatting.`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a hardware performance expert. Provide accurate FPS estimates based on GPU/CPU capabilities and game requirements.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    // Parse JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const results = JSON.parse(jsonMatch[0]) as Array<{
        game: string;
        fps: number;
        reasoning?: string;
      }>;

      return results.map(r => ({
        game: r.game,
        resolution: "1080p",
        settings: "Ultra",
        fps: Math.round(r.fps),
        source: "AI Estimate",
      }));
    }

    return [];
  } catch (error) {
    console.error("Error estimating FPS with AI:", error);
    return [];
  }
}

/**
 * Get benchmarks and FPS for a PC build
 */
export async function getBuildPerformance(
  components: PCComponent[]
): Promise<{
  benchmarks: BenchmarkResult[];
  fpsResults: FPSResult[];
}> {
  const gpu = components.find(c => c.type === "GPU");
  const cpu = components.find(c => c.type === "CPU");

  const benchmarks: BenchmarkResult[] = [];
  const fpsResults: FPSResult[] = [];

  // Get benchmarks for GPU and CPU
  if (gpu) {
    const gpuBenchmarks = await searchBenchmarks(gpu.name, "GPU");
    benchmarks.push(...gpuBenchmarks);
  }

  if (cpu) {
    const cpuBenchmarks = await searchBenchmarks(cpu.name, "CPU");
    benchmarks.push(...cpuBenchmarks);
  }

  // Get FPS data if both GPU and CPU are available
  if (gpu && cpu) {
    // Try to get real FPS data first
    const realFPS = await searchFPSData(gpu.name, cpu.name);
    
    if (realFPS.length > 0) {
      fpsResults.push(...realFPS);
    } else {
      // Fallback to AI estimation
      const estimatedFPS = await estimateFPSWithAI(gpu.name, cpu.name);
      fpsResults.push(...estimatedFPS);
    }
  }

  return {
    benchmarks: benchmarks.slice(0, 10), // Limit to 10 benchmarks
    fpsResults: fpsResults.slice(0, 15), // Limit to 15 FPS results
  };
}
