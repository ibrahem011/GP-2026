"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <FavoritesProvider>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </ThemeProvider>
            </FavoritesProvider>
        </AuthProvider>
    );
}
