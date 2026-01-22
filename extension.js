import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

class CustomTxtSearchProvider {
  constructor(settings) {
    this.id = 'custom-txt-search@local.extensions';
    this.title = 'Custom TXT Search';
    this.appInfo = null;

    this._settings = settings;
    this._results = new Map();
    this._loadUrls();

    // Neu laden bei Einstellungsänderungen
    this._settings.connect('changed::url-file-path', () => this._reload());
    this._settings.connect('changed::label-separator', () => this._reload());
  }

  _expandTilde(path) {
    if (path.startsWith('~')) {
      return GLib.build_filenamev([GLib.get_home_dir(), path.slice(2)]);
    }
    return path;
  }

  _getUrlFile() {
    const configuredPath = this._settings.get_string('url-file-path');
    const fullPath = this._expandTilde(configuredPath);
    return Gio.File.new_for_path(fullPath);
  }

  _getSeparator() {
    const sep = this._settings.get_string('label-separator');
    return sep || '|';
  }

  _reload() {
    this._results.clear();
    this._loadUrls();
  }

  _loadUrls() {
    const urlFile = this._getUrlFile();
    const separator = this._getSeparator();

    // Erstelle Beispieldatei, wenn sie nicht existiert
    if (!urlFile.query_exists(null)) {
      const shouldCreate = this._settings.get_boolean('create-example-file');
      if (shouldCreate)
        this._createExampleFile(urlFile);
      return;
    }

    try {
      const [success, contents] = urlFile.load_contents(null);
      if (!success) return;

      const text = new TextDecoder().decode(contents);
      const lines = text.trim().split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed) {
          // Format: "Label|URL" oder nur "URL"
          if (separator && trimmed.includes(separator)) {
            const parts = trimmed.split(separator);
            const label = parts[0].trim();
            const url = parts.slice(1).join(separator).trim();
            this._results.set(`url-${index}`, {
              label: label,
              url: url
            });
          } else {
            this._results.set(`url-${index}`, {
              label: trimmed,
              url: trimmed
            });
          }
        }
      });

      console.log(`custom-txt-search: ${this._results.size} URLs geladen`);
    } catch (e) {
      console.error('custom-txt-search: Fehler beim Lesen der .url.txt:', e);
    }
  }

  _escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  _createExampleFile(urlFile) {
    const exampleContent = 'BKB|https://berufskolleg-borken.de\nhttps://bkb.wiki\n';
    
    try {
      urlFile.replace_contents(exampleContent, null, false, 
        Gio.FileCreateFlags.NONE, null);
      console.log('custom-txt-search: Beispiel .url.txt erstellt');
      
      // Laden nach Erstellung
      this._loadUrls();
    } catch (e) {
      console.error('custom-txt-search: Fehler beim Erstellen der .url.txt:', e);
    }
  }

  _searchUrls(terms) {
    if (terms.length === 0) return [];

    const searchRegex = terms.map(t => this._escapeRegex(t)).join('.*');
    const regex = new RegExp(searchRegex, 'i');

    const results = [];
    this._results.forEach((entry, id) => {
      // Suche in Label und URL
      if (regex.test(entry.label) || regex.test(entry.url)) {
        results.push(id);
      }
    });

    return results;
  }

  async getInitialResultSet(terms, _cancellable) {
    return this._searchUrls(terms);
  }

  async getSubsearchResultSet(previousResults, terms, _cancellable) {
    return this._searchUrls(terms);
  }

  async getResultMetas(ids, _cancellable) {
    const metas = ids.map(id => {
      const entry = this._results.get(id);
      const displayName = entry?.label ?? id;
      return {
        id,
        name: displayName,
        description: entry?.url ?? '',
        createIcon: (size) => {
          return new Gio.ThemedIcon({ name: 'globe-symbolic' });
        },
      };
    });
    return metas;
  }

  activateResult(id, _terms) {
    const entry = this._results.get(id);
    if (entry) {
      try {
        Gio.app_info_launch_default_for_uri(entry.url, null);
      } catch (e) {
        console.error('custom-txt-search: Fehler beim Öffnen der URL:', e);
      }
    }
  }
}

export default class CustomTxtSearchExtension extends Extension {
  enable() {
    try {
      this._settings = this.getSettings();
      this._searchProvider = new CustomTxtSearchProvider(this._settings);

      this._searchController = Main.overview?.searchController;
      if (this._searchController) {
        this._searchController.addProvider(this._searchProvider);
        console.log('custom-txt-search: SearchProvider im Shell SearchController registriert');
      } else {
        console.error('custom-txt-search: Kein SearchController gefunden');
      }
    } catch (e) {
      console.error('custom-txt-search: Fehler in enable():', e);
    }
  }

  disable() {
    if (this._searchProvider && this._searchController) {
      this._searchController.removeProvider(this._searchProvider);
    }
    this._searchProvider = null;
    this._searchController = null;
  }
}
