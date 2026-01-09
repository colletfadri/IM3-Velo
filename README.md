# IM3
Bike Monitoring Chur

Dieses Projekt visualisiert die Verfügbarkeit von Fahrrädern an Stationen in Chur. Grundlage sind Live-Daten von Citybik.es API, die regelmässig abgefragt, 
verarbeitet und in einer Datenbank gespeichert werden. Über eine eigene PHP-Schnittstelle (unload.php) werden die Daten dann dem Frontend zur Visualisierung zur Verfügung gestellt.

Die Anwendung bietet:

-Eine interaktive Leaflet-Karte, auf der die durchschnittlich verfügbaren Velos pro Station farblich dargestellt sind
-Dynamische Diagramme mit Chart.js, zur Analyse der Verfügbarkeit über verschiedene Zeiträume: Tag, Woche, Monat
-Ein schlichtes, aber stimmiges Design mit einfachen responsiven layout

Ziel war es, ein datenbasiertes Dashboard zu entwickeln, das informativ und visuell ansprechend ist und gleichzeitig als Übung in Frontend-/Backend-Kommunikation, Datenverarbeitung und Visualisierung dient.


Learnings

-Server, Datenbank & ETL
-Dynamische Datenvisualisierung mit Chart.js
-Nutzung und Styling von Leaflet für Kartenprojekte
-Umsetzung von responsivem Design mit Flexbox und Media Queries

Beim Projekt haben wir ziemlich viel mitgenommen. Zum Beispiel haben wir gelernt, wie man sich eine Datenquelle wie die Citybik.es-API schnappt, die Daten passend umwandelt und sie in einer eigenen Datenbank speichert.
Spannend war auch die Arbeit mit Chart.js. Wir konnten Daten nach Zeiträumen filtern, sortieren und am Ende als verständliche Diagramme darstellen. Mit Leaflet haben wir eine interaktive Karte erstellt, Marker gesetzt, Farben je nach Verfügbarkeit angepasst und alles im eigenen Style gehalten.


Schwierigkeiten

-Die Anbindung der API an die Datenbank auf dem Server: richtige Daten abrufen, strukturieren und bereitstellen
-Verarbeitung und Visualisierung der Daten im Frontend inklusive zeitlicher Filterung und Gruppierung
-Alle Komponenten (Karte, Buttons, Diagramme, Texte) optisch und technisch aufeinander abzustimmen, ohne dass es überladen wirkt
-Gestaltung eines konsistenten und übersichtlichen Layouts auf verschiedenen Bildschirmgrössen (Responsiveness)

Ganz ohne Hürden lief es nicht. Die Verbindung von API und Datenbank war eine der ersten grösseren Aufgaben. Die Daten mussten nicht nur richtig abgerufen, sondern auch sinnvoll strukturiert und bereitgestellt werden. Das hat viel Zeit gebraucht.
Dann kam die Herausforderung, mit grossen Mengen an Daten umzugehen. Wir mussten sie analysieren, nach Tagen, Wochen oder Monaten gruppieren und so aufbereiten, dass die Diagramme am Ende auch wirklich einen Mehrwert liefern.


Benutzte Ressourcen

Leaflet.js  – für die Karte

Chart.js – für die Diagramme

OpenStreetMap – als Kartenbasis

Eigene CSS-Gestaltung + Google Fonts / benutzerdefinierter Font

Eigene erstellte Daten
