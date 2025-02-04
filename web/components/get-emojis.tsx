import { useState, useEffect } from "react";
import Placeholder from "./placeholder";

const GetEmojis = ({ category }: { category: string }) => {
    const [emojis, setEmojis] = useState<
        { name: string; download_url: string }[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        setError("");

        // ✅ Ensure category is correctly formatted
        const formattedCategory = category
            .toLowerCase()
            .replace("&", "and")
            .trim();
        console.log(`📡 Fetching from: /api/emojis/${formattedCategory}`); // Debugging Log

        fetch(`/api/emojis/${formattedCategory}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                console.log("🟢 API Response:", data); // Debugging Log

                if (data.error) {
                    setError(data.error);
                } else if (
                    Array.isArray(data.emojis) &&
                    data.emojis.length > 0
                ) {
                    setEmojis(data.emojis);
                } else {
                    setError("No emojis found.");
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error("❌ Error fetching emojis:", error);
                setError("Failed to load emojis.");
                setLoading(false);
            });
    }, [category]);

    if (loading) return <p className="text-center">Loading emojis...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div className="grid grid-cols-2 w-[55%] mx-auto md:w-auto md:grid-cols-6 gap-4">
            {emojis.length > 0 ? (
                emojis.map((emoji) => (
                    <Placeholder
                        key={emoji.name}
                        url={emoji.download_url} // ✅ Ensure correct URL is used
                        alt={emoji.name.replace(".webp", "")} // ✅ Ensure proper alt text
                    />
                ))
            ) : (
                <p className="text-center col-span-full text-gray-500">
                    No emojis found.
                </p>
            )}
        </div>
    );
};

export default GetEmojis;
