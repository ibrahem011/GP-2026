import React, { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FavoritesProvider, useFavorites } from "../FavoritesContext";

const { mockGetFavorites, mockToggleFavorite, mockAuthState } = vi.hoisted(() => ({
    mockGetFavorites: vi.fn(),
    mockToggleFavorite: vi.fn(),
    mockAuthState: {
        user: { id: "user-1" } as { id: string } | null,
    },
}));

vi.mock("@/context/AuthContext", () => ({
    useAuth: () => ({ user: mockAuthState.user }),
}));

vi.mock("@/services/supabaseService", () => ({
    supabaseService: {
        getFavorites: mockGetFavorites,
        toggleFavorite: mockToggleFavorite,
    },
}));

function createDeferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function FavoriteCardProbe({ id }: { id: string }) {
    const { ensureLoaded, isFavorite } = useFavorites();

    useEffect(() => {
        void ensureLoaded();
    }, [ensureLoaded]);

    return (
        <span data-testid={`favorite-${id}`}>
            {isFavorite(id) ? "yes" : "no"}
        </span>
    );
}

function ToggleProbe() {
    const favorites = useFavorites();

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    void favorites.toggleFavorite("p2", true).catch(() => {});
                }}
            >
                toggle
            </button>
            <span data-testid="favorite-p2">
                {favorites.isFavorite("p2") ? "yes" : "no"}
            </span>
        </>
    );
}

describe("FavoritesContext", () => {
    beforeEach(() => {
        mockAuthState.user = { id: "user-1" };
        mockGetFavorites.mockReset();
        mockToggleFavorite.mockReset();
    });

    it("dedupes favorite loads requested by multiple cards", async () => {
        mockGetFavorites.mockResolvedValue({
            data: [{ id: "p2" }],
            error: null,
            isTimeout: false,
        });

        render(
            <FavoritesProvider>
                <FavoriteCardProbe id="p1" />
                <FavoriteCardProbe id="p2" />
                <FavoriteCardProbe id="p3" />
            </FavoritesProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId("favorite-p2")).toHaveTextContent("yes");
        });

        expect(mockGetFavorites).toHaveBeenCalledTimes(1);
        expect(mockGetFavorites).toHaveBeenCalledWith(
            "user-1",
            expect.objectContaining({ maxRetries: 0, timeoutMs: 8_000 }),
        );
    });

    it("optimistically toggles favorites and rolls back on failure", async () => {
        const user = userEvent.setup();
        const toggle = createDeferred<boolean>();
        mockToggleFavorite.mockReturnValueOnce(toggle.promise);

        render(
            <FavoritesProvider>
                <ToggleProbe />
            </FavoritesProvider>,
        );

        expect(screen.getByTestId("favorite-p2")).toHaveTextContent("no");

        await user.click(screen.getByRole("button", { name: "toggle" }));

        await waitFor(() => {
            expect(screen.getByTestId("favorite-p2")).toHaveTextContent("yes");
        });

        toggle.reject(new Error("toggle failed"));

        await waitFor(() => {
            expect(screen.getByTestId("favorite-p2")).toHaveTextContent("no");
        });
    });
});
