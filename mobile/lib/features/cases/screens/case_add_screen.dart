import 'package:drift/drift.dart' show Value;
import 'package:flutter/foundation.dart' show AsyncCallback;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/db/database_provider.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/db/database.dart';
import '../../../shared/widgets/brass_button.dart';

/// 3-step case add wizard
/// Step 1: কোর্ট (court type + name + room)
/// Step 2: কেস   (case number, type, parties)
/// Step 3: তারিখ (next hearing date, priority)
///
/// Design rule: never put 15 fields on one screen.
/// Each step fits on one phone screen without scrolling.
class CaseAddScreen extends ConsumerStatefulWidget {
  const CaseAddScreen({super.key});
  @override
  ConsumerState<CaseAddScreen> createState() => _CaseAddScreenState();
}

class _CaseAddScreenState extends ConsumerState<CaseAddScreen> {
  final _pageCtrl = PageController();
  int _step = 0;
  bool _saving = false;

  // ── Step 1 — Court ───────────────────────────────────────────────────────
  String  _courtType  = 'judgesCourt';
  String  _courtName  = '';
  String  _courtRoom  = '';
  String  _judgeName  = '';

  // ── Step 2 — Case ────────────────────────────────────────────────────────
  String  _caseNo     = '';
  int?    _caseYear;
  String  _caseType   = 'দেওয়ানী';
  String  _onBehalf   = 'plaintiff';
  String  _actsSects  = '';
  String  _police     = '';
  String  _clientName = '';

  // ── Step 3 — Date ────────────────────────────────────────────────────────
  DateTime? _nextDate;
  String    _priority = 'medium';

  static const _caseTypes  = ['দেওয়ানী', 'ফৌজদারী', 'রিট', 'আপিল',
                              'রিভিশন', 'রিভিউ', 'পারিবারিক', 'শ্রম', 'অন্যান্য'];
  static const _courtTypes = [
    ('judgesCourt',    'জেলা/যুগ্ম জজ আদালত'),
    ('highCourt',      'হাইকোর্ট বিভাগ'),
    ('supremeCourt',   'আপিল বিভাগ'),
    ('tribunal',       'ট্রাইব্যুনাল'),
    ('districtCourt',  'অধস্তন আদালত'),
  ];
  static const _priorities = [
    ('high',   '🔴 উচ্চ'),
    ('medium', '🟡 মাঝারি'),
    ('low',    '🟢 কম'),
  ];
  static const _onBehalfOpts = [
    ('plaintiff',  'বাদী/আবেদনকারী'),
    ('defendant',  'বিবাদী/প্রতিপক্ষ'),
    ('appellant',  'আপিলকারী'),
    ('respondent', 'সাড়াদাতা'),
  ];

