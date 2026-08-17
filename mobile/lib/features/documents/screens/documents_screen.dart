import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

class DocumentsScreen extends ConsumerStatefulWidget {
  final String caseId;
  final String caseNo;
  const DocumentsScreen({super.key, required this.caseId, required this.caseNo});
  @override
  ConsumerState<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends ConsumerState<DocumentsScreen> {
  String _filter = 'ALL';
  static const _kinds = ['ALL','ARJI','JOBAB','OKALATNAMA','SHAKKHYA','ADESH','OTHER'];
  static const _kindLabel = {
    'ALL': 'সব', 'ARJI': 'আরজি', 'JOBAB': 'জবাব',
    'OKALATNAMA': 'ওকালতনামা', 'SHAKKHYA': 'সাক্ষ্য',
    'ADESH': 'আদেশ', 'OTHER': 'অন্যান্য',
  };
  static const _kindIcon = {
    'ARJI': '📄', 'JOBAB': '📋', 'OKALATNAMA': '✍️',
    'SHAKKHYA': '🎤', 'ADESH': '⚖️', 'OTHER': '📁',
  };

  // Mock docs — replace with Drift query via documentsProvider
  final _docs = [
    {'id':'1','kind':'ARJI','title':'আরজি_২০২৩.pdf','size':'245 KB','date':'১২ জুন ২০২৩','pages':3},
    {'id':'2','kind':'ADESH','title':'আদেশ_২১জুলাই.pdf','size':'120 KB','date':'২১ জুলাই ২০২৬','pages':2},
    {'id':'3','kind':'OKALATNAMA','title':'ওকালতনামা.pdf','size':'85 KB','date':'১২ জুন ২০২৩','pages':1},
  ];

  @override
  Widget build(BuildContext context) {
    final filtered = _filter == 'ALL'
        ? _docs
        : _docs.where((d) => d['kind'] == _filter).toList();

    return Scaffold(
      backgroundColor: AppColors.parchment,
      appBar: AppBar(
        title: Text(widget.caseNo, style: AppTypography.bodyMedium.copyWith(color: Colors.white)),
        backgroundColor: AppColors.navy,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.white),
            onPressed: () => showSearch(context: context, delegate: _DocSearchDelegate(_docs)),
          ),
        ],
      ),
      body: Column(children: [
        // Kind filter
        Container(
          color: AppColors.surface,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _kinds.map((k) {
                final active = _filter == k;
                return GestureDetector(
                  onTap: () => setState(() => _filter = k),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 120),
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: active ? AppColors.brassLighter : AppColors.parchment,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: active ? AppColors.brass : AppColors.border,
                        width: active ? 1.5 : 1)),
                    child: Text(_kindLabel[k] ?? k,
                      style: AppTypography.chip.copyWith(
                        color: active ? AppColors.warning : AppColors.muted,
                        fontWeight: active ? FontWeight.w700 : FontWeight.w400)),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
        // Docs list
        Expanded(
          child: filtered.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Text('📂', style: TextStyle(fontSize: 48)),
                  const SizedBox(height: 12),
                  Text('কোনো নথি নেই',
                    style: AppTypography.body.copyWith(color: AppColors.muted)),
                ]))
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 100),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) => _DocTile(doc: filtered[i]),
                ),
        ),
      ]),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showScanOptions,
        backgroundColor: AppColors.brass,
        label: Text('+ স্ক্যান করুন',
          style: AppTypography.bodyMedium.copyWith(color: Colors.white, fontWeight: FontWeight.w600)),
        icon: const Icon(Icons.document_scanner, color: Colors.white),
      ),
    );
  }

  void _showScanOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _ScanOptionsSheet(caseId: widget.caseId),
    );
  }
}

class _DocTile extends StatelessWidget {
  final Map<String, dynamic> doc;
  const _DocTile({required this.doc});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: AppColors.surface, borderRadius: BorderRadius.circular(12),
      border: Border.all(color: AppColors.border)),
    child: Row(children: [
      Container(
        width: 44, height: 44,
        decoration: BoxDecoration(
          color: AppColors.infoBg, borderRadius: BorderRadius.circular(10)),
        alignment: Alignment.center,
        child: Text(
          (_DocTile._icons[doc['kind']] ?? '📁'),
          style: const TextStyle(fontSize: 20)),
      ),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(doc['title'],
          style: AppTypography.mono.copyWith(color: AppColors.navy, fontSize: 12)),
        const SizedBox(height: 3),
        Text('${doc['size']} · ${doc['pages']} পৃষ্ঠা · ${doc['date']}',
          style: AppTypography.caption.copyWith(color: AppColors.muted)),
      ])),
      PopupMenuButton(
        icon: const Icon(Icons.more_vert, color: AppColors.muted, size: 20),
        itemBuilder: (_) => [
          const PopupMenuItem(value: 'view',  child: Text('দেখুন')),
          const PopupMenuItem(value: 'share', child: Text('শেয়ার')),
          const PopupMenuItem(value: 'del',   child: Text('মুছুন')),
        ],
      ),
    ]),
  );
  static const _icons = {
    'ARJI':'📄','JOBAB':'📋','OKALATNAMA':'✍️','SHAKKHYA':'🎤','ADESH':'⚖️','OTHER':'📁'};
}

class _ScanOptionsSheet extends StatelessWidget {
  final String caseId;
  const _ScanOptionsSheet({required this.caseId});
  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(20, 16, 20,
      MediaQuery.of(context).viewInsets.bottom + 36),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Container(width: 36, height: 4,
        decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
      const SizedBox(height: 14),
      Text('নথি যোগ করুন',
        style: AppTypography.h2.copyWith(color: AppColors.navy)),
      const SizedBox(height: 20),
      ...[
        ('📷', 'ক্যামেরা দিয়ে স্ক্যান', 'ML Kit Document Scanner — multi-page'),
        ('🖼️', 'গ্যালারি থেকে আপলোড', 'ছবি বা PDF ফাইল'),
        ('📁', 'ফাইল ম্যানেজার থেকে', 'PDF, DOCX, JPEG'),
      ].map((o) => GestureDetector(
        onTap: () { Navigator.pop(context); _handleScan(context, o.$1); },
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.parchment, borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border)),
          child: Row(children: [
            Text(o.$1, style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(o.$2, style: AppTypography.bodyMedium.copyWith(
                color: AppColors.navy, fontWeight: FontWeight.w600)),
              Text(o.$3, style: AppTypography.caption.copyWith(color: AppColors.muted)),
            ])),
          ]),
        ),
      )),
    ]),
  );

  void _handleScan(BuildContext ctx, String icon) {
    // TODO: integrate flutter_doc_scanner
    // if (icon == '📷') FlutterDocScanner().getScanDocument();
  }
}

class _DocSearchDelegate extends SearchDelegate {
  final List<Map<String, dynamic>> docs;
  _DocSearchDelegate(this.docs);
  @override
  List<Widget> buildActions(BuildContext ctx) =>
      [IconButton(icon: const Icon(Icons.clear), onPressed: () => query = '')];
  @override
  Widget buildLeading(BuildContext ctx) =>
      IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => close(ctx, null));
  @override
  Widget buildResults(BuildContext ctx) => _results();
  @override
  Widget buildSuggestions(BuildContext ctx) => _results();
  Widget _results() {
    final r = docs.where((d) =>
      (d['title'] as String).toLowerCase().contains(query.toLowerCase())).toList();
    return ListView(children: r.map((d) => ListTile(
      leading: Text(d['kind'] ?? '📁'),
      title: Text(d['title']),
      subtitle: Text(d['date']),
    )).toList());
  }
}
