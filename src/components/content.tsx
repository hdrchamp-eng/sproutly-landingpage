import Image from "next/image";
import { blockSchema } from "@/lib/model";
export function Blocks({ blocks }: { blocks: unknown }) {
  if (!Array.isArray(blocks)) return null;
  return blocks.map((raw, i) => {
    const p = blockSchema.safeParse(raw);
    if (!p.success) return null;
    const b = p.data;
    if (b.type === "heading") return <h2 key={i}>{b.text}</h2>;
    if (b.type === "list")
      return (
        <ul key={i}>
          {b.text
            .split("\n")
            .filter(Boolean)
            .map((item, j) => (
              <li key={j}>{item}</li>
            ))}
        </ul>
      );
    if (b.type === "link" && b.url)
      return (
        <p key={i}>
          <a href={b.url} rel="noopener noreferrer">
            {b.text}
          </a>
        </p>
      );
    if (b.type === "image" && b.url)
      return (
        <figure key={i}>
          <Image
            src={b.url}
            alt={b.text}
            width={1000}
            height={600}
            style={{ height: "auto" }}
          />
        </figure>
      );
    return (
      <p key={i} style={{ whiteSpace: "pre-wrap" }}>
        {b.text}
      </p>
    );
  });
}
