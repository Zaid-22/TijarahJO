import type { Language } from "../../types";
import type { LoginValidationMessages } from "./loginValidation";

export interface LoginCopy {
  form: {
    signUpTitle: string;
    signInTitle: string;
    signUpSubtitle: string;
    signInSubtitle: string;
    firstNameLabel: string;
    firstNamePlaceholder: string;
    lastNameLabel: string;
    lastNamePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    cityLabel: string;
    cityPlaceholder: string;
    areaLabel: string;
    areaPlaceholder: string;
    identifierLabel: string;
    identifierPlaceholder: string;
    identifierSignUpLabel: string;
    identifierSignUpPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    creatingAccount: string;
    signingIn: string;
    createAccount: string;
    signInButton: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    signInLink: string;
    signUpLink: string;
    continueWithGoogle: string;
    orUseEmail: string;
    forgotPassword: string;
    continueAsGuest: string;
    showPassword: string;
    hidePassword: string;
    twoFactorTitle: string;
    twoFactorSubtitle: string;
    twoFactorCodeLabel: string;
    twoFactorCodePlaceholder: string;
    twoFactorResendPrompt: string;
    twoFactorResendAction: string;
    twoFactorResending: string;
    verifyTwoFactorButton: string;
    verifyingTwoFactor: string;
    cancelTwoFactor: string;
    profilePhoto: string;
    uploadPhotoOptional: string;
    tapToUpload: string;
  };
  errors: {
    backendConnection: string;
    unexpected: string;
    duplicateHintSuffix: string;
    signUpInvalidIdentifierPrompt: string;
    signUpIdentifierMustBeEmail: string;
    signUpInvalidPhonePrompt: string;
    signUpCityRequiredPrompt: string;
    signUpAreaRequiredPrompt: string;
    registrationFailedFallback: string;
    loginFailedFallback: string;
    googleAuthFailedFallback: string;
    twoFactorRequiredPrompt: string;
    twoFactorCodeInvalid: string;
    twoFactorSessionExpired: string;
  };
  validation: LoginValidationMessages;
}