  @override
  void dispose() { _pageCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.parchment,
      appBar: AppBar(
        backgroundColor: AppColors.navy,
        foregroundColor: Colors.white,
        title: Text('নতুন মামলা — ধাপ ${_step + 1}/৩',
          style: AppTypography.h2.copyWith(color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: _StepProgressBar(step: _step),
        ),
      ),
      body: PageView(
        controller: _pageCtrl,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          _Step1Court(
            courtType: _courtType, courtName: _courtName,
            courtRoom: _courtRoom, judgeName: _judgeName,
            courtTypes: _courtTypes,
            onChanged: (t, n, r, j) => setState(() {
              _courtType = t; _courtName = n; _courtRoom = r; _judgeName = j;
            }),
            onNext: _nextStep,
          ),
          _Step2Case(
            caseNo: _caseNo, caseYear: _caseYear, caseType: _caseType,
            onBehalf: _onBehalf, actsSects: _actsSects,
            police: _police, clientName: _clientName,
            caseTypes: _caseTypes, onBehalfOpts: _onBehalfOpts,
            onChanged: (no, yr, ct, ob, as_, p, cn) => setState(() {
              _caseNo = no; _caseYear = yr; _caseType = ct;
              _onBehalf = ob; _actsSects = as_; _police = p; _clientName = cn;
            }),
            onBack: _prevStep,
            onNext: _nextStep,
          ),
          _Step3Date(
            nextDate: _nextDate, priority: _priority,
            priorities: _priorities,
            onChanged: (d, p) => setState(() { _nextDate = d; _priority = p; }),
            onBack: _prevStep,
            onSave: _save,
            saving: _saving,
          ),
        ],
      ),
    );
  }

  void _nextStep() {
    if (_step < 2) {
      setState(() => _step++);
      _pageCtrl.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _prevStep() {
    if (_step > 0) {
      setState(() => _step--);
      _pageCtrl.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _save() async {
    if (_caseNo.trim().isEmpty) {
      _showError('কেস নম্বর দিন');
      return;
    }
    setState(() => _saving = true);
    try {
      final chamberId = ref.read(chamberIdProvider);
      final dao       = ref.read(caseDaoProvider);
      final id        = const Uuid().v4();
      final now       = DateTime.now();

      await dao.upsertCase(CasesCompanion.insert(
        id:           id,
        chamberId:    chamberId,
        caseNo:       _caseNo.trim(),
        caseYear:     Value(_caseYear),
        court:        _courtType,
        courtName:    Value(_courtName.trim().isEmpty ? null : _courtName.trim()),
        courtRoom:    Value(_courtRoom.trim().isEmpty ? null : _courtRoom.trim()),
        judgeName:    Value(_judgeName.trim().isEmpty ? null : _judgeName.trim()),
        caseType:     _caseType,
        actsSections: Value(_actsSects.trim().isEmpty ? null : _actsSects.trim()),
        policeStation:Value(_police.trim().isEmpty ? null : _police.trim()),
        onBehalf:     _onBehalf,
        priority:     Value(_priority),
        clientId:     Value(_clientName.trim().isEmpty ? null : _clientName.trim()),
        nextDate:     Value(_nextDate),
        updatedAt:    now,
      ));

      // TODO: enqueue sync op to outbox

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('মামলা সংরক্ষিত হয়েছে',
            style: AppTypography.caption.copyWith(color: Colors.white)),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (e) {
      _showError('সমস্যা হয়েছে: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: AppTypography.caption.copyWith(color: Colors.white)),
      backgroundColor: AppColors.danger,
      behavior: SnackBarBehavior.floating,
    ));
  }
}

// ── Progress bar ──────────────────────────────────────────────────────────────
class _StepProgressBar extends StatelessWidget {
  final int step;
  const _StepProgressBar({required this.step});
  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(3, (i) => Expanded(
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          height: 4,
          color: i <= step ? AppColors.brass : Colors.white.withOpacity(0.15),
          margin: EdgeInsets.only(right: i < 2 ? 2 : 0),
        ),
      )),
    );
  }
}

// ── Step 1 — Court ────────────────────────────────────────────────────────────
class _Step1Court extends StatefulWidget {
  final String courtType, courtName, courtRoom, judgeName;
  final List<(String, String)> courtTypes;
  final Function(String, String, String, String) onChanged;
  final VoidCallback onNext;
  const _Step1Court({
    required this.courtType, required this.courtName,
    required this.courtRoom, required this.judgeName,
    required this.courtTypes, required this.onChanged, required this.onNext,
  });
  @override
  State<_Step1Court> createState() => _Step1CourtState();
}

class _Step1CourtState extends State<_Step1Court> {
  late String _type;
  final _nameCtrl  = TextEditingController();
  final _roomCtrl  = TextEditingController();
  final _judgeCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _type = widget.courtType;
    _nameCtrl.text  = widget.courtName;
    _roomCtrl.text  = widget.courtRoom;
    _judgeCtrl.text = widget.judgeName;
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _roomCtrl.dispose(); _judgeCtrl.dispose();
    super.dispose();
  }

  void _emit() => widget.onChanged(_type, _nameCtrl.text, _roomCtrl.text, _judgeCtrl.text);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('কোন আদালত?', style: AppTypography.h2.copyWith(color: AppColors.navy)),
        const SizedBox(height: 4),
        Text('আদালতের ধরন বেছে নিন', style: AppTypography.caption.copyWith(color: AppColors.muted)),
        const SizedBox(height: 20),

        // Court type chips
        Wrap(spacing: 8, runSpacing: 8,
          children: widget.courtTypes.map((ct) {
            final (id, label) = ct;
            final active = _type == id;
            return GestureDetector(
              onTap: () { setState(() => _type = id); _emit(); },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(
                  color:  active ? AppColors.brassLighter : AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: active ? AppColors.brass : AppColors.border,
                    width: active ? 1.5 : 1,
                  ),
                ),
                child: Text(label, style: AppTypography.bodyMedium.copyWith(
                  color:      active ? AppColors.warning : AppColors.ink,
                  fontWeight: active ? FontWeight.w600  : FontWeight.w400,
                )),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 20),

        _FieldLabel('আদালতের নাম (ঐচ্ছিক)'),
        const SizedBox(height: 8),
        TextField(
          controller: _nameCtrl,
          onChanged: (_) => _emit(),
          decoration: const InputDecoration(
            hintText: 'যেমন: যুগ্ম জেলা জজ, ২য় আদালত, ঢাকা'),
        ),
        const SizedBox(height: 14),

        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _FieldLabel('কক্ষ নং'),
            const SizedBox(height: 8),
            TextField(
              controller: _roomCtrl,
              onChanged: (_) => _emit(),
              decoration: const InputDecoration(hintText: '৩'),
            ),
          ])),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _FieldLabel('বিচারকের নাম'),
            const SizedBox(height: 8),
            TextField(
              controller: _judgeCtrl,
              onChanged: (_) => _emit(),
              decoration: const InputDecoration(hintText: 'ঐচ্ছিক'),
            ),
          ])),
        ]),
        const SizedBox(height: 32),
        BrassButton(label: 'পরবর্তী: কেসের তথ্য →', onPressed: widget.onNext),
      ]),
    );
  }
}

