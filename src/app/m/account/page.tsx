"use client";

import { useAuth } from "@/components/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function AccountPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/");
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Please log in to view your account.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">My Account</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Manage your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.photoURL ?? ''} />
                            <AvatarFallback className="text-2xl">{user.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-semibold">{user.displayName}</h2>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Firebase User ID</label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-muted p-2 rounded text-sm break-all">
                                    {user.uid}
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(user.uid);
                                        alert('User ID copied to clipboard!');
                                    }}
                                >
                                    Copy
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Use this ID as the Document ID when creating your admin document in Firestore
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <Button variant="destructive" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
