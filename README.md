# TäglichSchlauer Bot

Dieser Bot erstellt fünfmal täglich ein Fakten-Karussell mit mindestens vier Seiten und veröffentlicht es über die offizielle Instagram-API.

## Zeiten

GitHub Actions läuft um 07:07, 10:07, 13:07, 16:07 und 19:07 UTC. In Deutschland entspricht das während der Sommerzeit ungefähr 09:07, 12:07, 15:07, 18:07 und 21:07 Uhr; im Winter jeweils eine Stunde früher.

## Sicherheit

Der Instagram-Zugriffstoken liegt ausschließlich als GitHub-Secret `INSTAGRAM_ACCESS_TOKEN` vor. Er darf niemals in Dateien, Issues oder Screenshots eingefügt werden.

## Inhalt

- Themen: besondere Tiere, aktuelle Ereignisse, Natur, positive Entwicklungen und Quiz
- Faktenbasis: deutschsprachige Wikipedia
- Bilder: Wikimedia Commons mit Bildnachweisen im Beitragsarchiv
- Gestaltung: 4 bis 6 Hochformatseiten pro Karussell (1080 × 1350 Pixel)
- Quellenangabe: im Beschreibungstext jedes Beitrags
- Quiz: Frage zuerst, Auflösung erst auf einer späteren Seite
- Abschlussseite: Aufforderung, `@taeglichschlauer` zu folgen und den Beitrag zu teilen oder zu speichern

Automatisch erzeugte Fakten sollten regelmäßig stichprobenartig kontrolliert werden. Ein Quellenlink verhindert nicht, dass ein Wikipedia-Artikel Fehler enthalten kann.
