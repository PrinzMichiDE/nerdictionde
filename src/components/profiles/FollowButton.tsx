"use client";

import { useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FollowButtonProps {
  followingId: string;
  username: string;
  displayName: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
}

export function FollowButton({
  followingId,
  username,
  displayName,
  initialFollowing,
  initialFollowerCount,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Folgen");
      }

      setFollowing(data.data.following);
      setFollowerCount(data.data.followerCount);
    } catch (error) {
      console.error("Follow error:", error);
      // Could show toast here
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            disabled={loading}
            variant={following ? "default" : "outline"}
            size="sm"
            className="gap-2 min-w-[120px] justify-center"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : following ? (
              <>
                <UserCheck className="h-4 w-4" />
                Folge ich
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Folgen
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          {following ? `Entfolge @${username}` : `Folge @${username}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}