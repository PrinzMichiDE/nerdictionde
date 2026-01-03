import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, Cpu, ShoppingCart, Film, Tv, ArrowRight } from "lucide-react";

interface CategoryLink {
  name: string;
  nameEn: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  hoverColor: string;
}

const categories: CategoryLink[] = [
  {
    name: "Games",
    nameEn: "Games",
    href: "/reviews?category=game",
    icon: <Gamepad2 className="h-8 w-8" />,
    description: "Umfassende Reviews zu den neuesten Spielen",
    color: "from-blue-500/10 to-blue-600/5",
    hoverColor: "hover:from-blue-500/20 hover:to-blue-600/10",
  },
  {
    name: "Filme",
    nameEn: "Movies",
    href: "/reviews?category=movie",
    icon: <Film className="h-8 w-8" />,
    description: "Professionelle Film-Reviews und Kritiken",
    color: "from-red-500/10 to-red-600/5",
    hoverColor: "hover:from-red-500/20 hover:to-red-600/10",
  },
  {
    name: "Serien",
    nameEn: "Series",
    href: "/reviews?category=series",
    icon: <Tv className="h-8 w-8" />,
    description: "Detaillierte Serien-Reviews und Analysen",
    color: "from-green-500/10 to-green-600/5",
    hoverColor: "hover:from-green-500/20 hover:to-green-600/10",
  },
  {
    name: "Hardware",
    nameEn: "Hardware",
    href: "/reviews?category=hardware",
    icon: <Cpu className="h-8 w-8" />,
    description: "Detaillierte Tests von Gaming-Hardware",
    color: "from-purple-500/10 to-purple-600/5",
    hoverColor: "hover:from-purple-500/20 hover:to-purple-600/10",
  },
  {
    name: "Amazon",
    nameEn: "Amazon",
    href: "/reviews?category=amazon",
    icon: <ShoppingCart className="h-8 w-8" />,
    description: "Produktreviews direkt von Amazon",
    color: "from-orange-500/10 to-orange-600/5",
    hoverColor: "hover:from-orange-500/20 hover:to-orange-600/10",
  },
];

export function CategoryQuickLinks() {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Kategorien</h2>
        <p className="text-muted-foreground">
          Entdecke Reviews nach Kategorie
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {categories.map((category, index) => (
          <Card
            key={category.href}
            className={`group relative overflow-hidden border-2 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 bg-gradient-to-br ${category.color} ${category.hoverColor}`}
            style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "both" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-8 relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl bg-background/50 backdrop-blur-sm border-2 border-primary/20 group-hover:border-primary/40 group-hover:scale-110 transition-all duration-300">
                <div className="text-primary">
                  {category.icon}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {category.description}
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full group/button border-2 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Link href={category.href} className="flex items-center justify-center gap-2">
                  Ansehen
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

