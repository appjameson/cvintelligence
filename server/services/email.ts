// server/services/email.ts

import nodemailer from 'nodemailer';
import { storage } from '../storage';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: MailOptions) {
  // 1. Busca todas as configurações de SMTP do banco de dados
  const host = await storage.getSetting('EMAIL_SMTP_HOST');
  const port = await storage.getSetting('EMAIL_SMTP_PORT');
  const user = await storage.getSetting('EMAIL_SMTP_USER');
  const pass = await storage.getSetting('EMAIL_SMTP_PASSWORD');
  const from = await storage.getSetting('EMAIL_FROM_ADDRESS');

  // 2. Verifica se as configurações essenciais existem
  if (!host || !port || !user || !pass || !from) {
    console.error('Configurações de SMTP incompletas. E-mail não enviado.');
    // Em um cenário real, você poderia lançar um erro ou ter um fallback
    return;
  }

  // 3. Cria um "transportador" do Nodemailer com as configurações do banco
  const transporter = nodemailer.createTransport({
    host: host,
    port: Number(port),
    secure: Number(port) === 465, // `true` para porta 465, `false` para as outras
    auth: {
      user: user,
      pass: pass,
    },
  });

  // 4. Monta e envia o e-mail
  try {
    const info = await transporter.sendMail({
      from: `"CVIntelligence" <${from}>`, // Nome do remetente e e-mail
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log('E-mail enviado com sucesso: %s', info.messageId);
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
  }
}