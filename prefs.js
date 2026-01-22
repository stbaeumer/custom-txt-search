import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class CustomTxtSearchPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const page = new Adw.PreferencesPage();
    window.add(page);

    const group = new Adw.PreferencesGroup({ title: 'Einstellungen' });
    page.add(group);

    // Hilfsfunktionen
    const expandTilde = (path) => {
      if (path && path.startsWith('~'))
        return GLib.build_filenamev([GLib.get_home_dir(), path.slice(2)]);
      return path;
    };

    // Datei-Pfad Feld
    const fileRow = new Adw.EntryRow({
      title: 'Pfad zur URL-Datei',
      text: settings.get_string('url-file-path'),
    });
    group.add(fileRow);
    settings.bind('url-file-path', fileRow, 'text', Gio.SettingsBindFlags.DEFAULT);

    // Button zum Auswählen einer Datei
    const chooseButton = new Gtk.Button({ label: 'Datei wählen…' });
    chooseButton.add_css_class('text-button');
    fileRow.add_suffix(chooseButton);

    // Datei-Status aktualisieren
    const updateFileRowSubtitle = () => {
      const rawPath = settings.get_string('url-file-path');
      const fullPath = expandTilde(rawPath);
      if (!fullPath) {
        fileRow.subtitle = 'Kein Pfad gesetzt';
        return;
      }
      const f = Gio.File.new_for_path(fullPath);
      fileRow.subtitle = f.query_exists(null) ? 'Datei gefunden' : 'Datei nicht gefunden';
    };

    updateFileRowSubtitle();
    settings.connect('changed::url-file-path', updateFileRowSubtitle);

    // Datei-Auswahldialog
    chooseButton.connect('clicked', () => {
      try {
        const dialog = new Gtk.FileDialog({ title: 'URL-Datei auswählen' });

        // Filter: nur Textdateien
        const filters = new Gio.ListStore({ item_type: Gtk.FileFilter.$gtype });

        const urlTxtFilter = new Gtk.FileFilter();
        urlTxtFilter.set_name('URL-Dateien (*.url.txt)');
        urlTxtFilter.add_suffix('url.txt');
        filters.append(urlTxtFilter);

        const txtFilter = new Gtk.FileFilter();
        txtFilter.set_name('Textdateien (*.txt)');
        txtFilter.add_suffix('txt');
        filters.append(txtFilter);

        dialog.set_filters(filters);
        dialog.set_default_filter(urlTxtFilter);

        // Initialer Pfad
        const rawPath = settings.get_string('url-file-path');
        const initPath = expandTilde(rawPath);
        if (initPath) {
          const initFile = Gio.File.new_for_path(initPath);
          dialog.set_initial_file(initFile);
        }

        dialog.open(window, null, (dlg, res) => {
          try {
            const file = dlg.open_finish(res);
            if (file) {
              const path = file.get_path();
              if (path)
                settings.set_string('url-file-path', path);
            }
          } catch (e) {
            console.error('Fehler beim Öffnen des Dateidialogs:', e);
          }
        });
      } catch (e) {
        console.error('Fehler beim Erstellen des Dateidialogs:', e);
      }
    });

    // Trennzeichen Feld
    const sepRow = new Adw.EntryRow({
      title: 'Trennzeichen (Label|URL)',
      text: settings.get_string('label-separator'),
    });
    group.add(sepRow);
    settings.bind('label-separator', sepRow, 'text', Gio.SettingsBindFlags.DEFAULT);

    // Beispieldatei erstellen Switch
    const exampleRow = new Adw.SwitchRow({
      title: 'Beispieldatei automatisch erstellen',
      active: settings.get_boolean('create-example-file'),
    });
    group.add(exampleRow);
    settings.bind('create-example-file', exampleRow, 'active', Gio.SettingsBindFlags.DEFAULT);

    // Info
    const infoGroup = new Adw.PreferencesGroup();
    page.add(infoGroup);
    const infoRow = new Adw.ActionRow({
      title: 'Hinweis',
      subtitle: 'Änderungen werden sofort übernommen. ~ wird zum Home-Verzeichnis expandiert.'
    });
    infoGroup.add(infoRow);
  }
}
