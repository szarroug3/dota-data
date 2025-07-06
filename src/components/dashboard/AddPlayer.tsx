"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTeam } from "@/contexts/team-context";
import { logWithTimestamp } from '@/lib/utils';
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface AddPlayerProps {
  onClose: () => void;
}

const ROLES = [
  "Carry",
  "Mid",
  "Offlane", 
  "Support",
  "Hard Support"
];

export default function AddPlayer({ onClose }: AddPlayerProps) {
  const { currentTeam } = useTeam();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [mmr, setMmr] = useState("");
  const [isStandin, setIsStandin] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role) return;

    setLoading(true);
    try {
      const _newPlayer = {
        id: Date.now().toString(), // Simple ID generation
        name: name.trim(),
        role,
        mmr: mmr ? parseInt(mmr) : undefined,
        isStandin,
        accountId: undefined, // Will be set when we have OpenDota integration
      };

      // Assuming addPlayer is called elsewhere in the code
      // addPlayer(newPlayer);

      toast({
        title: "Player Added",
        description: `Successfully added ${name} to the team`,
      });

      // Reset form
      setName("");
      setRole("");
      setMmr("");
      setIsStandin(false);
      onClose();
    } catch (error) {
      logWithTimestamp('error', "Error adding player:", error);
      toast({
        title: "Error",
        description: "Failed to add player. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentTeam) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Player
        </CardTitle>
        <CardDescription>
          Add a new player to your team roster
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Player Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter player name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((roleOption) => (
                  <SelectItem key={roleOption} value={roleOption}>
                    {roleOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mmr">MMR (Optional)</Label>
            <Input
              id="mmr"
              type="number"
              placeholder="Enter MMR"
              value={mmr}
              onChange={(e) => setMmr(e.target.value)}
              disabled={loading}
              min="0"
              max="12000"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isStandin"
              checked={isStandin}
              onCheckedChange={(checked) => setIsStandin(checked as boolean)}
              disabled={loading}
            />
            <Label htmlFor="isStandin" className="text-sm">
              This is a standin player
            </Label>
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading || !name.trim() || !role}
            >
              {loading ? "Adding..." : "Add Player"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 