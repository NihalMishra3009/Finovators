import 'package:flutter/material.dart';

const Duration _kOverlayDuration = Duration(milliseconds: 260);
const Curve _kOverlayCurve = Curves.easeOutCubic;

Future<T?> showAnimatedDialog<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  bool barrierDismissible = true,
  Color? barrierColor,
  String? barrierLabel,
  bool useSafeArea = true,
  bool useRootNavigator = true,
  RouteSettings? routeSettings,
}) {
  return showGeneralDialog<T>(
    context: context,
    barrierDismissible: barrierDismissible,
    barrierLabel: barrierLabel ?? MaterialLocalizations.of(context).modalBarrierDismissLabel,
    barrierColor: barrierColor ?? Colors.black54,
    routeSettings: routeSettings,
    transitionDuration: _kOverlayDuration,
    pageBuilder: (ctx, _, __) {
      final child = Builder(builder: builder);
      return useSafeArea ? SafeArea(child: child) : child;
    },
    transitionBuilder: (ctx, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(parent: animation, curve: _kOverlayCurve, reverseCurve: Curves.easeInCubic);
      return FadeTransition(
        opacity: curved,
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.96, end: 1).animate(curved),
          child: child,
        ),
      );
    },
    useRootNavigator: useRootNavigator,
  );
}

Future<T?> showAnimatedBottomSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  Color? backgroundColor,
  double? elevation,
  ShapeBorder? shape,
  Clip? clipBehavior,
  BoxConstraints? constraints,
  Color? barrierColor,
  bool isScrollControlled = false,
  bool useRootNavigator = false,
  bool isDismissible = true,
  bool enableDrag = true,
  bool useSafeArea = false,
  bool? requestFocus,
  RouteSettings? routeSettings,
}) {
  return showModalBottomSheet<T>(
    context: context,
    builder: builder,
    backgroundColor: backgroundColor,
    elevation: elevation,
    shape: shape,
    clipBehavior: clipBehavior,
    constraints: constraints,
    barrierColor: barrierColor,
    isScrollControlled: isScrollControlled,
    useRootNavigator: useRootNavigator,
    isDismissible: isDismissible,
    enableDrag: enableDrag,
    useSafeArea: useSafeArea,
    requestFocus: requestFocus,
    routeSettings: routeSettings,
    sheetAnimationStyle: const AnimationStyle(
      duration: _kOverlayDuration,
      reverseDuration: _kOverlayDuration,
    ),
  );
}
