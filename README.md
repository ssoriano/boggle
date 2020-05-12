database
---------
The database structure can be found in the wordbox_db_backup.sql file.
The tables that need to be created are: "board", "player_board" and "spanish_words".
The most important table is "spanish_words", which contains a listing of more than 189000 words in spanish:

    word        source      type    unaccented_word
    ________________________________________________
    almorcé     rae         verb    almorce
    atonto      rae         verb    atonto
    cuidad      original    noun    ciudad
    guía        original    [null]  guia
    
The "type" field can be left empty. It indicates the type of word, but not all of them can be correctly classified.
The source can be set to "original" (it basically indicates the source of the word, since the application "learns" from the unknown words -not found in local database- that users type and are consulted and confirmed with external dictionaries)
The "unaccented_word" field contains the same word, but without accents (á, é, í, ó and ú are replaced with their unaccented version)

webserver
---------
To execute the webserver, run the following commands:

1) npm install
2) npm run start

Browser: http://localhost:4000/

webapp
---------
To execute the webserver, run the following commands:

1) npm install
2) npm start

Browser: http://localhost:3000/