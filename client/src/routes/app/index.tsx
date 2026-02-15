import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/app/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [search, setSearch] = useState<string>("");

  const onSubmit = async () => {
    console.log("submitted");

    try {
      const res = await fetch("/api/v1/youtube/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldName: search }),
      });
      const data = await res.json();
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-full">
      Hello "/app/"!
      <div className="mt-4 flex flex-col gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white outline"
        />
        <button className="btn-primary" onClick={onSubmit}>
          submit
        </button>
      </div>
    </div>
  );
}