// ── Step 2 — Case ─────────────────────────────────────────────────────────────
class _Step2Case extends StatefulWidget {
  final String caseNo, caseType, onBehalf, actsSects, police, clientName;
  final int? caseYear;
  final List<String> caseTypes;
  final List<(String, String)> onBehalfOpts;
  final Function(String, int?, String, String, String, String, String) onChanged;
  final VoidCallback onBack, onNext;
  const _Step2Case({
    required this.caseNo, required this.caseYear, required this.caseType,
    required this.onBehalf, required this.actsSects, required this.police,
    required this.clientName, required this.caseTypes, required this.onBehalfOpts,
    required this.onChanged, required this.onBack, required this.onNext,
  });
  @override
  State<_Step2Case> createState() => _Step2CaseState();
}

class _Step2CaseState extends State<_Step2Case> {
  late String _caseType, _onBehalf;
  final _noCtrl     = TextEditingController();
  final _yearCtrl   = TextEditingController();
  final _asCtrl     = TextEditingController();
  final _policeCtrl = TextEditingController();
  final _clientCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _caseType = widget.caseType;
    _onBehalf = widget.onBehalf;
    _noCtrl.text     = widget.caseNo;
    _yearCtrl.text   = widget.caseYear?.toString() ?? '';
    _asCtrl.text     = widget.actsSects;
    _policeCtrl.text = widget.police;
    _clientCtrl.text = widget.clientName;
  }

  @override
  void dispose() {
    _noCtrl.dispose(); _yearCtrl.dispose(); _asCtrl.dispose();
    _policeCtrl.dispose(); _clientCtrl.dispose();
    super.dispose();
  }

  void _emit() => widget.onChanged(
    _noCtrl.text, int.tryParse(_yearCtrl.text), _caseType,
    _onBehalf, _asCtrl.text, _policeCtrl.text, _clientCtrl.text,
  );

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('কেসের তথ্য', style: AppTypography.h2.copyWith(color: AppColors.navy)),
        const SizedBox(height: 20),

        // Case type
        _FieldLabel('মামলার ধরন *'),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8,
          children: widget.caseTypes.map((ct) {
            final active = _caseType == ct;
            return GestureDetector(
              onTap: () { setState(() => _caseType = ct); _emit(); },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 120),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color:  active ? AppColors.brassLighter : AppColors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: active ? AppColors.brass : AppColors.border,
                    width: active ? 1.5 : 1,
                  ),
                ),
                child: Text(ct, style: AppTypography.bodyMedium.copyWith(
                  color: active ? AppColors.warning : AppColors.ink,
                  fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                )),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),

        Row(children: [
          Expanded(flex: 2, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _FieldLabel('কেস নম্বর *'),
            const SizedBox(height: 8),
            TextField(
              controller: _noCtrl,
              onChanged: (_) => _emit(),
              decoration: const InputDecoration(hintText: '১২৩/২০২৩'),
            ),
          ])),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _FieldLabel('সাল'),
            const SizedBox(height: 8),
            TextField(
              controller: _yearCtrl,
              onChanged: (_) => _emit(),
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(hintText: '২০২৩'),
            ),
          ])),
        ]),
        const SizedBox(height: 14),

        _FieldLabel('আমি কার পক্ষে?'),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8,
          children: widget.onBehalfOpts.map((ob) {
            final (id, label) = ob;
            final active = _onBehalf == id;
            return GestureDetector(
              onTap: () { setState(() => _onBehalf = id); _emit(); },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 120),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: active ? AppColors.infoBg : AppColors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: active ? AppColors.info : AppColors.border,
                    width: active ? 1.5 : 1,
                  ),
                ),
                child: Text(label, style: AppTypography.bodyMedium.copyWith(
                  color: active ? AppColors.info : AppColors.muted,
                  fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                )),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 14),

        _FieldLabel('ক্লায়েন্টের নাম'),
        const SizedBox(height: 8),
        TextField(
          controller: _clientCtrl,
          onChanged: (_) => _emit(),
          decoration: const InputDecoration(hintText: 'মোঃ রফিকুল ইসলাম'),
        ),
        const SizedBox(height: 14),

        _FieldLabel('ধারা / আইন (ঐচ্ছিক)'),
        const SizedBox(height: 8),
        TextField(
          controller: _asCtrl,
          onChanged: (_) => _emit(),
          decoration: const InputDecoration(hintText: 'দ.বি. ৩০২ / N.I. Act ১৩৮'),
        ),
        if (_caseType == 'ফৌজদারী') ...[
          const SizedBox(height: 14),
          _FieldLabel('থানার নাম (GR/CR)'),
          const SizedBox(height: 8),
          TextField(
            controller: _policeCtrl,
            onChanged: (_) => _emit(),
            decoration: const InputDecoration(hintText: 'মতিঝিল থানা'),
          ),
        ],
        const SizedBox(height: 32),
        Row(children: [
          Expanded(child: OutlinedButton(
            onPressed: widget.onBack,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: const BorderSide(color: AppColors.border),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('← পেছনে',
              style: AppTypography.body.copyWith(color: AppColors.muted)),
          )),
          const SizedBox(width: 12),
          Expanded(flex: 2,
            child: BrassButton(label: 'পরবর্তী: তারিখ →', onPressed: widget.onNext)),
        ]),
      ]),
    );
  }
}

