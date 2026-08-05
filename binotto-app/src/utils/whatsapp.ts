const ANDROID_LINK = "https://play.google.com/store/apps/details?id=com.binotto.mobile";
const IOS_LINK = "https://apps.apple.com/app/6766981634";

export const INVITE_MESSAGE_PT_BR = (techName: string, workshopName: string, appLink: string) => {
  return `Olá, ${techName}! 👋

Você foi convidado(a) pela oficina "${workshopName}" para usar o app Binotto.

Com o aplicativo você pode:
• Receber ordens de serviço
• Acompanhar serviços em andamento
• Se conectar diretamente com oficinas

📲 Baixe o app:
Android: ${ANDROID_LINK}
iOS (iPhone): ${IOS_LINK}

Seja bem-vindo(a)! 🚗🔧`;
};

export const INVITE_MESSAGE_EN = (techName: string, workshopName: string, appLink: string) => {
  return `Hello, ${techName}! 👋

You have been invited by the workshop "${workshopName}" to use the Binotto app.

With the app you can:
• Receive work orders
• Track ongoing services
• Connect directly with workshops

📲 Download the app:
Android: ${ANDROID_LINK}
iOS (iPhone): ${IOS_LINK}

Welcome! 🚗🔧`;
};

export const INVITE_MESSAGE_IT = (techName: string, workshopName: string, appLink: string) => {
  return `Ciao, ${techName}! 👋

Sei stato invitato dall'officina "${workshopName}" a utilizzare l'app Binotto.

Con l'app puoi:
• Ricevere ordini di lavoro
• Monitorare i servizi in corso
• Connetterti direttamente con le officine

📲 Scarica l'app:
Android: ${ANDROID_LINK}
iOS (iPhone): ${IOS_LINK}

Benvenuto! 🚗🔧`;
};

export const INVITE_MESSAGE_FR = (techName: string, workshopName: string, appLink: string) => {
  return `Bonjour, ${techName}! 👋

Vous avez été invité par l'atelier "${workshopName}" à utiliser l'application Binotto.

Avec l'application vous pouvez:
• Recevoir des ordres de service
• Suivre les services en cours
• Vous connecter directement aux ateliers

📲 Téléchargez l'application:
Android: ${ANDROID_LINK}
iOS (iPhone): ${IOS_LINK}

Bienvenue! 🚗🔧`;
};

export const buildInviteMessage = (techName: string, workshopName: string, accessNumber?: string, passInvite?: string) => {
  const appLink = "https://app.binotto.com/download";
  const accessNumberNormalize = accessNumber?.replace(/\D/g, "");

  return `Olá, ${techName}! 👋

Você foi convidado pela oficina "${workshopName}" para fazer parte da plataforma Binotto.

Com o app você poderá:
• Receber ordens de serviço
• Acompanhar serviços em andamento
• Se conectar diretamente com oficinas

${
  accessNumber && passInvite
    ? `🔐 Seu primeiro acesso é:
Login: ${accessNumberNormalize}
Senha: ${passInvite}

Para finalizar seu cadastro, informe esses dados no login do aplicativo.`
    : ""
}

📲 Acesse o app:
Android: ${ANDROID_LINK}
iOS (iPhone): ${IOS_LINK}

Seja bem-vindo! 🚗🔧`;
};

export const buildInviteMessage2 = (techName: string, workshopName: string, locale:string) => {
  const appLink = "https://app.binotto.com/download";

  switch (locale) {
    case "en-US":
      return INVITE_MESSAGE_EN(techName, workshopName, appLink);

    case "it-IT":
      return INVITE_MESSAGE_IT(techName, workshopName, appLink);

    case "fr-FR":
      return INVITE_MESSAGE_FR(techName, workshopName, appLink);

    case "pt-BR":
    default:
      return INVITE_MESSAGE_PT_BR(techName, workshopName, appLink);
  }
};

export const buildWhatsappUrl = (phone: string, message: string) => {
  let digits = phone.replace(/\D/g, "");

  const text = encodeURIComponent(message);

  return `https://wa.me/${digits}?text=${text}`;
};

export const isValidPhoneWhatsapp = (phone: string) => {
  if (!phone) return false;

  const digits = phone.replace(/\D/g, "");

  if (digits.length < 10 || digits.length > 15) {
    return false;
  }

  return true;
};