const loginCopyByLanguage: Record<Language, LoginCopy> = {
  en: {
    form: {
      signUpTitle: "Sign Up",
      signInTitle: "Sign In",
      signUpSubtitle:
        "Create your TijarahJo account to start buying and selling",
      signInSubtitle: "",
      firstNameLabel: "First Name",
      firstNamePlaceholder: "First name",
      lastNameLabel: "Last Name",
      lastNamePlaceholder: "Last name",
      phoneLabel: "Phone Number",
      phonePlaceholder: "07XXXXXXXX",
      cityLabel: "City",
      cityPlaceholder: "City",
      areaLabel: "Area",
      areaPlaceholder: "Area",
      identifierLabel: "Email or Phone",
      identifierPlaceholder: "Email address or phone number",
      identifierSignUpLabel: "Email Address",
      identifierSignUpPlaceholder: "your@email.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Password",
      confirmPasswordLabel: "Confirm Password",
      confirmPasswordPlaceholder: "Confirm password",
      creatingAccount: "Creating Account...",
      signingIn: "Signing In...",
      createAccount: "Create Account",
      signInButton: "Sign In",
      alreadyHaveAccount: "Already have an account?",
      dontHaveAccount: "Don't have an account?",
      signInLink: "Sign in",
      signUpLink: "Sign up",
      continueWithGoogle: "Continue with Google",
      orUseEmail: "or continue with email",
      forgotPassword: "Forgot password?",
      continueAsGuest: "Continue as Guest",
      showPassword: "Show password",
      hidePassword: "Hide password",
      twoFactorTitle: "Two-Factor Verification",
      twoFactorSubtitle: "Enter the 6-digit code sent to your email.",
      twoFactorCodeLabel: "Verification Code",
      twoFactorCodePlaceholder: "",
      twoFactorResendPrompt: "Didn't get the code?",
      twoFactorResendAction: "Resend it",
      twoFactorResending: "Resending...",
      verifyTwoFactorButton: "Verify Code",
      verifyingTwoFactor: "Verifying...",
      cancelTwoFactor: "Back to Sign In",
      profilePhoto: "Profile Photo",
      uploadPhotoOptional: "Upload a photo (optional)",
      tapToUpload: "Tap to upload",
    },
    errors: {
      backendConnection: "Unable to connect to the server. Please try again later.",
      unexpected: "An unexpected error occurred. Please try again.",
      duplicateHintSuffix:
        "Try using different credentials, or switch to sign in if you already have an account.",
      signUpInvalidIdentifierPrompt:
        "Please enter a valid email address or Jordanian phone number.",
      signUpIdentifierMustBeEmail:
        "Please enter your email address here. Use the Phone Number field below for your phone.",
      signUpInvalidPhonePrompt:
        "Please enter a valid Jordanian phone number starting with 077, 078, or 079.",
      signUpCityRequiredPrompt: "Please enter your city.",
      signUpAreaRequiredPrompt: "Please enter your area.",
      registrationFailedFallback: "Registration failed. Please try again.",
      loginFailedFallback: "Invalid email, phone number, or password.",
      googleAuthFailedFallback: "Google sign-in failed. Please try again.",
      twoFactorRequiredPrompt:
        "Two-factor verification is required. Enter the code sent to your email.",
      twoFactorCodeInvalid: "Enter a valid 6-digit verification code.",
      twoFactorSessionExpired:
        "Two-factor session expired. Please sign in again.",
    },
    validation: {
      identifierRequired: "Email or phone is required",
      identifierInvalid: "Enter a valid email or Jordanian phone number",
      emailRequired: "Email address is required",
      emailInvalid: "Enter a valid email address",
      passwordRequired: "Password is required",
      passwordMinLength: "Password must be at least 8 characters",
      passwordUppercase: "Password must contain at least one uppercase letter",
      passwordLowercase: "Password must contain at least one lowercase letter",
      passwordNumber: "Password must contain at least one number",
      passwordSpecial:
        "Password must contain at least one special character (!@#$%^&*...)",
      confirmPasswordRequired: "Please confirm your password",
      confirmPasswordMismatch: "Passwords do not match",
      firstNameRequired: "First name is required",
      lastNameRequired: "Last name is required",
      phoneRequired: "Phone number is required",
      phoneInvalid: "Must be a 9-digit number starting with 77, 78, or 79",
      cityRequired: "City is required",
      areaRequired: "Area is required",
    },
  },
  ar: {
    form: {
      signUpTitle: "إنشاء حساب",
      signInTitle: "تسجيل الدخول",
      signUpSubtitle: "أنشئ حسابك في تجارة جو لبدء البيع والشراء",
      signInSubtitle: "",
      firstNameLabel: "الاسم الأول",
      firstNamePlaceholder: "الاسم الأول",
      lastNameLabel: "اسم العائلة",
      lastNamePlaceholder: "اسم العائلة",
      phoneLabel: "رقم الهاتف",
      phonePlaceholder: "07XXXXXXXX",
      cityLabel: "المدينة",
      cityPlaceholder: "المدينة",
      areaLabel: "المنطقة",
      areaPlaceholder: "المنطقة",
      identifierLabel: "البريد الإلكتروني أو الهاتف",
      identifierPlaceholder: "البريد الإلكتروني أو رقم الهاتف",
      identifierSignUpLabel: "البريد الإلكتروني",
      identifierSignUpPlaceholder: "your@email.com",
      passwordLabel: "كلمة المرور",
      passwordPlaceholder: "كلمة المرور",
      confirmPasswordLabel: "تأكيد كلمة المرور",
      confirmPasswordPlaceholder: "تأكيد كلمة المرور",
      creatingAccount: "جارٍ إنشاء الحساب...",
      signingIn: "جارٍ تسجيل الدخول...",
      createAccount: "إنشاء الحساب",
      signInButton: "تسجيل الدخول",
      alreadyHaveAccount: "لديك حساب بالفعل؟",
      dontHaveAccount: "ليس لديك حساب؟",
      signInLink: "تسجيل الدخول",
      signUpLink: "إنشاء حساب",
      continueWithGoogle: "المتابعة باستخدام Google",
      orUseEmail: "أو المتابعة بالبريد الإلكتروني",
      forgotPassword: "هل نسيت كلمة المرور؟",
      continueAsGuest: "المتابعة كزائر",
      showPassword: "إظهار كلمة المرور",
      hidePassword: "إخفاء كلمة المرور",
      twoFactorTitle: "التحقق بخطوتين",
      twoFactorSubtitle:
        "أدخل رمز التحقق المكوّن من 6 أرقام المرسل إلى بريدك الإلكتروني.",
      twoFactorCodeLabel: "رمز التحقق",
      twoFactorCodePlaceholder: "",
      twoFactorResendPrompt: "لم يصلك الرمز؟",
      twoFactorResendAction: "إعادة الإرسال",
      twoFactorResending: "جارٍ الإرسال...",
      verifyTwoFactorButton: "تأكيد الرمز",
      verifyingTwoFactor: "جارٍ التحقق...",
      cancelTwoFactor: "العودة لتسجيل الدخول",
      profilePhoto: "صورة الملف الشخصي",
      uploadPhotoOptional: "تحميل صورة (اختياري)",
      tapToUpload: "انقر للتحميل",
    },
    errors: {
      backendConnection: "فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.",
      unexpected: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
      duplicateHintSuffix:
        "جرّب بيانات اعتماد مختلفة، أو انتقل إلى تسجيل الدخول إذا كان لديك حساب بالفعل.",
      signUpInvalidIdentifierPrompt:
        "يرجى إدخال بريد إلكتروني صالح أو رقم هاتف أردني صالح.",
      signUpIdentifierMustBeEmail:
        "يرجى إدخال بريدك الإلكتروني هنا. استخدم حقل رقم الهاتف أدناه لإدخال هاتفك.",
      signUpInvalidPhonePrompt:
        "يرجى إدخال رقم هاتف متوافق يبدأ بـ 77 أو 78 أو 79.",
      signUpCityRequiredPrompt: "يرجى إدخال المدينة.",
      signUpAreaRequiredPrompt: "يرجى إدخال المنطقة.",
      registrationFailedFallback: "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.",
      loginFailedFallback:
        "البريد الإلكتروني أو رقم الهاتف أو كلمة المرور غير صحيحة.",
      googleAuthFailedFallback:
        "فشل تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.",
      twoFactorRequiredPrompt:
        "المصادقة الثنائية مطلوبة. أدخل الرمز المرسل إلى بريدك الإلكتروني.",
      twoFactorCodeInvalid: "أدخل رمز تحقق صالحًا مكوّنًا من 6 أرقام.",
      twoFactorSessionExpired:
        "انتهت جلسة المصادقة الثنائية. سجّل الدخول مرة أخرى.",
    },
    validation: {
      identifierRequired: "البريد الإلكتروني أو الهاتف مطلوب",
      identifierInvalid:
        "أدخل بريدًا إلكترونيًا صالحًا أو رقم هاتف أردني صالحًا",
      emailRequired: "البريد الإلكتروني مطلوب",
      emailInvalid: "أدخل بريدًا إلكترونيًا صالحًا",
      passwordRequired: "كلمة المرور مطلوبة",
      passwordMinLength: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
      passwordUppercase: "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل",
      passwordLowercase: "يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل",
      passwordNumber: "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل",
      passwordSpecial:
        "يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل (!@#$%^&*...)",
      confirmPasswordRequired: "يرجى تأكيد كلمة المرور",
      confirmPasswordMismatch: "كلمتا المرور غير متطابقتين",
      firstNameRequired: "الاسم الأول مطلوب",
      lastNameRequired: "اسم العائلة مطلوب",
      phoneRequired: "رقم الهاتف مطلوب",
      phoneInvalid: "الرقم يجب أن يتكون من 9 أرقام ويبدأ بـ 77, 78, أو 79",
      cityRequired: "المدينة مطلوبة",
      areaRequired: "المنطقة مطلوبة",
    },
  },
};

export function getLoginCopy(language: Language): LoginCopy {
  return loginCopyByLanguage[language];
}
