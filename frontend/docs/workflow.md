How the database and automaton work together:
Offline (happens once at server startup):

Backend reads all interval sequences from corpus_songs table in the database
All interval sequences are fed into the Aho-Corasick algorithm
ONE single multi-pattern DFA is constructed containing all patterns simultaneously
This automaton lives in server memory

Online (happens per user request):

User uploads MIDI → interval sequence extracted
Query interval sequence is run through the single pre-built automaton in one pass
All matches against any song in the corpus are found simultaneously
Results returned


The key point: The database stores the raw data (interval sequences + metadata). The automaton is the compiled search structure built from that data. They are separate but connected.
Think of it like this:

Database = source code files
Automaton = compiled executable

You don't search the database directly. You search the automaton which was built from the database.


![alt text](image-1.png) -- this image repsents the overall workflow of the project idea. 