import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/auth/auth_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneCtrl = TextEditingController();
  final _otpCtrl   = TextEditingController();
  bool  _otpSent   = false;
  bool  _loading   = false;
  String? _error;

  @override
  void dispose() { _phoneCtrl.dispose(); _otpCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (_, next) {
      if (next.error != null) {
        setState(() { _loading = false; _error = next.error; });
      }
    });

    return Scaffold(
      backgroundColor: AppColors.parchment,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 48),
              // Logo / wordmark
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  color: AppColors.navy, borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Text('⚖️', style: TextStyle(fontSize: 28)),
                ),
              ),
              const SizedBox(height: 24),
              Text('আইনজীবী ডায়েরি BD',
                style: AppTypography.h1.copyWith(color: AppColors.navy)),
              Text('আপনার মোবাইল নম্বর দিয়ে লগইন করুন',
                style: AppTypography.bodyMedium.copyWith(color: AppColors.muted)),
              const SizedBox(height: 40),

              // Phone field
              if (!_otpSent) ...[
                Text('মোবাইল নম্বর',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.muted, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Row(children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.border),
                      borderRadius: BorderRadius.circular(10),
                      color: AppColors.surface,
                    ),
                    child: Text('+880', style: AppTypography.body.copyWith(color: AppColors.ink)),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      maxLength: 10,
                      decoration: const InputDecoration(
                        hintText: '01XXXXXXXXX',
                        counterText: '',
                      ),
                      style: AppTypography.body.copyWith(color: AppColors.ink),
                    ),
                  ),
                ]),
                const SizedBox(height: 24),
                _PrimaryButton(
                  label: 'OTP পাঠান',
                  loading: _loading,
                  onPressed: _requestOtp,
                ),
                const SizedBox(height: 12),
                // Testing: enter app without sending/receiving OTP
                _BypassButton(
                  loading: _loading,
                  onPressed: _bypassOtpForTesting,
                ),
              ],

              // OTP field
              if (_otpSent) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.successBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.success.withOpacity(0.3)),
                  ),
                  child: Row(children: [
                    const Text('✅', style: TextStyle(fontSize: 16)),
                    const SizedBox(width: 10),
                    Expanded(child: Text(
                      '+880${_phoneCtrl.text}-এ OTP পাঠানো হয়েছে',
                      style: AppTypography.caption.copyWith(color: AppColors.success),
                    )),
                  ]),
                ),
                const SizedBox(height: 24),
                Text('OTP কোড (৬ সংখ্যা)',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.muted, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                TextField(
                  controller: _otpCtrl,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: AppTypography.monoLarge.copyWith(
                    color: AppColors.navy, letterSpacing: 8),
                  decoration: const InputDecoration(counterText: ''),
                ),
                const SizedBox(height: 24),
                _PrimaryButton(
                  label: 'লগইন করুন',
                  loading: _loading,
                  onPressed: _verifyOtp,
                ),
                const SizedBox(height: 12),
                // Testing: same bypass if user somehow reached OTP step
                _BypassButton(
                  loading: _loading,
                  onPressed: _bypassOtpForTesting,
                ),
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: () => setState(() { _otpSent = false; _error = null; }),
                    child: Text('নম্বর পরিবর্তন করুন',
                      style: AppTypography.caption.copyWith(color: AppColors.info)),
                  ),
                ),
              ],

              // Error
              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.dangerBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(_error!,
                    style: AppTypography.caption.copyWith(color: AppColors.danger)),
                ),
              ],

              const SizedBox(height: 48),
              Center(
                child: Text(
                  'আপনার তথ্য সম্পূর্ণ নিরাপদ ও এনক্রিপ্টেড',
                  style: AppTypography.caption.copyWith(color: AppColors.muted, fontSize: 11),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _requestOtp() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.length < 10) {
      setState(() => _error = 'সঠিক মোবাইল নম্বর দিন');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).requestOtp('+880$phone');
      setState(() { _otpSent = true; _loading = false; });
    } catch (e) {
      setState(() { _error = 'OTP পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'; _loading = false; });
    }
  }

  Future<void> _verifyOtp() async {
    final otp = _otpCtrl.text.trim();
    if (otp.length != 6) {
      setState(() => _error = '৬ সংখ্যার OTP কোড দিন');
      return;
    }
    setState(() { _loading = true; _error = null; });
    await ref.read(authProvider.notifier).verifyOtp(
      '+880${_phoneCtrl.text}', otp,
    );
    if (mounted) setState(() => _loading = false);
  }

  /// Testing: skip OTP and enter the main app (same auth success path).
  Future<void> _bypassOtpForTesting() async {
    setState(() { _loading = true; _error = null; });
    final phone = _phoneCtrl.text.trim();
    await ref.read(authProvider.notifier).bypassOtpForTesting(
      phone: phone.isEmpty ? null : '+880$phone',
    );
    if (mounted) setState(() => _loading = false);
  }
}

class _PrimaryButton extends StatelessWidget {
  final String label;
  final bool loading;
  final VoidCallback onPressed;
  const _PrimaryButton({required this.label, required this.loading, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: loading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brass,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
        child: loading
            ? const SizedBox(width: 20, height: 20,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Text(label,
                style: AppTypography.body.copyWith(
                  color: Colors.white, fontWeight: FontWeight.w700)),
      ),
    );
  }
}

/// Testing-only bypass — visible without needing OTP send/verify.
class _BypassButton extends StatelessWidget {
  final bool loading;
  final VoidCallback onPressed;
  const _BypassButton({required this.loading, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: loading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          foregroundColor: AppColors.navy,
        ),
        child: Text(
          'Next — OTP ছাড়া ঢুকুন',
          style: AppTypography.body.copyWith(
            color: AppColors.navy,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}
