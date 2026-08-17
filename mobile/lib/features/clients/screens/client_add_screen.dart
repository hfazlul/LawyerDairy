import 'package:drift/drift.dart' show Value;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/db/database_provider.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/db/database.dart';
import '../../../shared/widgets/brass_button.dart';

class ClientAddScreen extends ConsumerStatefulWidget {
  const ClientAddScreen({super.key});
  @override
  ConsumerState<ClientAddScreen> createState() => _ClientAddScreenState();
}

class _ClientAddScreenState extends ConsumerState<ClientAddScreen> {
  final _formKey    = GlobalKey<FormState>();
  final _nameCtrl   = TextEditingController();
  final _phoneCtrl  = TextEditingController();
  final _altCtrl    = TextEditingController();
  final _emailCtrl  = TextEditingController();
  final _nidCtrl    = TextEditingController();
  final _addrCtrl   = TextEditingController();
  final _fileCtrl   = TextEditingController();
  final _noteCtrl   = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    for (final c in [_nameCtrl,_phoneCtrl,_altCtrl,_emailCtrl,
        _nidCtrl,_addrCtrl,_fileCtrl,_noteCtrl]) c.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final chamberId = ref.read(chamberIdProvider);
      final dao       = ref.read(clientDaoProvider);
      await dao.upsertClient(ClientsCompanion.insert(
        id:        const Uuid().v4(),
        chamberId: chamberId,
        name:      _nameCtrl.text.trim(),
        phone:     Value(_phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim()),
        altPhone:  Value(_altCtrl.text.trim().isEmpty   ? null : _altCtrl.text.trim()),
        email:     Value(_emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim()),
        nid:       Value(_nidCtrl.text.trim().isEmpty   ? null : _nidCtrl.text.trim()),
        address:   Value(_addrCtrl.text.trim().isEmpty  ? null : _addrCtrl.text.trim()),
        fileNo:    Value(_fileCtrl.text.trim().isEmpty  ? null : _fileCtrl.text.trim()),
        note:      Value(_noteCtrl.text.trim().isEmpty  ? null : _noteCtrl.text.trim()),
        createdAt: DateTime.now(),
      ));
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('ক্লায়েন্ট সংরক্ষিত হয়েছে',
            style: AppTypography.caption.copyWith(color: Colors.white)),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('সমস্যা: $e',
          style: AppTypography.caption.copyWith(color: Colors.white)),
        backgroundColor: AppColors.danger,
        behavior: SnackBarBehavior.floating));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.parchment,
      appBar: AppBar(
        title: const Text('নতুন ক্লায়েন্ট'),
        backgroundColor: AppColors.navy,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context)),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _Section('মূল তথ্য'),
            _Field('নাম *', _nameCtrl,
              hint: 'মোঃ রফিকুল ইসলাম',
              validator: (v) => v == null || v.isEmpty ? 'নাম দিন' : null),
            _Field('মোবাইল নম্বর', _phoneCtrl,
              hint: '01XXXXXXXXX',
              type: TextInputType.phone,
              formatters: [FilteringTextInputFormatter.digitsOnly],
              maxLen: 11),
            _Field('বিকল্প নম্বর', _altCtrl,
              hint: 'ঐচ্ছিক',
              type: TextInputType.phone,
              formatters: [FilteringTextInputFormatter.digitsOnly],
              maxLen: 11),
            _Field('ইমেইল', _emailCtrl,
              hint: 'example@mail.com',
              type: TextInputType.emailAddress),
            const SizedBox(height: 8),
            _Section('পরিচয় তথ্য'),
            _Field('NID নম্বর', _nidCtrl,
              hint: '১৯৮৮XXXXXXXXX',
              type: TextInputType.number,
              formatters: [FilteringTextInputFormatter.digitsOnly]),
            _Field('ঠিকানা', _addrCtrl,
              hint: 'গ্রাম, ডাকঘর, উপজেলা, জেলা',
              maxLines: 3),
            _Field('ফাইল নম্বর', _fileCtrl, hint: 'F-2024-001'),
            const SizedBox(height: 8),
            _Section('নোট'),
            _Field('বিস্তারিত নোট', _noteCtrl,
              hint: 'যেকোনো প্রয়োজনীয় তথ্য...',
              maxLines: 4),
            const SizedBox(height: 24),
            BrassButton(
              label: '✓ ক্লায়েন্ট সংরক্ষণ করুন',
              loading: _saving,
              onPressed: _save,
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  const _Section(this.title);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12, top: 8),
    child: Text(title, style: AppTypography.caption.copyWith(
      color: AppColors.muted, fontWeight: FontWeight.w600,
      letterSpacing: 0.5)),
  );
}

class _Field extends StatelessWidget {
  final String label, hint;
  final TextEditingController ctrl;
  final TextInputType? type;
  final List<TextInputFormatter>? formatters;
  final int? maxLen, maxLines;
  final String? Function(String?)? validator;

  const _Field(this.label, this.ctrl, {
    required this.hint, this.type, this.formatters,
    this.maxLen, this.maxLines = 1, this.validator});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: TextFormField(
      controller: ctrl,
      keyboardType: type,
      inputFormatters: formatters,
      maxLength: maxLen,
      maxLines: maxLines,
      validator: validator,
      decoration: InputDecoration(
        labelText: label, hintText: hint, counterText: ''),
    ),
  );
}
