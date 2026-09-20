import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel">
      <h2>No such record</h2>
      <p className="sub">
        There is no case or evidence item with that reference. Check the reference and try
        again.
      </p>
      <Link className="button" href="/">Back to all cases</Link>
    </div>
  );
}
