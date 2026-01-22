# custom-txt-search

Eine GNOME Shell Extension, die `.url.txt` Dateien ausliest und die URLs als Suchergebnisse in der GNOME Shell anbietet.

## Installation

1. Extension in den Extensions-Ordner kopieren:
```bash
mkdir -p ~/.local/share/gnome-shell/extensions/custom-txt-search@local.extensions/
cp * ~/.local/share/gnome-shell/extensions/custom-txt-search@local.extensions/
```

2. Extension neu laden:
```bash
dbus-send --session --dest=org.gnome.Shell /org/gnome/Shell org.gnome.Shell.Eval string:'Meta.restart("Restarting...", null)'
```

3. Extension in der GNOME Extensions App aktivieren oder:
```bash
gnome-extensions enable custom-txt-search@local.extensions
```

### Einstellungen öffnen

Du kannst die Einstellungen über die GNOME Extensions App oder direkt per Terminal öffnen:

```bash
gnome-extensions prefs custom-txt-search@local.extensions
```

### Schemas (GSettings)

Kompiliere die Schemas nach Änderungen, damit die Extension die Einstellungen laden kann:

```bash
glib-compile-schemas ~/.local/share/gnome-shell/extensions/custom-txt-search@local.extensions/schemas
```

Einstellungen ändern (Beispiele):

```bash
# Pfad zur Datei anpassen
gsettings set org.gnome.shell.extensions.custom-txt-search url-file-path '~/.url.txt'

# Trennzeichen zwischen Label und URL
gsettings set org.gnome.shell.extensions.custom-txt-search label-separator '|'

# Beispieldatei automatisch erstellen (true/false)
gsettings set org.gnome.shell.extensions.custom-txt-search create-example-file true
```

## Verwendung

Erstelle eine Datei `~/.url.txt` mit URLs (eine pro Zeile). Du kannst zwei Formate nutzen:

**Mit Label (Pipe-Trennzeichen):**
```
Eine tolle URL|https://github.com
Meine Wikipedia|https://www.wikipedia.de
```

**Oder nur URLs:**
```
https://www.debian.org
https://example.com
```

**Gemischt:**
```
Eine tolle URL|https://xyz.de
https://asdff.de
Weiteres Label|https://other.de
```

Öffne die GNOME Shell Suche (Super/Windows-Taste) und tippe einen Namen oder einen Teil der URL ein. Die Suche funktioniert sowohl auf Labels als auch auf URLs.

## Dateien

- `metadata.json` - Extension-Metadaten
- `extension.js` - SearchProvider Implementation
- `schemas/org.gnome.shell.extensions.custom-txt-search.gschema.xml` - GSettings Schema
- `schemas/gschemas.compiled` - Kompilierte Schemas (generiert)
- `README.md` - Diese Datei
