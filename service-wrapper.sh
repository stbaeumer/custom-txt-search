#!/usr/bin/env bash
exec gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "ext = imports.ui.main.extensionManager.lookup('custom-txt-search@local.extensions'); ext.stateObj._searchProvider._dbusImpl.export(Gio.DBus.session, '/org/gnome/Shell/Extensions/CustomTxtSearch')" 2>/dev/null &
sleep 30