// ── Step 3 — Date & Priority ──────────────────────────────────────────────────
class _Step3Date extends StatefulWidget {
  final DateTime? nextDate;
  final String priority;
  final List<(String, String)> priorities;
  final Function(DateTime?, String) onChanged;
  final VoidCallback onBack;
  final AsyncCallback onSave;
  final bool saving;
  const _Step3Date({
    required this.nextDate, required this.priority,
    required this.priorities, required this.onChanged,
    required this.onBack, required this.onSave, required this.saving,
  });
  @override
  State<_Step3Date> createState() => _Step3DateState();
}

class _Step3DateState extends State<_Step3Date> {
  late DateTime? _date;
  late String    _priority;

  @override
  void initState() {
    super.initState();
    _date     = widget.nextDate;
    _priority = widget.priority;
  }

  void _emit() => widget.onChanged(_date, _priority);

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _date ?? DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.brass,
            onPrimary: Colors.white,
            surface: AppColors.surface,
          ),
        ),
        child: child!,
      ),
    );
    if (d != null) { setState(() => _date = d); _emit(); }
  }

  @override
  Widget build(BuildContext context) {
    const months = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
                    'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
    final dateLabel = _date != null
        ? '${_date!.day} ${months[_date!.month - 1]} ${_date!.year}'
        : 'তারিখ বেছে নিন';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('পরবর্তী তারিখ', style: AppTypography.h2.copyWith(color: AppColors.navy)),
        const SizedBox(height: 4),
        Text('পরের হিয়ারিং কবে?', style: AppTypography.caption.copyWith(color: AppColors.muted)),
        const SizedBox(height: 24),

        // Date picker button
        GestureDetector(
          onTap: _pickDate,
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _date != null ? AppColors.brass : AppColors.border,
                width: _date != null ? 1.5 : 1,
              ),
            ),
            child: Row(children: [
              Icon(Icons.calendar_today,
                color: _date != null ? AppColors.brass : AppColors.muted, size: 22),
              const SizedBox(width: 14),
              Text(dateLabel,
                style: AppTypography.body.copyWith(
                  color: _date != null ? AppColors.navy : AppColors.muted,
                  fontWeight: _date != null ? FontWeight.w600 : FontWeight.w400,
                )),
            ]),
          ),
        ),
        const SizedBox(height: 24),

        _FieldLabel('অগ্রাধিকার'),
        const SizedBox(height: 10),
        Row(children: widget.priorities.map((p) {
          final (id, label) = p;
          final active = _priority == id;
          return Expanded(child: Padding(
            padding: EdgeInsets.only(right: id != 'low' ? 8 : 0),
            child: GestureDetector(
              onTap: () { setState(() => _priority = id); _emit(); },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 120),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color:  active ? AppColors.brassLighter : AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: active ? AppColors.brass : AppColors.border,
                    width: active ? 1.5 : 1,
                  ),
                ),
                alignment: Alignment.center,
                child: Text(label, style: AppTypography.bodyMedium.copyWith(
                  color:      active ? AppColors.warning : AppColors.muted,
                  fontWeight: active ? FontWeight.w700   : FontWeight.w400,
                )),
              ),
            ),
          ));
        }).toList()),
        const SizedBox(height: 40),
        Row(children: [
          Expanded(child: OutlinedButton(
            onPressed: widget.onBack,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: const BorderSide(color: AppColors.border),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('← পেছনে',
              style: AppTypography.body.copyWith(color: AppColors.muted)),
          )),
          const SizedBox(width: 12),
          Expanded(flex: 2,
            child: BrassButton(
              label: '✓ মামলা সংরক্ষণ করুন',
              loading: widget.saving,
              onPressed: widget.onSave,
            )),
        ]),
      ]),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
Widget _FieldLabel(String t) => Text(t,
  style: AppTypography.caption.copyWith(
    color: AppColors.muted, fontWeight: FontWeight.w600));
