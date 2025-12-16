import 'package:flutter/material.dart';

void main() {
  runApp(const ArabkiApp());
}

class ArabkiApp extends StatelessWidget {
  const ArabkiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Arabki Pro',
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Arabki Pro'),
        ),
        body: const Center(
          child: Text(
            'Arabki Pro\nArabic Flashcards',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 22),
          ),
        ),
      ),
    );
  }
}
