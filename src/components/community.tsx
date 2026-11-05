"use client";

import { useState } from "react";
import {
  ArrowRight,
  Lightbulb,
  MessageCircle,
  Vote,
  ShieldCheck,
  Clock3,
  Sparkles,
} from "lucide-react";
import { categories } from "@/lib/browser";
import type { PublicFeedback } from "@/lib/db";

export function Community({ ideas }: { ideas: PublicFeedback[] }) {
  const [category, setCategory] = useState<string>(categories[0]);
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState(false);
  const poll = category === "Abstimmung erstellen";
  return (
    <div className="community">
      <div className="community-intro">
        <div>
          <span className="eyebrow">Zusammen wächst mehr</span>
          <h2>
            Dein Gedanke.
            <br />
            Unser nächster Schritt.
          </h2>
          <p>
            Was würde deinen Alltag mit Sproutly noch leichter machen? Hier ist
            Platz für deine Ideen.
          </p>
        </div>
        <div className="community-orbit" aria-hidden="true">
          <Lightbulb size={54} />
          <span>
            <Sparkles size={23} />
          </span>
        </div>
      </div>
      <div className="community-compose">
        <aside className="community-guide">
          <span className="community-icon">
            <MessageCircle />
          </span>
          <h3>
            Kleine Idee,
            <br />
            grosse Möglichkeit.
          </h3>
          <p>
            Teile einen Wunsch, gib Feedback oder schlage eine Abstimmung vor.
          </p>
          <ol>
            <li>
              <strong>Du gibst den Impuls</strong>
              <span>Beschreibe, was dir wichtig ist.</span>
            </li>
            <li>
              <strong>Wir schauen hin</strong>
              <span>Jeder Beitrag wird vor der Veröffentlichung geprüft.</span>
            </li>
            <li>
              <strong>Die Community entscheidet mit</strong>
              <span>
                Freigegebene Abstimmungen erhalten ein festes Zeitfenster.
              </span>
            </li>
          </ol>
          <p className="fine">
            <ShieldCheck size={17} /> Öffentlich wird nur, was wir freigeben.
          </p>
        </aside>
        <form
          className="community-form"
          onChange={() => setPreview(false)}
          onSubmit={(event) => {
            event.preventDefault();
            setPreview(true);
          }}
        >
          <span className="pill">Dein Beitrag</span>
          <h3>Was hast du im Kopf?</h3>
          <label htmlFor="community-category">Kategorie</label>
          <select
            id="community-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {[...categories, "Abstimmung erstellen"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label htmlFor="community-title">
            {poll
              ? "Worüber möchtest du abstimmen lassen?"
              : "Deine Idee in einem Satz"}
          </label>
          <input
            id="community-title"
            name="title"
            required
            minLength={3}
            maxLength={80}
            placeholder={
              poll
                ? "Welche Funktion soll als Nächstes kommen?"
                : "Das würde meinen Alltag leichter machen …"
            }
          />
          <label htmlFor="community-description">
            {poll
              ? "Beschreibe deine Idee und mögliche Antworten"
              : "Erzähl uns mehr"}
            <small>{description.length}/500</small>
          </label>
          <textarea
            id="community-description"
            name="description"
            required
            minLength={10}
            maxLength={500}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Was wünschst du dir und warum?"
          />
          {poll && (
            <div className="poll-explainer">
              <Clock3 size={21} />
              <p>
                Nach der Freigabe legt das Sproutly-Team die
                Antwortmöglichkeiten und den Abstimmungszeitraum fest.
              </p>
            </div>
          )}
          <label htmlFor="community-email">
            E-Mail <span className="fine">(optional)</span>
          </label>
          <input
            id="community-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Für eine spätere Rückmeldung"
          />
          <p className="fine">
            Vorschau: Deine Eingaben bleiben nur auf dieser Seite. Der Versand
            ist noch nicht aktiviert.
          </p>
          <button className="button" type="submit">
            Beitrag prüfen <ArrowRight size={18} />
          </button>
          {preview && (
            <div className="notice" role="status">
              <strong>
                Dein {poll ? "Abstimmungsvorschlag" : "Beitrag"} ist bereit.
              </strong>
              <br />
              Noch nicht gesendet oder gespeichert. Die Übermittlung an das
              Sproutly-Team wird später freigeschaltet.
            </div>
          )}
        </form>
      </div>
      <section className="community-board" aria-labelledby="community-heading">
        <div className="section-head">
          <div>
            <span className="eyebrow">Gemeinsam weiterdenken</span>
            <h2 id="community-heading">Ideen aus der Community</h2>
          </div>
          <p>Von einem ersten Gedanken zu einer gemeinsamen Entscheidung.</p>
        </div>
        <div className="community-columns">
          <section className="community-panel">
            <div className="panel-heading">
              <Lightbulb />
              <h3>Community-Ideen</h3>
              <span className="pill">{ideas.length}</span>
            </div>
            <p className="fine">Geprüfte und freigegebene Vorschläge.</p>
            {ideas.length ? (
              ideas.map((idea) => (
                <article className="card feedback-card" key={idea.id}>
                  <span className="pill">{idea.category}</span>
                  <h3>{idea.title}</h3>
                  <p>{idea.description}</p>
                  {idea.responses.map((r, i) => (
                    <div className="reply" key={i}>
                      <strong>Antwort von Sproutly</strong>
                      <p>{r.response}</p>
                    </div>
                  ))}
                </article>
              ))
            ) : (
              <div className="community-empty">
                <Lightbulb size={34} />
                <h4>Hier können Ideen wachsen.</h4>
                <p>
                  Die ersten freigegebenen Vorschläge finden bald hier ihren
                  Platz.
                </p>
              </div>
            )}
          </section>
          <section
            className="community-panel polls-panel"
            id="polls"
            aria-labelledby="poll-heading"
          >
            <div className="panel-heading">
              <Vote />
              <h3 id="poll-heading">Aktive Abstimmungen</h3>
              <span className="pill">0</span>
            </div>
            <p className="fine">
              Deine Stimme zählt – innerhalb des jeweiligen Zeitfensters.
            </p>
            <div className="community-empty">
              <Vote size={34} />
              <h4>Die nächste Entscheidung kommt.</h4>
              <p>
                Aktuell gibt es noch keine freigegebene Abstimmung. Sobald eine
                startet, findest du hier die Optionen und das Enddatum.
              </p>
            </div>
            <div className="poll-footer">
              <Clock3 size={18} />
              <span>Mit festem Enddatum · Auswertung nach Abschluss</span>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
