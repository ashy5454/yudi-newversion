"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface GenderPreferenceModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (username: string, genderPreference: string) => Promise<void>;
    loading?: boolean;
}

export default function GenderPreferenceModal({ open, onClose, onSubmit, loading = false }: GenderPreferenceModalProps) {
    const [username, setUsername] = useState("");
    const [genderPreference, setGenderPreference] = useState<string>("any");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!username.trim()) {
            setError("Please enter a name");
            return;
        }

        if (username.trim().length < 2) {
            setError("Name must be at least 2 characters");
            return;
        }

        if (username.trim().length > 20) {
            setError("Name must be less than 20 characters");
            return;
        }

        if (!genderPreference) {
            setError("Please select a gender preference");
            return;
        }

        try {
            await onSubmit(username.trim(), genderPreference);
            setUsername("");
            setGenderPreference("any");
            onClose();
        } catch (error) {
            console.error("Error submitting name and gender preference:", error);
            setError("Something went wrong. Please try again.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-2xl">heyyy how about you give your name😏</DialogTitle>
                    <DialogDescription>
                        We'll use this to personalize your experience with the right AI companion
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Your Name</Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setError("");
                            }}
                            placeholder="Enter your name"
                            disabled={loading}
                            autoFocus
                            className={error ? "border-red-500" : ""}
                        />
                    </div>
                    <div className="space-y-3">
                        <Label>Gender Preference for AI Companion</Label>
                        <RadioGroup value={genderPreference} onValueChange={setGenderPreference} disabled={loading}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="male" id="male" />
                                <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="female" id="female" />
                                <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="non-binary" id="non-binary" />
                                <Label htmlFor="non-binary" className="font-normal cursor-pointer">Non-binary</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="any" id="any" />
                                <Label htmlFor="any" className="font-normal cursor-pointer">Any (No preference)</Label>
                            </div>
                        </RadioGroup>
                        <p className="text-xs text-muted-foreground">
                            This helps us match you with the right AI companion personality. You can change this later in settings.
                        </p>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Button type="submit" disabled={loading || !username.trim() || !genderPreference}>
                            {loading ? "Saving..." : "Continue"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
